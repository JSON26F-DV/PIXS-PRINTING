
import { Mail, Shield, Calendar } from 'lucide-react'
import { clsx } from 'clsx'

interface EmailMessageProps {
  messageText: string
  created_at: string
  isCustomer: boolean
}

export default function EmailMessage({ messageText, created_at, isCustomer }: EmailMessageProps) {
  return (
    <div 
      className={clsx(
        "w-full max-w-full md:max-w-md rounded-[24px] overflow-hidden shadow-xl border transition-all text-left",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}
    >
      {/* Mail Envelope Header */}
      <div className={clsx(
        "flex items-center justify-between px-5 py-3.5 border-b",
        isCustomer ? "border-white/10" : "border-slate-100"
      )}>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mail className="text-blue-500" size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase italic leading-none">
              Help & Support
            </span>
            <span className={clsx(
              "text-[9px] font-mono tracking-wider mt-0.5",
              isCustomer ? "text-slate-400" : "text-slate-400"
            )}>
              noreply@pixsprinting.com
            </span>
          </div>
        </div>
        <span className={clsx(
          "text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1",
          isCustomer ? "text-slate-500" : "text-slate-400"
        )}>
          <Calendar size={10} />
          {new Date(created_at).toLocaleDateString([], { dateStyle: 'medium' })}
        </span>
      </div>

      {/* Email Body */}
      <div className={clsx(
        "px-5 py-4 text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap font-sans min-h-[60px]",
        isCustomer ? "text-slate-200" : "text-slate-700"
      )}>
        {messageText?.trim() || 'No content provided.'}
      </div>

      {/* SMTP Protection Footer */}
      <div className={clsx(
        "px-5 py-3 border-t flex items-center justify-between text-[9px] font-black tracking-widest uppercase",
        isCustomer ? "border-white/10 text-slate-600" : "border-slate-100 text-slate-300"
      )}>
        <span className="flex items-center gap-1">
          <Shield size={11} className="text-emerald-500" />
          Encrypted TLS 1.3
        </span>
        <span className="font-mono">PIXS MAIL</span>
      </div>
    </div>
  )
}
