import React from 'react'
import { Printer, FileText } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

interface PayrollPrintProps {
  componentRef: React.RefObject<HTMLDivElement | null>
  onPrintAll: () => void
  onPrintSingle: () => void
}

const PayrollPrint: React.FC<PayrollPrintProps> = ({ componentRef }) => {
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  })

  return (
    <div className="PayrollPrintSection mb-8 flex items-center gap-4">
      <button
        onClick={() => handlePrint()}
        className="PayrollPrintAllButton flex items-center gap-2.5 rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-black tracking-widest text-[#75EEA5] uppercase shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
      >
        <Printer size={16} />
        Output Unified Audit
      </button>

      <button
        disabled
        className="PayrollPrintSingleButton flex cursor-not-allowed items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-6 py-3.5 text-xs font-black tracking-widest text-slate-500 uppercase opacity-50 transition-all"
      >
        <FileText size={16} />
        Selective Payload (WIP)
      </button>
    </div>
  )
}

export default PayrollPrint
