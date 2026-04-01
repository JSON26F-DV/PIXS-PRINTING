import React from 'react';
import { PenTool, MessageSquare, Tag } from 'lucide-react';

interface ExtraNotesSectionProps {
  notes: string;
  setNotes: (notes: string) => void;
}

const ExtraNotesSection: React.FC<ExtraNotesSectionProps> = ({ notes, setNotes }) => {
  return (
    <section className="ExtraNotesSection space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <PenTool size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black uppercase italic tracking-tighter text-slate-900">
           Production Notes
        </h2>
      </div>

      <div className="relative group p-6 bg-white/50 border border-slate-100 rounded-[32px] hover:border-pixs-mint/30 transition-all shadow-xl shadow-slate-200/5">
        <label className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4 block italic">
           Custom Requisition Requirements
        </label>
        
        <div className="relative">
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="ExtraNotesTextarea w-full min-h-[140px] bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-900 focus:bg-white focus:border-pixs-mint transition-all outline-none resize-none placeholder:text-slate-300 italic"
            placeholder="Identify special printing instructions, color matching, or logistics requirements node..."
          />
          <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest italic opacity-50">
             <MessageSquare size={12} />
             Internal Notes Terminal
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-[8px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">
           <Tag size={10} className="text-pixs-mint" />
           Business-critical instructions will overrule default production sequence
        </div>
      </div>
    </section>
  );
};

export default ExtraNotesSection;
