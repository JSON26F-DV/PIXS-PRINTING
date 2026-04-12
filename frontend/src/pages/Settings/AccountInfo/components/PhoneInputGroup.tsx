import React from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { FiPhone } from 'react-icons/fi'
import { clsx } from 'clsx'

interface PhoneInputGroupProps {
  value: string
  onChange: (value: string | undefined) => void
  error?: string
  label?: string
}

/**
 * Standard Phone Input Component.
 * Supports global E.164 formatting and regional validation.
 */
const PhoneInputGroup: React.FC<PhoneInputGroupProps> = ({
  value,
  onChange,
  error,
  label = 'Mobile Number',
}) => {
  return (
    <div className="PhoneInputGroup space-y-3">
      <label className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
        {label}
      </label>
      <div
        className={clsx(
          'PhoneInputWrapper group flex items-center gap-3 rounded-[16px] border bg-white px-5 py-4 shadow-sm transition-all duration-300',
          error
            ? 'border-rose-400 shadow-rose-50'
            : 'focus-within:border-pixs-mint border-slate-100 hover:border-slate-200',
        )}
      >
        <FiPhone
          className={clsx(
            'transition-colors duration-300',
            error
              ? 'text-rose-400'
              : 'group-focus-within:text-pixs-mint text-slate-300',
          )}
          size={18}
        />

        <PhoneInput
          international
          defaultCountry="PH"
          value={value}
          onChange={onChange}
          className="PhoneInputControl w-full text-sm font-bold text-slate-800 italic outline-none placeholder:text-slate-300"
        />
      </div>
      {error && (
        <p className="PhoneValidationError animate-in fade-in slide-in-from-top-1 px-1 text-[10px] font-black tracking-widest text-rose-500 uppercase italic">
          {error}
        </p>
      )}
    </div>
  )
}

export default PhoneInputGroup
