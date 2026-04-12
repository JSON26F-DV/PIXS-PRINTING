import React from 'react'
import { PenTool, MessageSquare, Tag } from 'lucide-react'

interface ExtraNotesSectionProps {
  notes: string
  setNotes: (notes: string) => void
}

const ExtraNotesSection: React.FC<ExtraNotesSectionProps> = ({
  notes,
  setNotes,
}) => {
  return (
    <section className="ExtraNotesSection space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <PenTool size={18} className="text-pixs-mint" />
        <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
          Production Notes
        </h2>
      </div>

      <div className="group hover:border-pixs-mint/30 relative rounded-[32px] border border-slate-100 bg-white/50 p-6 shadow-xl shadow-slate-200/5 transition-all">
        <label className="mb-4 block text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
          Custom Requisition Requirements
        </label>

        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="ExtraNotesTextarea focus:border-pixs-mint min-h-[140px] w-full resize-none rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-sm font-bold text-slate-900 italic transition-all outline-none placeholder:text-slate-300 focus:bg-white"
            placeholder="Identify special printing instructions, color matching, or logistics requirements node..."
          />
          <div className="absolute right-6 bottom-4 flex items-center gap-2 text-[9px] font-black tracking-widest text-slate-300 uppercase italic opacity-50">
            <MessageSquare size={12} />
            Internal Notes Terminal
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[8px] font-black tracking-widest text-slate-400 uppercase italic opacity-60">
          <Tag size={10} className="text-pixs-mint" />
          Business-critical instructions will overrule default production
          sequence
        </div>
      </div>
    </section>
  )
}

export default ExtraNotesSection
