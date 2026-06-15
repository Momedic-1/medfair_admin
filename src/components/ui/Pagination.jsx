export function Pagination({ page, totalPages, total, pageSize, onPageChange, loading = false }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {loading ? "Loading..." : `${total.toLocaleString()} total � Page ${page} of ${totalPages} � ${pageSize} per page`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-1.5 text-sm"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        {pages.map((p) =>
          p === "..." ? (
            <span key={`gap-${p}-${Math.random()}`} className="px-2 text-slate-400">& </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`min-w-9 rounded-lg px-3 py-1.5 text-sm font-medium ${
                p === page ? "bg-medfair text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              disabled={loading}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className="btn-secondary px-3 py-1.5 text-sm"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function buildPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p += 1) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
