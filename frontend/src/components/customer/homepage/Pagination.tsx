interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const go = (p: number) => onPageChange(Math.max(1, Math.min(totalPages, p)))

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = []
    const delta = 2
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={[
          'rounded-full border px-4 py-2',
          'font-mono text-xs tracking-widest uppercase',
          page > 1
            ? 'hover:border-pixs-mint border-slate-800 bg-slate-900 text-white'
            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400',
        ].join(' ')}
      >
        ‹ PREV
      </button>

      {getPageNumbers().map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
            ···
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            className={[
              'h-10 w-10 rounded-full text-sm font-bold transition-all',
              p === page
                ? 'bg-pixs-mint text-slate-900 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            ].join(' ')}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className={[
          'rounded-full border px-4 py-2',
          'font-mono text-xs tracking-widest uppercase',
          page < totalPages
            ? 'hover:border-pixs-mint border-slate-800 bg-slate-900 text-white'
            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400',
        ].join(' ')}
      >
        NEXT ›
      </button>
    </div>
  )
}
