export function BarChart({ title, data, valuePrefix = "", valueSuffix = "" }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="card">
      {title && <h3 className="mb-5 font-semibold text-slate-800">{title}</h3>}
      <div className="flex h-52 items-end justify-between gap-2 sm:gap-3">
        {data.map((item) => {
          const height = Math.max((item.value / max) * 100, 4);
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-medfair">
                {valuePrefix}
                {item.value.toLocaleString()}
                {valueSuffix}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-medfair to-medfair-light transition-all"
                  style={{ height: `${height}%` }}
                  title={`${item.label}: ${item.value}`}
                />
              </div>
              <span className="text-center text-[10px] font-medium text-slate-500 sm:text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HorizontalBarChart({ title, data, formatValue }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="card">
      {title && <h3 className="mb-5 font-semibold text-slate-800">{title}</h3>}
      <div className="space-y-4">
        {data.map((item) => {
          const width = Math.max((item.value / max) * 100, 2);
          return (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-semibold text-medfair">
                  {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-medfair to-medfair-light"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
