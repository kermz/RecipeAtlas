import { cloneElement, forwardRef, isValidElement, type ButtonHTMLAttributes, type ReactElement } from 'react';
import { cn } from '../../lib/cn';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', asChild = false, children, ...props },
  ref
) {
  const variantClasses = {
    primary:
      'border border-[rgba(191,209,171,0.3)] bg-[linear-gradient(135deg,rgba(191,209,171,0.98),rgba(118,144,103,0.95))] text-slate-950 shadow-[0_18px_40px_rgba(76,98,67,0.24)] hover:-translate-y-0.5 hover:brightness-105',
    secondary:
      'border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-[color:var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10',
    danger:
      'border border-rose-300/24 bg-[linear-gradient(135deg,rgba(255,152,169,0.98),rgba(230,104,130,0.94))] text-slate-950 shadow-[0_18px_40px_rgba(190,59,90,0.18)] hover:-translate-y-0.5 hover:brightness-105',
    ghost: 'bg-transparent text-[color:var(--text-secondary)] hover:bg-white/8 hover:text-white'
  }[variant];

  const sizeClasses = size === 'sm' ? 'h-8 rounded-xl px-3 text-[11px] sm:h-9 sm:px-3.5 sm:text-[13px]' : 'h-10 rounded-2xl px-3.5 text-[12px] sm:h-11 sm:px-4 sm:text-sm';

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[0.01em] transform-gpu transition-all duration-200 active:translate-y-px active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses,
        sizeClasses,
        children.props.className,
        className
      )
    });
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[0.01em] transform-gpu transition-all duration-200 active:translate-y-px active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-[rgba(191,209,171,0.72)] focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses,
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
