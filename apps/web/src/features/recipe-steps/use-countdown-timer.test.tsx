import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCountdownTimer } from './use-countdown-timer';

describe('useCountdownTimer', () => {
  it('counts down locally and stops at zero', () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useCountdownTimer(3));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.secondsLeft).toBe(1);
      expect(result.current.isRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.secondsLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('can restart after reaching zero', () => {
    vi.useFakeTimers();

    try {
      const { result } = renderHook(() => useCountdownTimer(2));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.secondsLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
      expect(result.current.secondsLeft).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores recipe-specific timer state from local storage', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-09T12:00:00.000Z'));

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
      vi.useRealTimers();
    }
  });
});
