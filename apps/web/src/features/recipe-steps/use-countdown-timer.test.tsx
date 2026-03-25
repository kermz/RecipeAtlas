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
});
