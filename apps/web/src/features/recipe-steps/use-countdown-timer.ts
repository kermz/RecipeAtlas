import { useEffect, useRef, useState } from 'react';

export function useCountdownTimer(durationSeconds: number | null) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds ?? 0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedAtLeastOnce, setCompletedAtLeastOnce] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const initialDurationRef = useRef(durationSeconds ?? 0);
  const deadlineRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    const nextDuration = durationSeconds ?? 0;
    initialDurationRef.current = nextDuration;
    setSecondsLeft(nextDuration);
    setIsRunning(false);
    setCompletedAtLeastOnce(false);
    deadlineRef.current = null;
    clearTimer();
  }, [durationSeconds]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    const syncRemaining = () => {
      if (deadlineRef.current === null) {
        return;
      }

      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setIsRunning(false);
        setCompletedAtLeastOnce(true);
        deadlineRef.current = null;
        clearTimer();
      }
    };

    syncRemaining();
    intervalRef.current = window.setInterval(() => {
      syncRemaining();
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [isRunning]);

  const start = () => {
    if (initialDurationRef.current <= 0) {
      return;
    }

    const nextSeconds = secondsLeft > 0 ? secondsLeft : initialDurationRef.current;
    if (secondsLeft <= 0) {
      setSecondsLeft(nextSeconds);
    }

    deadlineRef.current = Date.now() + nextSeconds * 1000;
    setIsRunning(true);
    setCompletedAtLeastOnce(false);
  };

  const pause = () => {
    if (deadlineRef.current !== null) {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }

    deadlineRef.current = null;
    setIsRunning(false);
  };

  const stop = () => {
    clearTimer();

    if (deadlineRef.current !== null) {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }

    deadlineRef.current = null;
    setIsRunning(false);
  };

  const reset = () => {
    clearTimer();
    deadlineRef.current = null;
    setIsRunning(false);
    setSecondsLeft(initialDurationRef.current);
    setCompletedAtLeastOnce(false);
  };

  return {
    secondsLeft,
    isRunning,
    isComplete: completedAtLeastOnce && secondsLeft === 0 && initialDurationRef.current > 0,
    start,
    pause,
    stop,
    reset
  };
}
