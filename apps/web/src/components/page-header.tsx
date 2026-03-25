import { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">{eyebrow}</p> : null}
        <h2 className="app-heading mt-2 text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
