import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  const toneClasses = {
    neutral: 'border-white/12 bg-white/[0.06] text-[color:var(--text-primary)]',
    success: 'border-emerald-200/22 bg-emerald-400/14 text-emerald-100',
    warning: 'border-lime-200/20 bg-lime-300/14 text-lime-50',
    danger: 'border-rose-200/22 bg-rose-400/14 text-rose-100',
    accent: 'border-[rgba(191,209,171,0.24)] bg-[rgba(127,155,113,0.18)] text-[color:var(--accent-strong)]'
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] sm:px-2.5 sm:py-1 sm:text-[11px] sm:tracking-[0.16em]',
        toneClasses,
        className
      )}
      {...props}
    />
  );
}
