import React from 'react'
import { clsx } from 'clsx'
import type { IconType } from 'react-icons'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'

interface AccountInputFieldProps {
  label: string
  type?: string
  placeholder?: string
  icon: IconType
  registration: UseFormRegisterReturn
  error?: FieldError
  rightIcon?: React.ReactNode
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
      <label className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
        {label}
      </label>
      <div
        className={clsx(
          'group flex items-center gap-3 rounded-[16px] border bg-white px-5 py-4 shadow-sm transition-all duration-300',
          error
            ? 'border-rose-400 shadow-rose-50'
            : 'focus-within:border-pixs-mint focus-within:shadow-pixs-mint/5 border-slate-100 focus-within:shadow-lg hover:border-slate-200',
        )}
      >
        <Icon
          className={clsx(
            'transition-colors duration-300',
            error
              ? 'text-rose-400'
              : 'group-focus-within:text-pixs-mint text-slate-300',
          )}
          size={18}
        />
        <input
          type={type}
          placeholder={placeholder}
          className="w-full border-none bg-transparent text-sm font-bold text-slate-800 italic outline-none placeholder:text-slate-300"
          {...registration}
        />
        {rightIcon}
      </div>
      {error?.message && (
        <p className="animate-in fade-in slide-in-from-top-1 px-1 text-[10px] font-black tracking-widest text-rose-500 uppercase italic">
          {error.message}
        </p>
      )}
    </div>
  )
}

export default AccountInputField
