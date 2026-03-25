import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-3xl border border-white/10 bg-white/7 backdrop-blur-xl shadow-glow', className)} {...props} />;
}
