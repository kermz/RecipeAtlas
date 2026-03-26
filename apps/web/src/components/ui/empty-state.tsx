import { ReactNode } from 'react';
import { Card } from './card';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="overflow-hidden border-dashed border-white/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-8 text-center sm:p-10">
      <div className="mx-auto max-w-2xl page-fade">
        <p className="app-kicker">Ready to start</p>
        <h3 className="app-heading mt-4 text-3xl font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[color:var(--text-secondary)]">{description}</p>
        {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  );
}
