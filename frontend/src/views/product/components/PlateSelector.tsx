import React from 'react';
import { Layers, Check, Box, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import type { IScreenPlate } from '../../../types/product.types';

interface PlateSelectorProps {
  selectablePlates: IScreenPlate[];
  selectedPlateId: string | null;
  onPlateChange: (plateId: string | null) => void;
  isRequired: boolean;
  productId: string;
  selectedVariantSize?: string;
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
  const navigate = useNavigate();
  const hasSelectablePlates = selectablePlates.length > 0;

  // Protocol: If not required and no owned inventory, leave selection blank to bypass UX noise
  if (!isRequired && !hasSelectablePlates) {
    return null;
  }

  // Protocol: If required but no owned inventory, show fabrication collision warning
  if (!hasSelectablePlates && isRequired) {
    return (
      <div className="p-8 bg-slate-50 border border-slate-200 rounded-[32px] space-y-6 border-dashed animate-in fade-in zoom-in duration-500 shadow-2xl shadow-slate-200/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
             <Cpu size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-[3px] text-slate-900 italic">Industrial Protocol Required</h4>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed pr-8 uppercase tracking-tighter">
              This production line requires a verified screenplate node. No compatible configurations identified in your registry for the current variant.
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/screenplate?product_id=${productId}&variant=${selectedVariantSize}`)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
        >
          Initialize Fabrication Flow
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Layers size={14} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Available Screenplates</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: Synchronizing Inventory</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {selectablePlates.map(plate => {
          const isSelected = selectedPlateId === plate.id;

          return (
            <button
              key={plate.id}
              onClick={() => onPlateChange(isSelected ? null : plate.id)}
              className={clsx(
                'relative p-6 rounded-[32px] text-left border-2 transition-all flex flex-col md:flex-row gap-6 group overflow-hidden',
                isSelected 
                  ? 'bg-white border-pixs-mint shadow-xl shadow-pixs-mint/5 ring-4 ring-pixs-mint/5 -translate-y-1' 
                  : 'bg-white border-slate-50 hover:border-slate-200'
              )}
            >
              <div className="relative w-24 h-24 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:scale-105 transition-all overflow-hidden">
                {plate.image ? (
                  <img src={plate.image} alt={plate.plate_name} className="w-full h-full object-cover" />
                ) : (
                  <Box className="w-10 h-10 opacity-10 group-hover:opacity-40 transition-opacity" />
                )}
              </div>

              <div className="flex-grow space-y-3">
                <div className="flex items-start justify-between">
                   <div className="space-y-0.5">
                      <span className="text-[8px] font-black uppercase text-slate-300 tracking-[3px] italic">Node Ref: {plate.id}</span>
                      <h5 className="text-lg font-black text-slate-900 uppercase italic leading-none tracking-tight">{plate.plate_name}</h5>
                   </div>
                   {isSelected && (
                     <div className="bg-pixs-mint text-slate-900 p-1.5 rounded-xl animate-in zoom-in duration-300 shadow-xl shadow-pixs-mint/20">
                       <Check size={14} strokeWidth={4} />
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                   <div className="space-y-1">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">Type Protocol</span>
                      <p className="text-[10px] font-black text-slate-900 uppercase italic truncate">{plate.is_flatscreen ? 'Flatscreen' : 'Cylindrical'}</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">Color Channels</span>
                      <p className="text-[10px] font-black text-slate-900 uppercase italic truncate">{plate.channels} Channels</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">Technical Hub</span>
                      <p className="text-[10px] font-black text-slate-900 uppercase italic truncate">{plate.dimensions}</p>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest leading-none">Logic Hub</span>
                      <p className="text-[10px] font-black text-slate-900 uppercase italic truncate">{plate.supported_alignments.length} Orientations</p>
                   </div>
                </div>

                {plate.comment && (
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic pt-3 mt-3 border-t border-slate-50">
                    "{plate.comment}"
                  </p>
                )}
                
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic pt-1 leading-relaxed">
                   Operational Logic: {plate.technical_info || 'High-accuracy production node.'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlateSelector;
