import React from 'react';
import type { CartColorInfo } from '../../../types/cart';

interface ColorInfoProps {
  color: CartColorInfo | null;
}

const ColorInfo: React.FC<ColorInfoProps> = ({ color }) => {
  if (!color) {
    return <p className="CartProductColor text-sm text-slate-500">No color selected</p>;
  }

  return (
    <div className="CartProductColor flex items-center gap-2">
      <span className="h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: color.hex }} />
      <span className="text-sm font-medium text-slate-700">{color.name}</span>
      <span
        className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600"
        title="Color appearance may vary by display and printing process."
      >
        Color may vary
      </span>
    </div>
  );
};

export default ColorInfo;
