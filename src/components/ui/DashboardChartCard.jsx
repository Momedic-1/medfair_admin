import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const PERIOD_OPTIONS = [
  { id: "3m", label: "3 months", months: 3 },
  { id: "6m", label: "6 months", months: 6 },
  { id: "12m", label: "12 months", months: 12 },
  { id: "custom", label: "Custom", months: null },
];

function formatCompactNaira(value) {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value}`;
}

function filterSeries(series, period, fromKey, toKey) {
  if (period === "custom" && fromKey && toKey) {
    return series.filter((d) => d.key >= fromKey && d.key <= toKey);
  }
  const opt = PERIOD_OPTIONS.find((p) => p.id === period);
  const count = opt?.months ?? 6;
  return series.slice(-count);
}

export function DashboardChartCard({
  title,
  description,
  dataKey,
  formatBarValue,
  formatTotalValue,
  accent = "blue",
  series = [],
}) {
  const monthOptions = series.length ? series : [{ key: "", label: "" }];
  const [period, setPeriod] = useState("6m");
  const [fromKey, setFromKey] = useState(monthOptions[Math.max(0, monthOptions.length - 6)]?.key ?? "");
  const [toKey, setToKey] = useState(monthOptions[monthOptions.length - 1]?.key ?? "");

  const filtered = useMemo(
    () => filterSeries(series, period, fromKey, toKey),
    [series, period, fromKey, toKey]
  );

  const chartData = filtered.map((d) => ({
    label: d.label,
    value: Number(d[dataKey] ?? 0),
    fullLabel: d.key,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...chartData.map((d) => d.value), 1);

  const startIdx = series.findIndex((d) => d.key === filtered[0]?.key);
  const prevSlice = startIdx > 0
    ? series.slice(Math.max(0, startIdx - filtered.length), startIdx)
    : [];
  const prevTotal = prevSlice.reduce((sum, d) => sum + d[dataKey], 0);
  const changePct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
  const isUp = changePct >= 0;

  const barColor = accent === "green"
    ? "from-emerald-600 to-emerald-400"
    : "from-medfair to-blue-500";

  const defaultFormatBar = (v) => (dataKey === "revenue" ? formatCompactNaira(v) : v.toLocaleString());
  const defaultFormatTotal = (v) => (dataKey === "revenue" ? formatCompactNaira(v) : v.toLocaleString());
  const barFmt = formatBarValue || defaultFormatBar;
  const totalFmt = formatTotalValue || defaultFormatTotal;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-medfair">{totalFmt(total)}</span>
              {prevTotal > 0 && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isUp ? "+" : ""}{changePct}% vs prior period
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.filter((p) => p.id !== "custom").map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  period === opt.id
                    ? "bg-medfair text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPeriod("custom")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === "custom"
                  ? "bg-medfair text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {period === "custom" && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
              <select className="input-field !py-1.5 text-sm" value={fromKey} onChange={(e) => setFromKey(e.target.value)}>
                {monthOptions.map((d) => (
                  <option key={d.key} value={d.key}>{d.label} {d.key?.slice(0, 4)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
              <select className="input-field !py-1.5 text-sm" value={toKey} onChange={(e) => setToKey(e.target.value)}>
                {monthOptions.map((d) => (
                  <option key={d.key} value={d.key}>{d.label} {d.key?.slice(0, 4)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-6 sm:px-6">
        {chartData.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No data for selected period</p>
        ) : (
          <div className="relative">
            {/* Grid lines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-dashed border-slate-100" />
              ))}
            </div>

            {/* Bars — pixel heights so they always render */}
            <div className="flex h-52 items-end justify-between gap-1 sm:gap-2">
              {chartData.map((item) => {
                const BAR_MAX = 150;
                const barHeight = Math.max(Math.round((item.value / max) * BAR_MAX), 12);
                return (
                  <div
                    key={item.fullLabel}
                    className="group flex flex-1 flex-col items-center justify-end"
                    style={{ height: 208 }}
                  >
                    <span className="mb-1 text-[10px] font-semibold text-slate-500 sm:text-xs">
                      {barFmt(item.value)}
                    </span>
                    <div
                      className={`w-full max-w-[40px] rounded-t-md bg-gradient-to-t ${barColor} shadow-sm transition-all duration-300 hover:opacity-80 sm:max-w-[52px]`}
                      style={{ height: barHeight }}
                      title={`${item.label}: ${barFmt(item.value)}`}
                    />
                    <span className="mt-2 text-[10px] font-medium text-slate-500 sm:text-xs">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
