import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white placeholder:text-slate-400 shadow-insetSoft outline-none transition focus:border-sky-300/50 focus:ring-2 focus:ring-sky-300/20',
        className
      )}
      {...props}
    />
  );
});
