import React, { useRef } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  onFocus?: () => void
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Identify node sequence (e.g. SKU_902)...',
  onFocus,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="group relative w-full">
      <Search
        className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors"
        size={20}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        inputMode="search"
        autoComplete="off"
        className="focus:border-pixs-mint w-full rounded-3xl border border-slate-100 bg-white py-5 pr-12 pl-16 font-mono text-sm font-black text-slate-900 italic shadow-xl shadow-slate-200/20 transition-all focus:outline-none"
      />
    </div>
  )
}

export default SearchBar
