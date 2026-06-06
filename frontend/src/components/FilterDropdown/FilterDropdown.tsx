import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

interface FilterDropdownProps {
  label: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  value: string | null
  options: { label: string; value: string | null }[] | string[]
  onChange: (val: string | null) => void
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}) => {

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getLabel = (val: string | null) => {
    if (options.length === 0) return label
    if (typeof options[0] === 'string') return val
    const opt = (options as { label: string; value: string | null }[]).find(
      (o) => o.value === val,
    )
    return opt ? opt.label : label
  }

  const getVal = (opt: string | { label: string; value: string | null }) =>
    typeof opt === 'string' ? opt : opt.value
  const getDisplay = (opt: string | { label: string; value: string | null }) =>
    typeof opt === 'string' ? opt : opt.label

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive =
    value !== null &&
    value !== 'All' &&
    value !== 'All Prices' &&
    value !== 'All Status' &&
    value !== 'All Plates' &&
    value !== 'Price: Low to High'

  return (
    <div ref={dropdownRef} className="relative min-w-[180px] flex-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'MarketplaceDropdownButton flex w-full items-center justify-between rounded-2xl border px-5 py-3.5 text-[10px] font-black tracking-widest uppercase transition-all',
          isActive
            ? 'border-pixs-mint text-pixs-mint shadow-pixs-mint/5 bg-white shadow-lg'
            : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200',
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            size={14}
            className={clsx(isActive ? 'text-pixs-mint' : 'text-slate-300')}
          />
          <span className="truncate">
            {value === null ||
            value === 'All' ||
            (typeof value === 'string' && value.includes('All'))
              ? label
              : getLabel(value)}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={clsx(
            'transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="MarketplaceDropdownMenu custom-scrollbar absolute top-full right-0 left-0 z-[1001] mt-2 max-h-64 overflow-y-auto rounded-[24px] border border-slate-100 bg-white p-2 shadow-2xl"
          >
            {options.map((opt) => {
              const optVal = getVal(opt)
              const optDisplay = getDisplay(opt)
              return (
                <button
                  key={optDisplay}
                  onClick={() => {
                    onChange(optVal)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'MarketplaceDropdownItem w-full rounded-xl px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase transition-colors',
                    value === optVal
                      ? 'bg-pixs-mint text-slate-900'
                      : 'text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {optDisplay}
                </button>
              )
            })}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo(FilterDropdown)
