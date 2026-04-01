import React from 'react';
import { clsx } from 'clsx';
import type { IconType } from 'react-icons';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface AccountInputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  icon: IconType;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  rightIcon?: React.ReactNode;
}

const AccountInputField: React.FC<AccountInputFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  registration,
  error,
  rightIcon,
}) => {
  return (
    <div className="AccountInputField space-y-3">
      <label className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 italic">
        {label}
      </label>
      <div
        className={clsx(
          'group flex items-center gap-3 rounded-[16px] border bg-white px-5 py-4 transition-all duration-300 shadow-sm',
          error 
            ? 'border-rose-400 shadow-rose-50' 
            : 'border-slate-100 hover:border-slate-200 focus-within:border-pixs-mint focus-within:shadow-lg focus-within:shadow-pixs-mint/5',
        )}
      >
        <Icon className={clsx(
          'transition-colors duration-300',
          error ? 'text-rose-400' : 'text-slate-300 group-focus-within:text-pixs-mint'
        )} size={18} />
        <input
          type={type}
          placeholder={placeholder}
          className="w-full border-none bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300 italic"
          {...registration}
        />
        {rightIcon}
      </div>
      {error?.message && <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic px-1 animate-in fade-in slide-in-from-top-1">{error.message}</p>}
    </div>
  );
};

export default AccountInputField;
