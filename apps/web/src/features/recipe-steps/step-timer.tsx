import { useEffect, useRef } from 'react';
import { CheckCircle2, Clock3, Pause, Play } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useCountdownTimer } from './use-countdown-timer';
import { formatDuration } from './time-format';

type StepTimerProps = {
  recipeId: string;
  stepId: string;
  durationSeconds: number | null;
  timerStartedAt: string | null;
  completedAt: string | null;
  readOnly?: boolean;
  resetNonce: number;
  onStart: () => void;
};

export function StepTimer({ recipeId, stepId, durationSeconds, timerStartedAt, completedAt, readOnly = false, resetNonce, onStart }: StepTimerProps) {
  const storageKey = durationSeconds ? `recipe-timer:v1:${recipeId}:${stepId}` : undefined;
  const { secondsLeft, isRunning, isComplete, start, pause, stop, reset } = useCountdownTimer(durationSeconds, {
    storageKey,
    autoStartAt: completedAt ? null : timerStartedAt
  });
  const previousCompletedAtRef = useRef<string | null>(completedAt);
  const previousTimerStartedAtRef = useRef<string | null>(timerStartedAt);
  const previousResetNonceRef = useRef(resetNonce);

  useEffect(() => {
    if (!previousCompletedAtRef.current && completedAt) {
      stop();
    }

    if (previousCompletedAtRef.current && !completedAt) {
      reset();
    }

    previousCompletedAtRef.current = completedAt;
  }, [completedAt, reset, stop]);

  useEffect(() => {
    if (previousTimerStartedAtRef.current && !timerStartedAt && !completedAt) {
      reset();
    }

    previousTimerStartedAtRef.current = timerStartedAt;
  }, [completedAt, reset, timerStartedAt]);

  useEffect(() => {
    if (previousResetNonceRef.current !== resetNonce) {
      reset();
      previousResetNonceRef.current = resetNonce;
    }
  }, [reset, resetNonce]);

  if (!durationSeconds) {
    return null;
  }

  if (readOnly) {
    return (
      <Badge tone={isComplete ? 'success' : isRunning ? 'accent' : 'neutral'} className="px-3 py-2 text-xs tracking-[0.14em]">
        <Clock3 className="mr-1 h-3.5 w-3.5" />
        {formatDuration(secondsLeft)}
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        variant="secondary"
        className="h-8 w-8 min-w-0 px-0 sm:h-9 sm:min-w-[94px] sm:px-3.5"
        onClick={() => {
          if (isRunning) {
            pause();
            return;
          }

          start();
          if (!timerStartedAt) {
            onStart();
          }
        }}
        disabled={Boolean(completedAt)}
      >
        {completedAt ? <CheckCircle2 className="h-3.5 w-3.5" /> : isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{completedAt ? 'Done' : isRunning ? 'Pause' : 'Start'}</span>
      </Button>
      <Badge tone={isComplete ? 'success' : isRunning ? 'accent' : 'neutral'} className="px-3 py-2 text-xs tracking-[0.14em]">
        <Clock3 className="mr-1 h-3.5 w-3.5" />
        {formatDuration(secondsLeft)}
      </Badge>
    </div>
  );
}
