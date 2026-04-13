import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, setSystemTime } from 'bun:test';
import { useCountdownTimer } from './use-countdown-timer';

describe('useCountdownTimer', () => {
  it('counts down locally and stops at zero', async () => {
    const { result } = renderHook(() => useCountdownTimer(1));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.secondsLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);
    }, { timeout: 2500 });
  });

  it('can restart after reaching zero', async () => {
    const { result } = renderHook(() => useCountdownTimer(1));

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.secondsLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);
    }, { timeout: 2500 });

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.secondsLeft).toBe(1);
  });

  it('restores recipe-specific timer state from local storage', () => {
    setSystemTime(new Date('2026-04-09T12:00:00.000Z'));

    try {
      const storageKey = 'recipe-timer:v1:recipe-1:step-1';
      const { result, unmount } = renderHook(() =>
        useCountdownTimer(120, {
          storageKey,
          autoStartAt: '2026-04-09T11:59:30.000Z'
        })
      );

      expect(result.current.secondsLeft).toBe(90);
      expect(result.current.isRunning).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.secondsLeft).toBe(90);

      unmount();

      const restored = renderHook(() =>
        useCountdownTimer(120, {
          storageKey,
          autoStartAt: '2026-04-09T11:59:30.000Z'
        })
      );

      expect(restored.result.current.isRunning).toBe(false);
      expect(restored.result.current.secondsLeft).toBe(90);
    } finally {
      setSystemTime();
    }
  });
});
