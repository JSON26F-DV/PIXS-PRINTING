import React from 'react'

export const PayrollSystemHeader: React.FC = () => {
  return (
    <div className="PayrollHeader flex flex-col pt-8">
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic drop-shadow-sm select-none">
        Chronographic Payroll System
      </h1>
      <p className="mt-1.5 text-sm font-bold tracking-[4px] text-slate-400 uppercase opacity-70">
        Precision Attendance & Dynamic Recalculation Node
      </p>

      {/* Visual Accents */}
      <div className="mt-4 h-1.5 w-32 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
    </div>
  )
}

export default PayrollSystemHeader
