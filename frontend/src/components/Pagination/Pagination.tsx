import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onChange,
}) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="mt-20 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-white"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-2 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-2 shadow-inner">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-10 min-w-[40px] rounded-xl px-3 text-[10px] font-black tracking-widest transition-all ${
              currentPage === p
                ? 'text-pixs-mint scale-110 bg-slate-900 shadow-lg'
                : 'text-slate-400 hover:text-slate-900'
            } `}
          >
            {p.toString().padStart(2, '0')}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-white"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default React.memo(Pagination)
