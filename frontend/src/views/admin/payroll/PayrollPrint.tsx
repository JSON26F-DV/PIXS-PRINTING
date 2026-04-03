import React from 'react';
import { Printer, FileText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface PayrollPrintProps {
  componentRef: React.RefObject<HTMLDivElement | null>;
  onPrintAll: () => void;
  onPrintSingle: () => void;
}

const PayrollPrint: React.FC<PayrollPrintProps> = ({ componentRef }) => {
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  return (
    <div className="PayrollPrintSection flex items-center gap-4 mb-8">
      <button 
        onClick={() => handlePrint()}
        className="PayrollPrintAllButton flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 text-[#75EEA5] text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 hover:-translate-y-0.5"
      >
        <Printer size={16} />
        Output Unified Audit
      </button>
      
      <button 
        disabled
        className="PayrollPrintSingleButton flex items-center gap-2.5 px-6 py-3.5 bg-white text-slate-500 border border-slate-100 text-xs font-black uppercase tracking-widest rounded-2xl transition-all opacity-50 cursor-not-allowed"
      >
        <FileText size={16} />
        Selective Payload (WIP)
      </button>
    </div>
  );
};

export default PayrollPrint;
