import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

interface MessageNotFoundProps {
  messageType: string
  typeId: string
  isCustomer?: boolean
}

const MessageNotFound: React.FC<MessageNotFoundProps> = ({
  messageType,
  typeId,
  isCustomer = false,
}) => {
  return (
    <div
      className={clsx(
        "w-full max-w-full md:max-w-sm rounded-[32px] overflow-hidden shadow-2xl border",
        isCustomer 
          ? "bg-slate-800 border-white/10 text-white" 
          : "bg-white border-slate-100 text-slate-900"
      )}
    >
      {/* Header */}
      <div className={clsx(
        "p-6 border-b",
        isCustomer ? "border-white/10" : "border-slate-100"
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className={clsx(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            isCustomer ? "bg-rose-500/20" : "bg-rose-100"
          )}>
            <AlertTriangle 
              size={20} 
              className={isCustomer ? "text-rose-400" : "text-rose-500"} 
            />
          </div>
          <span className={clsx(
            "text-[10px] font-black tracking-[4px] uppercase italic",
            isCustomer ? "text-rose-400" : "text-rose-500"
          )}>
            Data Not Found
          </span>
        </div>
        
        <h3 className="text-lg font-black italic uppercase leading-tight">
          Related {formatType(messageType)} not available
        </h3>
        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">
          ID: {typeId}
        </p>
      </div>

      {/* Body */}
      <div className={clsx(
        "p-6",
        isCustomer ? "bg-white/5" : "bg-slate-50"
      )}>
        <p className="text-xs leading-relaxed font-medium opacity-70">
          The {messageType.replace('_', ' ')} associated with this message may have been 
          deleted or is no longer accessible. Please contact support if you believe this 
          is an error.
        </p>
      </div>

      {/* Footer */}
      <div className={clsx(
        "p-4 flex justify-end border-t",
        isCustomer ? "border-white/10" : "border-slate-100"
      )}>
        <button 
          onClick={() => window.location.reload()}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
            isCustomer 
              ? "bg-white/10 hover:bg-white/20 text-white" 
              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
        )}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
    </div>
  )
}

function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    'order': 'Order',
    'screenplate_request': 'Screenplate Request',
    'payment_code': 'Payment Code',
    'refund': 'Refund',
    'expenditure': 'Expenditure',
  }
  return typeMap[type] || type.replace('_', ' ')
}

export default MessageNotFound
