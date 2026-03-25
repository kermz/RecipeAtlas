import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock3, GripVertical, Pencil, RotateCcw } from 'lucide-react';
import type { RecipeStep } from '../../lib/types';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StepTimer } from './step-timer';
import { formatDuration } from './time-format';

type StepCardProps = {
  step: RecipeStep;
  onEdit: (step: RecipeStep) => void;
  onComplete: (step: RecipeStep) => void;
  onReset: (step: RecipeStep) => void;
  onStartTimer: (step: RecipeStep) => void;
  dragHandleAttributes?: Record<string, unknown>;
  dragHandleListeners?: Record<string, unknown>;
  isDragging?: boolean;
};

export function StepCard({
  step,
  onEdit,
  onComplete,
  onReset,
  onStartTimer,
  dragHandleAttributes,
  dragHandleListeners,
  isDragging = false
}: StepCardProps) {
  const [resetNonce, setResetNonce] = useState(0);
  const elapsedSeconds = useElapsedSeconds(step.timerStartedAt, step.completedAt);

  return (
    <Card
      data-testid={`step-${step.id}`}
      className={`border border-white/10 bg-slate-950/35 p-5 transition hover:border-white/20 ${isDragging ? 'opacity-80 ring-2 ring-sky-300/50' : ''}`}
    >
      {step.completedAt ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Step {step.position}</Badge>
              <Badge tone="success">Done</Badge>
            </div>
            <h3 className="app-heading mt-3 text-2xl font-semibold text-white">{step.title}</h3>
            <div className="mt-3">
              <StepStatus timerStartedAt={step.timerStartedAt} completedAt={step.completedAt} elapsedSeconds={elapsedSeconds} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                setResetNonce((value) => value + 1);
                await Promise.resolve(onReset(step));
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset done
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onEdit(step)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <button
              aria-label={`Drag step ${step.position}`}
              className="inline-flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100 transition-all hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-transparent"
              type="button"
              {...dragHandleAttributes}
              {...dragHandleListeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Step {step.position}</Badge>
              <Badge tone="warning">Pending</Badge>
            </div>
            <h3 className="app-heading mt-3 text-2xl font-semibold text-white">{step.title}</h3>
            {step.instructions ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{step.instructions}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StepTimer
                durationSeconds={step.timerDurationSeconds}
                timerStartedAt={step.timerStartedAt}
                completedAt={step.completedAt}
                resetNonce={resetNonce}
                onStart={() => onStartTimer(step)}
              />
              <StepStatus timerStartedAt={step.timerStartedAt} completedAt={step.completedAt} elapsedSeconds={elapsedSeconds} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                await Promise.resolve(onComplete(step));
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark done
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onEdit(step)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <button
              aria-label={`Drag step ${step.position}`}
              className="inline-flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100 transition-all hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-transparent"
              type="button"
              {...dragHandleAttributes}
              {...dragHandleListeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function StepStatus({
  timerStartedAt,
  completedAt,
  elapsedSeconds
}: Pick<RecipeStep, 'timerStartedAt' | 'completedAt'> & { elapsedSeconds: number }) {
  if (completedAt) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-100">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed {format(new Date(completedAt), 'HH:mm:ss')}
      </div>
    );
  }

  if (timerStartedAt) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-sky-100">
        <Clock3 className="h-3.5 w-3.5" />
        <span>Started {format(new Date(timerStartedAt), 'HH:mm:ss')}</span>
        <Badge tone="accent">+ {formatDuration(elapsedSeconds)}</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Clock3 className="h-3.5 w-3.5" />
      Not completed yet
    </div>
  );
}

function useElapsedSeconds(timerStartedAt: string | null, completedAt: string | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => calculateElapsedSeconds(timerStartedAt, completedAt));

  useEffect(() => {
    setElapsedSeconds(calculateElapsedSeconds(timerStartedAt, completedAt));

    if (!timerStartedAt || completedAt) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds(calculateElapsedSeconds(timerStartedAt, null));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [completedAt, timerStartedAt]);

  return elapsedSeconds;
}

function calculateElapsedSeconds(timerStartedAt: string | null, completedAt: string | null) {
  if (!timerStartedAt) {
    return 0;
  }

  const startTime = new Date(timerStartedAt).getTime();
  const endTime = completedAt ? new Date(completedAt).getTime() : Date.now();

  return Math.max(0, Math.floor((endTime - startTime) / 1000));
}
