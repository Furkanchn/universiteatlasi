import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker: string;
  title: string;
  description?: string;
  aside?: ReactNode;
};

export function PageHeader({ kicker, title, description, aside }: PageHeaderProps) {
  return (
    <div className="mb-7 grid gap-5 rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div>
        <p className="section-kicker">{kicker}</p>
        <h1 className="headline mt-2">{title}</h1>
        {description && <p className="muted-copy mt-2 max-w-3xl font-semibold">{description}</p>}
      </div>
      {aside && <div className="min-w-0 shrink-0">{aside}</div>}
    </div>
  );
}
