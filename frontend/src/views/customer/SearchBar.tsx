import React, { useRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFocus, placeholder, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`group relative w-full ${className || ''}`}>
      <Search
        className="group-focus-within:text-pixs-mint absolute top-1/2 left-6 -translate-y-1/2 text-slate-300 transition-colors"
        size={20}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onFocus={onFocus}
        onChange={onChange}
        placeholder={placeholder || 'Search...'}
        inputMode="search"
        autoComplete="off"
        className="focus:border-pixs-mint w-full rounded-3xl border border-slate-100 bg-white py-5 pr-12 pl-16 font-mono text-sm font-black text-slate-900 italic shadow-xl shadow-slate-200/20 transition-all focus:outline-none"
      />
    </div>
  );
};

export default SearchBar;
