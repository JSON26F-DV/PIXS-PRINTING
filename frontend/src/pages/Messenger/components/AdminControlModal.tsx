import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pin, Search, Trash2, Zap, LayoutGrid } from 'lucide-react'
import type { IMessage } from '../MessengerPage'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance.ts'

interface AdminControlModalProps {
  isOpen: boolean
  onClose: () => void
  messages: IMessage[]
  targetUser?: { id: string; name: string; profile_picture?: string; company_name?: string | null }
  onDeleteConversation?: (targetId: string) => void
  onSendMessage?: (text: string, attachments?: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[], payment_code_id?: string) => void
  onToggleGallery?: () => void
  onScrollToMessage?: (messageId: string) => void
}

const AdminControlModal: React.FC<AdminControlModalProps> = ({ 
  isOpen, 
  onClose, 
  messages, 
  targetUser, 
  onDeleteConversation, 
  onSendMessage,
  onToggleGallery,
  onScrollToMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const handleGeneratePayCode = async () => {
    try {
      const res = await axiosInstance.post('/api/admin/payment-codes', { quantity: 1 })
      const newCode = res.data.data[0]
      if (onSendMessage) {
        onSendMessage(`Please use this payment code to proceed with your transaction: ${newCode.code}`, [], newCode.id)
        toast.success('Generated and sent!')
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PayCode.')
    }
  }

  const pinnedMsgs = messages.filter(m => m.is_pinned && !m.isDeleted)
  const searchResults = searchQuery.trim() !== '' 
    ? messages.filter(m => !m.isDeleted && m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm md:max-w-md bg-white h-full shadow-2xl flex flex-col z-10"
          >
            {/* Header: Profile Info */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-lg mb-4">
                {targetUser?.profile_picture ? (
                  <img src={targetUser.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white font-black text-xl">
                    {targetUser?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{targetUser?.name || 'Unknown User'}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{targetUser?.company_name || 'Individual'}</p>
            </div>

            {/* Scrollable Actions Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Media & Links */}
              <section>
                <button 
                  onClick={() => {
                    if (onToggleGallery) onToggleGallery()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-pixs-mint hover:shadow-lg hover:shadow-pixs-mint/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-pixs-mint transition-colors">
                    <LayoutGrid size={18} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-[11px] font-black uppercase text-slate-900">Media, Files & Links</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">View & Manage Shared Assets</p>
                  </div>
                </button>
              </section>

              {/* Generate PayCode */}
              <section>
                <button
                  onClick={handleGeneratePayCode}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition active:scale-[0.98] shadow-lg shadow-slate-900/20"
                >
                  <Zap size={16} className="text-pixs-mint fill-current" /> Generate & Send PayCode
                </button>
              </section>

              {/* Pinned Messages */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Pin size={12} className="text-slate-400" /> Pinned Messages ({pinnedMsgs.length})
                </h3>
                <div className="space-y-2">
                  {pinnedMsgs.length === 0 ? (
                    <p className="text-xs font-bold text-slate-300 italic p-4 text-center bg-slate-50 rounded-xl">No pinned messages.</p>
                  ) : pinnedMsgs.map(msg => (
                    <button 
                      key={msg.id}
                      onClick={() => {
                        if (onScrollToMessage) onScrollToMessage(msg.id)
                        onClose()
                      }}
                      className="w-full text-left p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">
                        <span>{msg.senderName}</span>
                        <span>{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-2">{msg.text}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Search */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Search size={12} className="text-slate-400" /> Search Chat
                </h3>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
                {searchQuery.trim() !== '' && (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {searchResults.length === 0 ? (
                      <p className="text-[10px] font-bold text-slate-400 p-2 text-center">No results found.</p>
                    ) : searchResults.map(msg => (
                      <button 
                        key={msg.id}
                        onClick={() => {
                          if (onScrollToMessage) onScrollToMessage(msg.id)
                          onClose()
                        }}
                        className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-400 transition-colors shadow-sm"
                      >
                        <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">
                          <span>{msg.senderName}</span>
                          <span>{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-2">{msg.text}</p>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Footer: Delete Chat */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => {
                  if (window.confirm('Are you absolutely sure you want to delete this entire conversation?')) {
                    if (targetUser?.id && onDeleteConversation) {
                      onDeleteConversation(targetUser.id)
                      onClose()
                    }
                  }
                }}
                disabled={!targetUser?.id}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete Entire Conversation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AdminControlModal
