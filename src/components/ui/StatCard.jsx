export function StatCard({ title, value, subtitle, icon: Icon, accent = "primary" }) {
  const accents = {
    primary: "from-medfair/5 to-blue-50 border-medfair/15",
    green: "from-emerald-50 to-green-50 border-emerald-200",
    amber: "from-amber-50 to-orange-50 border-amber-200",
    rose: "from-rose-50 to-pink-50 border-rose-200",
  };

  return (
    <div className={`card bg-gradient-to-br ${accents[accent] || accents.primary}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-medfair">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medfair/10 text-medfair">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
