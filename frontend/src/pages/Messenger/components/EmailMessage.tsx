
import { Mail, Shield, Calendar } from 'lucide-react'
import { clsx } from 'clsx'

interface EmailMessageProps {
  messageText: string
  created_at: string
  isCustomer: boolean
}

export default function EmailMessage({ messageText, created_at, isCustomer }: EmailMessageProps) {
  // Split subject and body: if first line is relatively short, treat as subject.
  const lines = messageText.split('\n')
  const subject = lines[0] && lines[0].length < 100 ? lines[0] : 'Official Notification'
  const body = lines[0] && lines[0].length < 100 ? lines.slice(1).join('\n') : messageText

  return (
    <div 
      className={clsx(
        "w-full max-w-md rounded-[24px] overflow-hidden shadow-xl border p-5 transition-all text-left",
        isCustomer ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-100 text-slate-900"
      )}
    >
      {/* Mail Envelope Icon Bar */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-white/10 pb-3.5 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mail className="text-blue-500" size={14} />
          </div>
          <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase italic">
            SECURE SMTP EMAIL
          </span>
        </div>
        <span className="text-[9px] font-mono opacity-50 font-bold uppercase tracking-widest flex items-center gap-1">
          <Calendar size={10} />
          {new Date(created_at).toLocaleDateString([], { dateStyle: 'medium' })}
        </span>
      </div>

      {/* Header Info */}
      <div className="space-y-1.5 text-[10px] font-bold opacity-75 uppercase tracking-wider mb-4 px-1">
        <p className="truncate">
          <span className="opacity-50 font-mono">From: </span>
          <span className="text-blue-500 font-mono">noreply@pixsprinting.com</span>
        </p>
        <p className="truncate">
          <span className="opacity-50 font-mono">Subject: </span>
          <span className={clsx("font-black tracking-tighter italic", isCustomer ? "text-white" : "text-slate-950")}>
            {subject}
          </span>
        </p>
      </div>

      {/* Email Body */}
      <div className={clsx(
        "rounded-xl p-4 border text-[11px] leading-relaxed whitespace-pre-wrap font-sans min-h-[80px]",
        isCustomer 
          ? "bg-slate-950/40 border-white/5 text-slate-100" 
          : "bg-slate-50 border-slate-150/50 text-slate-800"
      )}>
        {body.trim() || 'No content provided.'}
      </div>

      {/* SMTP Protection Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-150 dark:border-white/10 flex items-center justify-between text-[9px] font-black tracking-widest uppercase opacity-40">
        <span className="flex items-center gap-1">
          <Shield size={11} className="text-emerald-500" />
          Encrypted TLS 1.3
        </span>
        <span className="font-mono">PIXS MAIL SYSTEM</span>
      </div>
    </div>
  )
}
