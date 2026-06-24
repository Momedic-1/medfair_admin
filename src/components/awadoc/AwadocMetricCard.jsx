const PERIODS = [
  { id: "today", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

const ACCENTS = {
  primary: "border-medfair/15 bg-gradient-to-br from-medfair/5 to-blue-50",
  green: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50",
  amber: "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50",
  rose: "border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50",
};

export function AwadocMetricCard({
  title,
  description,
  value,
  subtitle,
  icon: Icon,
  accent = "primary",
  period,
  onPeriodChange,
  showPeriod = false,
  loading = false,
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${ACCENTS[accent] || ACCENTS.primary}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          <p className="mt-3 text-2xl font-bold text-medfair">{loading ? "…" : value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-medfair/10 text-medfair">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {showPeriod && onPeriodChange && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {PERIODS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPeriodChange(opt.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === opt.id
                  ? "bg-medfair text-white shadow-sm"
                  : "bg-white/80 text-slate-600 hover:bg-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const AWADOC_PERIODS = PERIODS;
