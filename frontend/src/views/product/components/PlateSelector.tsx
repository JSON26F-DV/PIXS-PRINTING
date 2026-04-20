import React from 'react'
import { Layers, Check, Cpu } from 'lucide-react'
import BoxFallback from '../../../components/common/BoxFallback'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import type { IScreenPlate } from '../../../types/product.types'

interface PlateSelectorProps {
  selectablePlates: IScreenPlate[]
  selectedPlateId: string | null
  onPlateChange: (plateId: string | null) => void
  isRequired: boolean
  productId: string
  selectedVariantSize?: string
  incompatiblePlateIds?: string[]
}

/**
 * Screen Plate Configuration Node.
 * Protocol: Bypasses UI entirely if the product node does not require screen fabrication.
 * Logic: strictly filters for existing customer selection inventory.
 */
const PlateSelector: React.FC<PlateSelectorProps> = ({
  selectablePlates,
  selectedPlateId,
  onPlateChange,
  isRequired,
  productId,
  selectedVariantSize,
  incompatiblePlateIds,
}) => {
  const navigate = useNavigate()
  const hasSelectablePlates = selectablePlates.length > 0

  // Protocol: If not required and no owned inventory, leave selection blank to bypass UX noise
  if (!isRequired && !hasSelectablePlates) {
    return null
  }

  const suggestionBox = (
    <div className="animate-in fade-in zoom-in space-y-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 duration-500">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-500">
          <Cpu size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase italic">
            Need a Different Setup?
          </h4>
          <p className="pr-4 text-[9px] leading-relaxed font-bold text-slate-400 uppercase">
            If your existing plates aren't compatible or you want a new design,
            initialize a new industrial configuration.
          </p>
        </div>
      </div>
      <button
        onClick={() =>
          navigate(
            `/screenplate?product_id=${productId}&variant=${selectedVariantSize}`,
          )
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[9px] font-black tracking-[3px] text-white uppercase transition-all hover:bg-slate-800 active:scale-[0.98]"
      >
        Create New Screenplate
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Layers size={14} />
          </div>
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Available Screenplates
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1">
          <span className="text-[8px] leading-none font-black tracking-widest text-slate-400 uppercase">
            Status: Data Synced
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {selectablePlates.map((plate) => (
          <PlateItem
            key={plate.id}
            plate={plate}
            isSelected={selectedPlateId === plate.id}
            isIncompatible={incompatiblePlateIds?.includes(plate.id)}
            onPlateChange={onPlateChange}
          />
        ))}
      </div>

      {/* Suggestion Box — Always available for custom workflows or when incompatibility exists */}
      {suggestionBox}
    </div>
  )
}

interface PlateItemProps {
  plate: IScreenPlate
  isSelected: boolean
  isIncompatible?: boolean
  onPlateChange: (plateId: string | null) => void
}

const PlateItem: React.FC<PlateItemProps> = ({
  plate,
  isSelected,
  isIncompatible,
  onPlateChange,
}) => {
  const [imgError, setImgError] = React.useState(false)

  return (
    <button
      onClick={() => !isIncompatible && onPlateChange(isSelected ? null : plate.id)}
      disabled={isIncompatible}
      className={clsx(
        'group relative flex flex-col gap-6 overflow-hidden rounded-2xl border-2 p-6 text-left transition-all md:flex-row md:rounded-[32px]',
        isSelected
          ? 'border-pixs-mint shadow-pixs-mint/5 ring-pixs-mint/5 -translate-y-1 bg-white shadow-xl ring-4'
          : isIncompatible
          ? 'cursor-not-allowed border-rose-100 bg-rose-50/50 grayscale'
          : 'border-slate-50 bg-white hover:border-slate-200',
      )}
    >
      <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all group-hover:scale-105 group-hover:bg-white">
        {plate.image && !imgError ? (
          <img
            src={`/images/screenplate/${plate.image}`}
            alt={plate.plate_name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <BoxFallback iconClassName="h-10 w-10 opacity-20" />
        )}
      </div>

      <div className="flex-grow space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-[8px] font-black tracking-[3px] text-slate-300 uppercase italic">
              ID: {plate.id}
            </span>
            <h5 className="text-lg leading-none font-black tracking-tight text-slate-900 uppercase italic">
              {plate.plate_name}
            </h5>
          </div>
          {isSelected && (
            <div className="bg-pixs-mint animate-in zoom-in shadow-pixs-mint/20 rounded-xl p-1.5 text-slate-900 shadow-xl duration-300">
              <Check size={14} strokeWidth={4} />
            </div>
          )}
          {isIncompatible && (
            <div className="rounded-lg bg-rose-100 px-3 py-1 text-[9px] font-black tracking-widest text-rose-600 uppercase">
              Not Compatible
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="space-y-1">
            <span className="text-[7px] leading-none font-black tracking-widest text-slate-400 uppercase">
              Plate Type
            </span>
            <p className="truncate text-[10px] font-black text-slate-900 uppercase italic">
              {plate.is_flatscreen ? 'Flatscreen' : 'Cylindrical'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[7px] leading-none font-black tracking-widest text-slate-400 uppercase">
              Color Channels
            </span>
            <p className="truncate text-[10px] font-black text-slate-900 uppercase italic">
              {plate.channels} Channels
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[7px] leading-none font-black tracking-widest text-slate-400 uppercase">
              Dimensions
            </span>
            <p className="truncate text-[10px] font-black text-slate-900 uppercase italic">
              {plate.dimensions}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[7px] leading-none font-black tracking-widest text-slate-400 uppercase">
              Orientations
            </span>
            <p className="truncate text-[10px] font-black text-slate-900 uppercase italic">
              {plate.supported_alignments.length} Options
            </p>
          </div>
        </div>

        {plate.comment && (
          <p className="mt-3 border-t border-slate-50 pt-3 text-[9px] font-bold tracking-widest text-slate-500 uppercase italic">
            "{plate.comment}"
          </p>
        )}

        <p className="pt-1 text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase italic">
          Specifications:{' '}
          {plate.technical_info || 'High-accuracy production specifications.'}
        </p>
      </div>
    </button>
  )
}

export default PlateSelector
