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
    primary: 'bg-slate-100 text-slate-900 hover:bg-white shadow-glow',
    secondary: 'bg-white/8 text-white border border-white/12 hover:bg-white/12',
    danger: 'bg-rose-400 text-slate-950 hover:bg-rose-300',
    ghost: 'bg-transparent text-slate-100 hover:bg-white/8'
  }[variant];

  const sizeClasses = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-4 text-sm';

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50',
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
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50',
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
