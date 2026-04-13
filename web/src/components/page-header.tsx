import { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="grid gap-2.5 border-b border-white/10 pb-3.5 sm:gap-4 sm:pb-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
      <div className="max-w-3xl">
        {eyebrow ? <p className="app-kicker">{eyebrow}</p> : null}
        <h2 className="app-heading mt-1 text-[1.18rem] font-semibold leading-[1.02] text-white sm:mt-3 sm:text-4xl lg:text-[2.8rem]">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-[11px] leading-5 text-[color:var(--text-secondary)] sm:mt-4 sm:text-base sm:leading-7">{description}</p> : null}
      </div>
      {action ? <div className="xl:justify-self-end">{action}</div> : null}
    </div>
  );
}
