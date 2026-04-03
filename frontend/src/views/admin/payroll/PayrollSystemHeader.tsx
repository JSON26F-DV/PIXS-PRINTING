import React from 'react';

export const PayrollSystemHeader: React.FC = () => {
  return (
    <div className="PayrollHeader flex flex-col pt-8">
      <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic drop-shadow-sm select-none">
        Chronographic Payroll System
      </h1>
      <p className="text-sm font-bold text-slate-400 mt-1.5 uppercase tracking-[4px] opacity-70">
        Precision Attendance & Dynamic Recalculation Node
      </p>
      
      {/* Visual Accents */}
      <div className="h-1.5 w-32 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-full mt-4" />
    </div>
  );
};

export default PayrollSystemHeader;
