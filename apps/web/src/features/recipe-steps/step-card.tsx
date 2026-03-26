import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, GripVertical, Pencil, RotateCcw } from 'lucide-react';
import type { RecipeStep } from '../../lib/types';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StepTimer } from './step-timer';
import { formatDuration } from './time-format';

type StepCardProps = {
  editMode: boolean;
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
  editMode,
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
      className={`overflow-hidden border px-3 pt-3 pb-2 transition duration-200 sm:px-6 sm:pt-6 sm:pb-4 ${
        step.completedAt
          ? 'border-[rgba(191,209,171,0.2)] bg-[linear-gradient(180deg,rgba(122,148,103,0.18),rgba(28,37,27,0.92))] hover:border-[rgba(191,209,171,0.3)] hover:bg-[linear-gradient(180deg,rgba(132,158,112,0.22),rgba(30,40,29,0.95))]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] hover:border-white/20 hover:bg-white/[0.07]'
      } ${isDragging ? 'opacity-80 ring-2 ring-[rgba(191,209,171,0.5)]' : ''}`}
    >
      {step.completedAt ? (
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:block">
              <h3 className="app-heading flex min-w-0 items-baseline gap-1.5 text-[1.05rem] font-semibold leading-[1.05] text-white sm:text-[2rem]">
                <span className="shrink-0">{step.position}.</span>
                <span className="min-w-0 break-words">{step.title}</span>
              </h3>
              <Button
                size="sm"
                variant="secondary"
                aria-label={`Reset step ${step.position}`}
                className="h-8 w-8 shrink-0 self-center px-0 sm:hidden"
                onClick={async () => {
                  setResetNonce((value) => value + 1);
                  await Promise.resolve(onReset(step));
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2.5 sm:mt-4">
              <StepStatus timerStartedAt={step.timerStartedAt} completedAt={step.completedAt} elapsedSeconds={elapsedSeconds} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button
              size="sm"
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={async () => {
                setResetNonce((value) => value + 1);
                await Promise.resolve(onReset(step));
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset done
            </Button>
            {editMode ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => onEdit(step)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <button
                  aria-label={`Drag step ${step.position}`}
                  className="inline-flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100 transition-all hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent"
                  type="button"
                  {...dragHandleAttributes}
                  {...dragHandleListeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:block">
              <h3 className="app-heading flex min-w-0 items-baseline gap-1 text-[1.05rem] font-semibold leading-[1.05] text-white sm:text-[2rem]">
                <span className="shrink-0">{step.position}.</span>
                <span className="min-w-0 break-words">{step.title}</span>
              </h3>
              <Button
                size="sm"
                variant="primary"
                aria-label={`Mark step ${step.position} done`}
                className="h-8 w-8 shrink-0 self-center px-0 sm:hidden"
                onClick={async () => {
                  await Promise.resolve(onComplete(step));
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
            {step.instructions ? <p className="mt-1.5 whitespace-pre-wrap text-[10px] leading-5 text-[color:var(--text-secondary)] sm:mt-4 sm:text-sm sm:leading-7">{step.instructions}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
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
              className="hidden sm:inline-flex"
              onClick={async () => {
                await Promise.resolve(onComplete(step));
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark done
            </Button>
            {editMode ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => onEdit(step)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <button
                  aria-label={`Drag step ${step.position}`}
                  className="inline-flex h-9 w-9 touch-none items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100 transition-all hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent"
                  type="button"
                  {...dragHandleAttributes}
                  {...dragHandleListeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </>
            ) : null}
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
      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-100">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed {format(new Date(completedAt), 'HH:mm:ss')}
      </div>
    );
  }

  if (timerStartedAt) {
    return (
      <div className="inline-flex items-center gap-2 text-[color:var(--accent-strong)]">
        <div className="flex min-w-[56px] flex-col leading-none">
          <span className="text-[9px] uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">Started</span>
          <span className="mt-1 text-[11px] font-medium text-[color:var(--accent-strong)]">{format(new Date(timerStartedAt), 'HH:mm')}</span>
        </div>
        <Badge tone="accent">+ {formatDuration(elapsedSeconds)}</Badge>
      </div>
    );
  }

  return null;
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
