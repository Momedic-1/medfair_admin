export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-medfair">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function FilterBar({ children }) {
  return (
    <div className="card mb-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      {children}
    </div>
  );
}

export function FilterField({ label, children }) {
  return (
    <div className="min-w-[180px] flex-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
