import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

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
  const [jumpPage, setJumpPage] = useState('')
  const [prevPage, setPrevPage] = useState(currentPage)

  if (currentPage !== prevPage) {
    setPrevPage(currentPage)
    setJumpPage('')
  }

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(jumpPage)
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onChange(p)
    }
  }

  const getVisiblePages = () => {
    const maxVisible = 8
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = start + maxVisible - 1

    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - maxVisible + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="mt-20 flex flex-col items-center gap-6">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(currentPage - 1)}
          disabled={currentPage <= 1 || totalPages <= 1}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-white"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-2 shadow-inner">
          {visiblePages.map((p) => (
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
          disabled={currentPage >= totalPages || totalPages <= 1}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-400 transition-all hover:bg-slate-50 active:scale-90 disabled:opacity-30 disabled:hover:bg-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Jump to Page */}
      {totalPages > 1 && (
        <form onSubmit={handleJump} className="flex animate-in fade-in slide-in-from-bottom-2 items-center gap-3 duration-500">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Quick Jump
          </span>
          <div className="relative group">
            <input
              type="text"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
              placeholder={currentPage.toString()}
              className="w-20 rounded-xl border border-slate-100 bg-white px-4 py-2 text-center text-xs font-black text-slate-900 focus:border-pixs-mint focus:outline-none transition-all group-hover:border-slate-300"
            />
          </div>
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-pixs-mint transition-all hover:scale-110 active:scale-90 shadow-lg shadow-slate-900/20"
          >
            <Search size={14} />
          </button>
        </form>
      )}
    </div>
  )
}

export default React.memo(Pagination)
