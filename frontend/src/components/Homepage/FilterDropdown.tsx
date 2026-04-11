import React, { memo, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export interface FilterDropdownProps {
  label: string;
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

const FilterDropdown = memo(function FilterDropdown({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive =
    value !== 'All' &&
    value !== 'All Prices' &&
    value !== 'All Status' &&
    value !== 'Price: Low-High';

  return (
    <div ref={dropdownRef} className="relative min-w-[140px] flex-1">
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
            {value === 'All' || value.includes('All') ? label : value}
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
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="MarketplaceDropdownMenu custom-scrollbar absolute top-full right-0 left-0 z-[100] mt-2 max-h-64 overflow-y-auto rounded-[24px] border border-slate-100 bg-white p-2 shadow-2xl"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={clsx(
                  'MarketplaceDropdownItem w-full rounded-xl px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase transition-colors',
                  value === opt
                    ? 'bg-pixs-mint text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50',
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default FilterDropdown;
