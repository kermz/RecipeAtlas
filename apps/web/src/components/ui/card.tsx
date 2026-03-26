import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-[transform,border-color,background-color,box-shadow] duration-200',
        className
      )}
      {...props}
    />
  );
}
