import React from 'react'
import { Layers, Check, Box, Cpu } from 'lucide-react'
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
}) => {
  const navigate = useNavigate()
  const hasSelectablePlates = selectablePlates.length > 0

  // Protocol: If not required and no owned inventory, leave selection blank to bypass UX noise
  if (!isRequired && !hasSelectablePlates) {
    return null
  }

  // Protocol: If required but no owned inventory, show fabrication collision warning
  if (!hasSelectablePlates && isRequired) {
    return (
      <div className="animate-in fade-in zoom-in space-y-6 rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-8 shadow-2xl shadow-slate-200/5 duration-500">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-500">
            <Cpu size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black tracking-[3px] text-slate-900 uppercase italic">
              Industrial Protocol Required
            </h4>
            <p className="pr-8 text-[10px] leading-relaxed font-bold tracking-tighter text-slate-500 uppercase">
              This production line requires a verified screenplate node. No
              compatible configurations identified in your registry for the
              current variant.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            navigate(
              `/screenplate?product_id=${productId}&variant=${selectedVariantSize}`,
            )
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-[10px] font-black tracking-[4px] text-white uppercase shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-[0.98]"
        >
          Initialize Fabrication Flow
        </button>
      </div>
    )
  }

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
            Status: Synchronizing Inventory
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {selectablePlates.map((plate) => {
          const isSelected = selectedPlateId === plate.id

          return (
            <button
              key={plate.id}
              onClick={() => onPlateChange(isSelected ? null : plate.id)}
              className={clsx(
                'group relative flex flex-col gap-6 overflow-hidden rounded-[32px] border-2 p-6 text-left transition-all md:flex-row',
                isSelected
                  ? 'border-pixs-mint shadow-pixs-mint/5 ring-pixs-mint/5 -translate-y-1 bg-white shadow-xl ring-4'
                  : 'border-slate-50 bg-white hover:border-slate-200',
              )}
            >
              <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all group-hover:scale-105 group-hover:bg-white">
                {plate.image ? (
                  <img
                    src={plate.image}
                    alt={plate.plate_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Box className="h-10 w-10 opacity-10 transition-opacity group-hover:opacity-40" />
                )}
              </div>

              <div className="flex-grow space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black tracking-[3px] text-slate-300 uppercase italic">
                      Node Ref: {plate.id}
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
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="space-y-1">
                    <span className="text-[7px] leading-none font-black tracking-widest text-slate-400 uppercase">
                      Type Protocol
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
                      Technical Hub
                    </span>
                    <p className="truncate text-[10px] font-black text-slate-900 uppercase italic">
                      {plate.dimensions}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] leading-none font-black tracking-widest text-slate-400 uppercase">
                      Logic Hub
                    </span>
                    <p className="truncate text-[10px] font-black text-slate-900 uppercase italic">
                      {plate.supported_alignments.length} Orientations
                    </p>
                  </div>
                </div>

                {plate.comment && (
                  <p className="mt-3 border-t border-slate-50 pt-3 text-[9px] font-bold tracking-widest text-slate-500 uppercase italic">
                    "{plate.comment}"
                  </p>
                )}

                <p className="pt-1 text-[9px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase italic">
                  Operational Logic:{' '}
                  {plate.technical_info || 'High-accuracy production node.'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PlateSelector
