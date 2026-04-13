import { useEffect, useRef, useState } from 'react';

type CountdownTimerOptions = {
  storageKey?: string;
  autoStartAt?: string | null;
};

type TimerState = {
  secondsLeft: number;
  isRunning: boolean;
  completedAtLeastOnce: boolean;
  deadlineAt: number | null;
};

type StoredTimerState = {
  version: 1;
  durationSeconds: number;
  secondsLeft: number;
  isRunning: boolean;
  completedAtLeastOnce: boolean;
  deadlineAt: number | null;
};

function getInitialDuration(durationSeconds: number | null) {
  return durationSeconds ?? 0;
}

function getStorageItem(storageKey: string | undefined) {
  if (!storageKey || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function setStorageItem(storageKey: string | undefined, value: StoredTimerState | null) {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage errors so timers still work in restricted browsers.
  }
}

function getRemainingSeconds(deadlineAt: number | null) {
  if (deadlineAt === null) {
    return 0;
  }

  return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
}

function getDefaultState(durationSeconds: number): TimerState {
  return {
    secondsLeft: durationSeconds,
    isRunning: false,
    completedAtLeastOnce: false,
    deadlineAt: null
  };
}

function getAutoStartedState(durationSeconds: number, autoStartAt: string | null | undefined): TimerState {
  if (!autoStartAt || durationSeconds <= 0) {
    return getDefaultState(durationSeconds);
  }

  const deadlineAt = new Date(autoStartAt).getTime() + durationSeconds * 1000;
  const secondsLeft = getRemainingSeconds(deadlineAt);

  return {
    secondsLeft,
    isRunning: secondsLeft > 0,
    completedAtLeastOnce: secondsLeft === 0,
    deadlineAt: secondsLeft > 0 ? deadlineAt : null
  };
}

function getStoredState(durationSeconds: number, storageKey: string | undefined) {
  const rawValue = getStorageItem(storageKey);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredTimerState;

    if (parsed.version !== 1 || parsed.durationSeconds !== durationSeconds) {
      setStorageItem(storageKey, null);
      return null;
    }

    if (parsed.isRunning && parsed.deadlineAt !== null) {
      const secondsLeft = getRemainingSeconds(parsed.deadlineAt);

      return {
        secondsLeft,
        isRunning: secondsLeft > 0,
        completedAtLeastOnce: secondsLeft === 0 ? true : parsed.completedAtLeastOnce,
        deadlineAt: secondsLeft > 0 ? parsed.deadlineAt : null
      } satisfies TimerState;
    }

    return {
      secondsLeft: parsed.secondsLeft,
      isRunning: false,
      completedAtLeastOnce: parsed.completedAtLeastOnce,
      deadlineAt: null
    } satisfies TimerState;
  } catch {
    setStorageItem(storageKey, null);
    return null;
  }
}

function buildInitialState(durationSeconds: number, options: CountdownTimerOptions) {
  return getStoredState(durationSeconds, options.storageKey) ?? getAutoStartedState(durationSeconds, options.autoStartAt);
}

export function useCountdownTimer(durationSeconds: number | null, options: CountdownTimerOptions = {}) {
  const normalizedDuration = getInitialDuration(durationSeconds);
  const [timerState, setTimerState] = useState<TimerState>(() => buildInitialState(normalizedDuration, options));
  const intervalRef = useRef<number | null>(null);
  const initialDurationRef = useRef(normalizedDuration);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    initialDurationRef.current = normalizedDuration;
    clearTimer();
    setTimerState(buildInitialState(normalizedDuration, options));
  }, [normalizedDuration, options.autoStartAt, options.storageKey]);

  useEffect(() => {
    if (!timerState.isRunning) {
      clearTimer();
      return;
    }

    const syncRemaining = () => {
      setTimerState((current) => {
        if (current.deadlineAt === null) {
          return current;
        }

        const secondsLeft = getRemainingSeconds(current.deadlineAt);

        if (secondsLeft === current.secondsLeft && current.isRunning) {
          return current;
        }

        if (secondsLeft === 0) {
          return {
            secondsLeft: 0,
            isRunning: false,
            completedAtLeastOnce: true,
            deadlineAt: null
          };
        }

        return {
          ...current,
          secondsLeft
        };
      });
    };

    syncRemaining();
    intervalRef.current = window.setInterval(syncRemaining, 1000);

    return () => {
      clearTimer();
    };
  }, [timerState.isRunning]);

  useEffect(() => {
    const isPristine =
      timerState.secondsLeft === initialDurationRef.current &&
      !timerState.isRunning &&
      !timerState.completedAtLeastOnce &&
      timerState.deadlineAt === null;

    if (isPristine) {
      setStorageItem(options.storageKey, null);
      return;
    }

    setStorageItem(options.storageKey, {
      version: 1,
      durationSeconds: initialDurationRef.current,
      secondsLeft: timerState.secondsLeft,
      isRunning: timerState.isRunning,
      completedAtLeastOnce: timerState.completedAtLeastOnce,
      deadlineAt: timerState.deadlineAt
    });
  }, [options.storageKey, timerState]);

  const start = () => {
    setTimerState((current) => {
      if (initialDurationRef.current <= 0) {
        return current;
      }

      const nextSeconds = current.secondsLeft > 0 ? current.secondsLeft : initialDurationRef.current;

      return {
        secondsLeft: nextSeconds,
        isRunning: true,
        completedAtLeastOnce: false,
        deadlineAt: Date.now() + nextSeconds * 1000
      };
    });
  };

  const pause = () => {
    setTimerState((current) => {
      if (current.deadlineAt === null) {
        return {
          ...current,
          isRunning: false
        };
      }

      return {
        ...current,
        secondsLeft: getRemainingSeconds(current.deadlineAt),
        isRunning: false,
        deadlineAt: null
      };
    });
  };

  const stop = () => {
    clearTimer();
    setTimerState((current) => ({
      ...current,
      secondsLeft: current.deadlineAt === null ? current.secondsLeft : getRemainingSeconds(current.deadlineAt),
      isRunning: false,
      deadlineAt: null
    }));
  };

  const reset = () => {
    clearTimer();
    setTimerState(getDefaultState(initialDurationRef.current));
  };

  return {
    secondsLeft: timerState.secondsLeft,
    isRunning: timerState.isRunning,
    isComplete: timerState.completedAtLeastOnce && timerState.secondsLeft === 0 && initialDurationRef.current > 0,
    start,
    pause,
    stop,
    reset
  };
}
