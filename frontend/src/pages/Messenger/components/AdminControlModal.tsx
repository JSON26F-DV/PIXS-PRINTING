import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { m, AnimatePresence } from 'framer-motion'
import { X, Pin, Search, Trash2, Zap, LayoutGrid, ChevronRight, Image as ImageIcon, ShoppingBag } from 'lucide-react'
import type { IMessage } from '../MessengerPage'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import axiosInstance from '../../../lib/axiosInstance.ts'
import BoxFallback from '../../../components/common/BoxFallback'
import MessageImageGrid from './MessageImageGrid'
import FullscreenGalleryModal from '../../../components/common/FullscreenGalleryModal'

interface AdminControlModalProps {
  isOpen: boolean
  onClose: () => void
  messages: IMessage[]
  targetUser?: { id: string; name: string; profile_picture?: string; company_name?: string | null }
  onDeleteConversation?: (targetId: string) => void
  onSendMessage?: (text: string, attachments?: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[], payment_code_id?: string, payment_code?: string) => void
  onToggleGallery?: () => void
  onScrollToMessage?: (messageId: string) => void
  isAdmin?: boolean
}

// ─── Sub-panel: Pinned Messages ──────────────────────────────────────────────

const PinnedPanel: React.FC<{
  pinnedMsgs: IMessage[]
  onScrollTo?: (id: string) => void
  onBack: () => void
}> = ({ pinnedMsgs, onScrollTo, onBack }) => (
  <m.div
    key="pinned"
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    className="absolute inset-0 flex flex-col bg-white z-10"
  >
    <div className="flex items-center gap-3 p-5 border-b border-slate-100 shrink-0">
      <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
        <ChevronRight size={16} className="rotate-180" />
      </button>
      <div className="flex items-center gap-2">
        <Pin size={14} className="text-slate-400" />
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
          Pinned Messages ({pinnedMsgs.length})
        </h3>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
      {pinnedMsgs.length === 0 ? (
        <p className="text-xs font-bold text-slate-300 italic p-6 text-center bg-slate-50 rounded-2xl">
          No pinned messages.
        </p>
      ) : pinnedMsgs.map(msg => (
        <button
          key={msg.id}
          onClick={() => { if (onScrollTo) onScrollTo(msg.id); onBack() }}
          className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors"
        >
          <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">
            <span>{msg.senderName}</span>
            <span>{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
          </div>
          <p className="text-xs font-bold text-slate-800 line-clamp-3">{msg.text}</p>
        </button>
      ))}
    </div>
  </m.div>
)

// ─── Sub-panel: Search ───────────────────────────────────────────────────────

const SearchPanel: React.FC<{
  messages: IMessage[]
  onScrollTo?: (id: string) => void
  onBack: () => void
}> = ({ messages, onScrollTo, onBack }) => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce: wait 300ms after the user stops typing before filtering
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const results = debouncedQuery.trim() !== ''
    ? messages.filter(m => !m.isDeleted && m.text && m.text.toLowerCase().includes(debouncedQuery.toLowerCase()))
    : []

  return (
    <m.div
      key="search"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="absolute inset-0 flex flex-col bg-white z-10"
    >
      <div className="flex items-center gap-3 p-5 border-b border-slate-100 shrink-0">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
          <ChevronRight size={16} className="rotate-180" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={14} />
          <input
            autoFocus
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs font-bold focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
        {query.trim() === '' ? (
          <p className="text-[10px] font-bold text-slate-300 p-6 text-center">Start typing to search…</p>
        ) : debouncedQuery.trim() === '' ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-[10px] font-bold text-slate-400 p-6 text-center">No results found.</p>
        ) : results.map(msg => (
          <button
            key={msg.id}
            onClick={() => { if (onScrollTo) onScrollTo(msg.id); onBack() }}
            className="w-full text-left p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 transition-colors shadow-sm"
          >
            <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">
              <span>{msg.senderName}</span>
              <span>{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
            </div>
            <p className="text-xs font-bold text-slate-800 line-clamp-2">{msg.text}</p>
          </button>
        ))}
      </div>
    </m.div>
  )
}

// ─── Sub-panel: Orders & Screenplates ────────────────────────────────────────

