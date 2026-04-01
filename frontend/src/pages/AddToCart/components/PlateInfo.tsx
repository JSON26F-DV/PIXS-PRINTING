import React from 'react';
import type { CartPlateInfo } from '../../../types/cart';

interface PlateInfoProps {
  plate: CartPlateInfo | null;
  setupFeeApplied: number;
}

const PlateInfo: React.FC<PlateInfoProps> = ({ plate, setupFeeApplied }) => {
  if (!plate) {
    return <p className="CartProductPlate text-sm text-slate-500">No plate selected</p>;
  }

  return (
    <div className="CartProductPlate rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">{plate.name}</p>
      <p className="text-xs text-slate-500">{plate.printingInfo}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-white px-2 py-1 text-slate-600">Print/unit: PHP {plate.printPricePerUnit.toFixed(2)}</span>
        <span className="rounded bg-white px-2 py-1 text-slate-600">Setup fee: PHP {setupFeeApplied.toFixed(2)}</span>
        {plate.isOwned && <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">Owned plate, no fee</span>}
        {!plate.isOwned && setupFeeApplied === 0 && (
          <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">Already charged once</span>
        )}
      </div>
    </div>
  );
};

export default PlateInfo;
