
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const go = (p: number) => onPageChange(Math.max(1, Math.min(totalPages, p)));

  // Build page number array with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={[
          "rounded-full px-4 py-2",
          "font-mono text-xs uppercase tracking-widest border",
          page > 1
            ? "bg-slate-900 text-white border-slate-800 hover:border-pixs-mint transition-all"
            : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed",
        ].join(" ")}
      >
        ‹ PREV
      </button>

      {getPageNumbers().map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
            ···
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            className={[
              "w-10 h-10 rounded-full text-sm font-bold transition-all",
              p === page
                ? "bg-pixs-mint text-slate-900 shadow-mint-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            ].join(" ")}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className={[
          "rounded-full px-4 py-2",
          "font-mono text-xs uppercase tracking-widest border",
          page < totalPages
            ? "bg-slate-900 text-white border-slate-800 hover:border-pixs-mint transition-all"
            : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed",
        ].join(" ")}
      >
        NEXT ›
      </button>
    </div>
  );
}
