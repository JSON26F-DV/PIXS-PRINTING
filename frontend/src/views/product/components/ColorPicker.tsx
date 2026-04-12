import React from 'react'
import { clsx } from 'clsx'
import { AlertCircle, Check } from 'lucide-react'
import type { IColor } from '../../../types/product.types'

interface ColorPickerProps {
  colors: IColor[]
  selectedColorIds: string[]
  maxChannels: number
  onSelect: (colorId: string) => void
}

/**
 * Enterprise Color Picker with multi-channel node support.
 * Allows users to choose multiple colors (Primary, Secondary, Accent) based on plate capacity.
 */
const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColorIds,
  maxChannels,
  onSelect,
}) => {
  const getSelectedLabel = (id: string) => {
    const idx = selectedColorIds.indexOf(id)
    if (idx === -1) return null
    if (idx === 0) return 'Primary'
    if (idx === 1) return 'Secondary'
    if (idx === 2) return 'Accent'
    return `Sequence ${idx + 1}`
  }

  const hasSelections = selectedColorIds.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
          Master Color Sequence{' '}
          {maxChannels > 1 && (
            <span className="text-pixs-mint ml-2">
              ({selectedColorIds.length}/{maxChannels} Channels Active)
            </span>
          )}
        </p>
        {hasSelections && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
            <AlertCircle size={10} className="text-amber-500" />
            <span className="text-[8px] font-black tracking-widest text-amber-700 uppercase">
              Real-world results may vary
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const isSelected = selectedColorIds.includes(color.id)
          const label = getSelectedLabel(color.id)

          return (
            <button
              key={color.id}
              onClick={() => onSelect(color.id)}
              disabled={!isSelected && selectedColorIds.length >= maxChannels}
              title={`${color.name} (${color.type})`}
              className={clsx(
                'group relative flex h-14 w-12 flex-col items-center justify-center rounded-2xl border-2 pt-1.5 transition-all',
                isSelected
                  ? 'border-pixs-mint bg-pixs-mint/[0.03] shadow-pixs-mint/10 shadow-lg'
                  : 'border-slate-50 hover:border-slate-300 disabled:opacity-30',
              )}
            >
              <div
                className={clsx(
                  'h-8 w-8 rounded-xl shadow-inner transition-transform',
                  isSelected ? 'scale-90' : 'group-hover:scale-105',
                )}
                style={{ backgroundColor: color.hex }}
              />

              {isSelected && (
                <div className="bg-pixs-mint absolute -top-1.5 -right-1.5 rounded-lg p-0.5 text-slate-900 shadow-md">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}

              <div className="flex h-4 items-center justify-center">
                {isSelected ? (
                  <span className="text-pixs-mint-dark text-[7px] font-black tracking-tighter uppercase">
                    {label}
                  </span>
                ) : color.type === 'Premium' ? (
                  <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[6px] font-black tracking-tighter text-slate-100 uppercase">
                    Premium
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {hasSelections && (
        <div className="flex flex-wrap gap-2 pl-2">
          {selectedColorIds.map((id, i) => {
            const c = colors.find((color) => color.id === id)
            return (
              <p
                key={id}
                className="text-[9px] font-bold tracking-widest text-slate-400 uppercase"
              >
                {getSelectedLabel(id)}:{' '}
                <span className="text-slate-900">{c?.name}</span>
                {i < selectedColorIds.length - 1 && (
                  <span className="mx-2 text-slate-200">|</span>
                )}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ColorPicker
