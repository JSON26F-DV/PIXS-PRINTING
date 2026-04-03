import React from 'react';
import { Layers, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import type { IScreenPlate } from '../../../types/product.types';

interface PrintConfigProps {
  compatiblePlates: IScreenPlate[];
  selectedPlateId: string | null;
  selectedPosition: string | null;
  availablePositions: string[];
  onPlateChange: (plateId: string | null) => void;
  onPositionChange: (position: string | null) => void;
}

const PrintConfig: React.FC<PrintConfigProps> = ({
  compatiblePlates, selectedPlateId, selectedPosition,
  availablePositions, onPlateChange, onPositionChange,
}) => {
  // ─── No Compatible Plates State ─────────────────────────────────────────
  if (compatiblePlates.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 space-y-3">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <p className="text-xs font-black text-amber-700 uppercase tracking-widest">No Compatible Screen Plate</p>
        </div>
        <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
          No active screen plates found for this product. You may request custom plate fabrication.
        </p>
        <button className="w-full py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-[4px] transition-all border border-amber-200">
          Request Custom Plate Fabrication →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 flex items-center gap-2">
        <Layers size={12} /> Screen Plate Selection
      </p>

      {/* Plate Options */}
      <div className="space-y-2">
        {/* No Print Option */}
        <button
          onClick={() => onPlateChange(null)}
          className={clsx(
            'w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all text-left',
            selectedPlateId === null
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-100 bg-white hover:border-slate-200'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={clsx('w-3 h-3 rounded-full border-2 transition-all', selectedPlateId === null ? 'border-slate-900 bg-slate-900' : 'border-slate-300')} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">No Printing — Product Only</span>
          </div>
        </button>

        {compatiblePlates.map(plate => {
          const isSelected = selectedPlateId === plate.id;
          return (
            <button
              key={plate.id}
              onClick={() => onPlateChange(plate.id)}
              className={clsx(
                'w-full flex flex-col gap-2 px-5 py-4 rounded-2xl border-2 transition-all text-left',
                isSelected
                  ? 'border-pixs-mint bg-slate-900 text-white'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-3 h-3 rounded-full border-2 transition-all', isSelected ? 'border-pixs-mint bg-pixs-mint' : 'border-slate-300')} />
                  <span className={clsx('text-[10px] font-black uppercase tracking-widest', isSelected ? 'text-pixs-mint' : 'text-slate-700')}>{plate.plate_name}</span>
                </div>
                <span className={clsx('text-[9px] font-black px-2 py-1 rounded-lg', isSelected ? 'bg-white/10 text-slate-300' : 'bg-slate-50 text-slate-400')}>
                  {plate.is_flatscreen ? 'Flatscreen' : 'Cylindrical'}
                </span>
              </div>
              <div className={clsx('text-[9px] font-bold flex items-center gap-4 pl-6', isSelected ? 'text-slate-400' : 'text-slate-400')}>
                <span>Setup: ₱{plate.base_setup_fee.toLocaleString()}</span>
                {plate.dimensions && <span>Size: {plate.dimensions}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Position Selector */}
      {selectedPlateId && availablePositions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Print Position</p>
          <div className="flex flex-wrap gap-2">
            {availablePositions.map(pos => (
              <button
                key={pos}
                onClick={() => onPositionChange(selectedPosition === pos ? null : pos)}
                className={clsx(
                  'px-4 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all',
                  selectedPosition === pos
                    ? 'border-pixs-mint bg-pixs-mint text-slate-900'
                    : 'border-slate-100 text-slate-500 hover:border-slate-300'
                )}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintConfig;