const OrdersScreenplatesPanel: React.FC<{
  msgs: IMessage[]
  onScrollTo?: (id: string) => void
  onBack: () => void
}> = ({ msgs, onScrollTo, onBack }) => (
  <m.div
    key="orders-screenplates"
    initial={{ x: '100%' }}
    animate={{ x: 0 }}
    exit={{ x: '100%' }}
    transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    className="absolute inset-0 flex flex-col bg-white z-10"
  >
    <div className="flex items-center gap-3 p-5 border-b border-slate-100 shrink-0">
      <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors">
        <ChevronRight size={16} className="rotate-180" />
      </button>
      <div className="flex items-center gap-2">
        <ShoppingBag size={14} className="text-slate-400" />
        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
          Orders & Screenplates ({msgs.length})
        </h3>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
      {msgs.length === 0 ? (
        <p className="text-xs font-bold text-slate-300 italic p-6 text-center bg-slate-50 rounded-2xl">
          No orders or screenplates.
        </p>
      ) : msgs.map(msg => (
        <button
          key={msg.id}
          onClick={() => { if (onScrollTo) onScrollTo(msg.id); onBack() }}
          className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors"
        >
          <div className="flex justify-between items-center text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">
            <span>{msg.senderName}</span>
            <span>{format(new Date(msg.timestamp), 'MMM d, HH:mm')}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {msg.message_type === 'order' && (
              <span className="px-2 py-0.5 text-[8px] font-black bg-pixs-mint/20 text-slate-800 rounded uppercase tracking-wider">
                Order
              </span>
            )}
            {msg.message_type === 'screenplate_request' && (
              <span className="px-2 py-0.5 text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 rounded uppercase tracking-wider">
                Screenplate
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 line-clamp-3">
            {msg.text || (msg.message_type === 'order' ? 'Order Confirmation Message' : 'Screenplate Confirmation Message')}
          </p>
        </button>
      ))}
    </div>
  </m.div>
)

// ─── Main Modal ──────────────────────────────────────────────────────────────

const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  messages,
  targetUser,
  onDeleteConversation,
  onSendMessage,
  onToggleGallery,
  onScrollToMessage,
  isAdmin = false
}) => {
  const [imgError, setImgError] = useState(false)
  const [activePanel, setActivePanel] = useState<null | 'pinned' | 'search' | 'orders'>(null)
  const [fullscreenOpen, setFullscreenOpen] = useState(false)
  const [fullscreenIndex, setFullscreenIndex] = useState(0)

  React.useEffect(() => {
    setImgError(false)
    // Reset sub-panel when modal opens/closes
    if (!isOpen) setActivePanel(null)
  }, [targetUser?.profile_picture, isOpen])

  if (!isOpen) return null

  const displaySrc =
    targetUser?.profile_picture && !imgError
      ? targetUser.profile_picture.startsWith('http') ||
        targetUser.profile_picture.startsWith('blob:') ||
        targetUser.profile_picture.startsWith('data:')
        ? targetUser.profile_picture
        : `/src/assets/profile/${targetUser.profile_picture}`
      : null

  const handleGeneratePayCode = async () => {
    try {
      const res = await axiosInstance.post('/api/admin/payment-codes', { quantity: 1 })
      const newCode = res.data.data[0]
      if (onSendMessage) {
        onSendMessage(`Please use this payment code to proceed with your transaction: ${newCode.code}`, [], newCode.id, newCode.code)
        toast.success('Generated and sent!')
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PayCode.')
    }
  }

  const pinnedMsgs = messages.filter(m => m.is_pinned && !m.isDeleted)
  const orderScreenplateMsgs = messages.filter(m => !m.isDeleted && (m.message_type === 'order' || m.message_type === 'screenplate_request'))

  // Build all image URLs from conversation attachments
  const getAssetUrl = (at: { type: string; name: string; url: string }) => {
    if (at.url.startsWith('blob:') || at.url.startsWith('http')) return at.url
    return at.type === 'image'
      ? `/src/assets/message_media/${at.name}`
      : `/src/assets/message_document/${at.name}`
  }

  const conversationImages = messages
    .filter(m => !m.isDeleted)
    .flatMap(m => (m.attachments || []).filter(a => a.type === 'image').map(a => getAssetUrl(a)))

  const handleImageClick = (index: number) => {
    setFullscreenIndex(index)
    setFullscreenOpen(true)
  }

  // Use document.body as portal target — messenger-portal-root has pointer-events:none
  // which would make the gallery modal's buttons unclickable.
  const portalRoot = typeof document !== 'undefined' ? document.body : null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-sm md:max-w-md bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header: Profile Info */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-lg mb-4 flex items-center justify-center">
                {displaySrc ? (
                  <img
                    src={displaySrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <BoxFallback
                    className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden"
                    iconClassName="h-9 w-9 brightness-0 invert opacity-30"
                  />
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{targetUser?.name || 'Unknown User'}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{targetUser?.company_name || 'Individual'}</p>
            </div>

            {/* Scrollable Actions Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">

              
              {/* ── Search Chat — button that opens sub-panel ── */}
              <section>
                <button
                  onClick={() => setActivePanel('search')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Search size={18} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-[11px] font-black uppercase text-slate-900">Search Chat</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Find messages by keyword</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>
              </section>

              {/* ── Orders & Screenplates — button that opens sub-panel ── */}
              <section>
                <button
                  onClick={() => setActivePanel('orders')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <ShoppingBag size={18} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-[11px] font-black uppercase text-slate-900">Orders & Screenplates</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                      {orderScreenplateMsgs.length === 0 ? 'None found' : `${orderScreenplateMsgs.length} items`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>
              </section>

              {/* ── Quick Image Preview ── */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ImageIcon size={12} /> Recent Media ({conversationImages.length})
                  </h3>
                  {conversationImages.length > 0 && (
                    <button
                      onClick={() => { if (onToggleGallery) onToggleGallery(); onClose() }}
                      className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      View All →
                    </button>
                  )}
                </div>
                {conversationImages.length > 0 ? (
                  <MessageImageGrid
                    images={conversationImages}
                    onImageClick={handleImageClick}
                    className="rounded-[20px] overflow-hidden"
                    maxVisible={6}
                  />
                ) : (
                  <div className="rounded-[20px] border-2 border-dashed border-slate-100 bg-slate-50/30 py-8 text-center">
                    <ImageIcon size={24} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-[9px] font-black tracking-[3px] text-slate-300 uppercase">No image yet</p>
                  </div>
                )}
              </section>

              {/* ── Media & Links button ── */}
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
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>
              </section>

              {/* ── Generate PayCode ── */}
              {isAdmin && (
                <section>
                  <button
                    onClick={handleGeneratePayCode}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition active:scale-[0.98] shadow-lg shadow-slate-900/20"
                  >
                    <Zap size={16} className="text-pixs-mint fill-current" /> Generate & Send PayCode
                  </button>
                </section>
              )}

              {/* ── Pinned Messages — button that opens sub-panel ── */}
              <section>
                <button
                  onClick={() => setActivePanel('pinned')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Pin size={18} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-[11px] font-black uppercase text-slate-900">Pinned Messages</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                      {pinnedMsgs.length === 0 ? 'None pinned' : `${pinnedMsgs.length} pinned`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>
              </section>


              {/* Sub-panels slide in over the content */}
              <AnimatePresence>
                {activePanel === 'pinned' && (
                  <PinnedPanel
                    pinnedMsgs={pinnedMsgs}
                    onScrollTo={onScrollToMessage}
                    onBack={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'search' && (
                  <SearchPanel
                    messages={messages}
                    onScrollTo={onScrollToMessage}
                    onBack={() => setActivePanel(null)}
                  />
                )}
                {activePanel === 'orders' && (
                  <OrdersScreenplatesPanel
                    msgs={orderScreenplateMsgs}
                    onScrollTo={onScrollToMessage}
                    onBack={() => setActivePanel(null)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer: Delete Chat */}
            {isAdmin && (
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
            )}
          </m.div>
        </div>
      )}

      {/* Fullscreen image viewer — portalled to body to escape pointer-events:none container */}
      {fullscreenOpen && portalRoot &&
        createPortal(
          <FullscreenGalleryModal
            isOpen={fullscreenOpen}
            onClose={() => setFullscreenOpen(false)}
            images={conversationImages}
            initialIndex={fullscreenIndex}
            productName="Conversation Media"
          />,
          portalRoot,
        )
      }
    </AnimatePresence>
  )
}

export default AdminControlModal
