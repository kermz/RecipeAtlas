import { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type FieldProps = PropsWithChildren<{
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  action?: ReactNode;
}>;

export function Field({ label, hint, error, action, className, children }: FieldProps) {
  return (
    <label className={cn('block space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-100">{label}</span>
        {action ? <span>{action}</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs leading-5 text-slate-400">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-200">{error}</p> : null}
    </label>
  );
}
