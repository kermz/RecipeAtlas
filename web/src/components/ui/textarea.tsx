import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,20,0.94),rgba(13,18,15,0.94))] px-4 py-3 text-sm text-white placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.14)] outline-none transition focus:-translate-y-px focus:border-[rgba(191,209,171,0.7)] focus:ring-4 focus:ring-[rgba(127,155,113,0.15)]',
        className
      )}
      {...props}
    />
  );
});
