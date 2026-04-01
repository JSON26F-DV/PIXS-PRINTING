import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, Check } from 'lucide-react';
import type { IColor } from '../../../types/product.types';

interface ColorPickerProps {
  colors: IColor[];
  selectedColorId: string | null;
  onSelect: (colorId: string) => void;
}

/**
 * Enterprise Color Picker with disclaimer notifications.
 * Allows users to choose from admin-authorized master colors.
 * Includes a tooltip warning for digital-to-real-world color accuracy.
 */
const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selectedColorId, onSelect }) => {
  const selectedColor = colors.find(c => c.id === selectedColorId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Master Color Sequence</p>
        {selectedColor && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
             <AlertCircle size={10} className="text-amber-500" />
             <span className="text-[8px] font-black uppercase text-amber-700 tracking-widest">Accuracy Notice: Real-world results may vary</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        {colors.map(color => (
          <button
            key={color.id}
            onClick={() => onSelect(color.id)}
            title={`${color.name} (${color.type})`}
            className={clsx(
              'group relative w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center',
              selectedColorId === color.id ? 'border-pixs-mint scale-110 shadow-lg shadow-pixs-mint/20' : 'border-slate-50 hover:border-slate-300'
            )}
          >
            <div 
              className="w-8 h-8 rounded-xl shadow-inner transition-transform group-hover:scale-105" 
              style={{ backgroundColor: color.hex }}
            />
            {selectedColorId === color.id && (
              <div className="absolute -top-1.5 -right-1.5 bg-pixs-mint text-slate-900 rounded-lg p-0.5 shadow-md">
                <Check size={10} strokeWidth={4} />
              </div>
            )}
            {color.type === 'Premium' && (
               <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-slate-100 text-[6px] font-black uppercase tracking-tighter rounded-full border border-slate-700">Premium</div>
            )}
          </button>
        ))}
      </div>
      
      {selectedColor && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
          Selected Node: <span className="text-slate-900">{selectedColor.name}</span>
        </p>
      )}
    </div>
  );
};

export default ColorPicker;
