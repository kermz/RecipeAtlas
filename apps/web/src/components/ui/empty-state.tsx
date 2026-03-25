import { ReactNode } from 'react';
import { Card } from './card';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-white/15 bg-white/5 p-8 text-center">
      <h3 className="app-heading text-2xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-300">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}
