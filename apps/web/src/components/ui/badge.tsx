import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  const toneClasses = {
    neutral: 'bg-white/8 text-white border-white/12',
    success: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/20',
    warning: 'bg-amber-400/15 text-amber-100 border-amber-200/20',
    danger: 'bg-rose-400/15 text-rose-100 border-rose-200/20',
    accent: 'bg-sky-400/15 text-sky-100 border-sky-200/20'
  }[tone];

  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClasses, className)}
      {...props}
    />
  );
}
