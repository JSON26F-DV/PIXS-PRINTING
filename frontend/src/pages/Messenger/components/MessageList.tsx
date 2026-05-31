import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Virtuoso } from 'react-virtuoso'

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import {
  Smile,
  MoreHorizontal,
  CheckCheck,
  Edit2,
  Trash2,
  CornerUpRight,
  History,
  Plus,
  FileText,
  Download,
  ExternalLink,
  ArrowDown,
  Pin,
  Copy,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { clsx } from 'clsx'
import { format } from 'date-fns'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import type { EmojiClickData } from 'emoji-picker-react'

import type { IMessage } from '../MessengerPage.tsx'
import OrderConfirmMessage from './OrderConfirmMessage'
import ScreenplateConfirmMessage from './ScreenplateConfirmMessage'
import FullscreenGalleryModal from '../../../components/common/FullscreenGalleryModal'

interface MessageListProps {
  messages: IMessage[]
  onReact: (messageId: string, emoji: string) => void
  onReply: (msg: IMessage) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string, isHardDelete?: boolean) => void
  onPin?: (id: string) => void
  isAdmin?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  scrollToMessageId?: string | null
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']

interface PortalProps {
  children: React.ReactNode
}

const MessagePortal: React.FC<PortalProps> = ({ children }) => {
  const mount = document.getElementById('messenger-portal-root')
  if (!mount) return null
  return createPortal(children, mount)
}

const QuickReactBar: React.FC<{
  onSelect: (emoji: string) => void
  onShowMore: () => void
  isCustomer: boolean
  anchorRect: DOMRect | null
}> = ({ onSelect, onShowMore, isCustomer, anchorRect }) => {
  if (!anchorRect) return null

  return (
    <MessagePortal>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        style={{
          position: 'fixed',
          top: anchorRect.top - 60,
          left: isCustomer ? anchorRect.right - 280 : anchorRect.left,
          zIndex: 9999,
        }}
        className={clsx(
          'pointer-events-auto flex items-center gap-1 rounded-full border border-slate-100 bg-white p-1.5 shadow-2xl',
          isCustomer ? 'origin-right' : 'origin-left',
        )}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="bubble-emoji flex h-10 w-10 items-center justify-center text-xl transition-transform hover:scale-125 active:scale-95"
          >
            {emoji}
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-slate-100" />
        <button
          onClick={onShowMore}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <Plus size={20} />
        </button>
      </motion.div>
    </MessagePortal>
  )
}

const MessageBubble: React.FC<{
  message: IMessage
  onReact: (emoji: string) => void
  onReply: () => void
  onEdit: (text: string) => void
  onDelete: (isHardDelete?: boolean) => void
  onPin?: () => void
  isAdmin?: boolean
  onImageClick: (url: string) => void
  isHighlighted?: boolean
}> = ({ message, onReact, onReply, onEdit, onDelete, onPin, isAdmin, onImageClick, isHighlighted }) => {
  const [showQuickBar, setShowQuickBar] = useState(false)
  const [showFullPicker, setShowFullPicker] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showOriginal, setShowOriginal] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)

  const isCustomer = message.sender === 'customer'

  const getAssetUrl = (at: { type: string, name: string, url: string }) => {
    if (at.url.startsWith('blob:') || at.url.startsWith('http')) return at.url;
    return at.type === 'image' 
        ? `/src/assets/message_media/${at.name}` 
        : `/src/assets/message_document/${at.name}`;
  }

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(editText.trim())
    }
    setIsEditing(false)
  }

  const hasCard = message.order_id || message.screenplate_request_id;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info: PanInfo) => {
        if (info.offset.x < -100 || info.offset.x > 100) onReply()
      }}
      className={clsx(
        'group relative mb-3 md:mb-8 flex cursor-default flex-col transition-colors duration-1000',
        isHighlighted && 'bg-pixs-mint/10',
        isCustomer ? 'items-end mr-2 min-[360px]:mr-3.5 min-[375px]:mr-3.5 min-[414px]:mr-3 sm:mr-0' : 'items-start',
      )}
    >
      <div
        className={clsx(
          'relative flex max-w-[80%] min-[414px]:max-w-[85%] flex-col md:max-w-[70%]',
          isCustomer ? 'items-end' : 'items-start',
        )}
      >        {/* Reply Snippet Node */}
        {message.replyTo && (
          <div
            className={clsx(
              'mb-2 flex items-center gap-2 border-l-2 border-slate-300 px-3 py-1.5 opacity-40',
              isCustomer ? 'mr-1 flex-row-reverse text-right' : 'ml-1',
            )}
          >
            <CornerUpRight size={12} />
            <div className="overflow-hidden">
              <p className="text-[8px] font-black tracking-widest uppercase">
                {message.replyTo.senderName}
              </p>
              <p className="truncate text-[10px] font-bold italic">
                {message.replyTo.isDeleted ? 'this message has been removed.' : message.replyTo.text}
              </p>
            </div>
          </div>
        )}

        {/* Message Container */}
        <div
          className={clsx(
            'relative rounded-[14px] min-[360px]:rounded-[16px] sm:rounded-[20px] md:rounded-[28px] text-[10px] min-[360px]:text-[11px] min-[414px]:text-[12px] sm:text-[13px] md:text-sm leading-relaxed font-bold shadow-sm transition-all break-words',
            (hasCard && !message.isDeleted) ? '' : 'px-2 py-1 min-[360px]:px-2.5 min-[360px]:py-1.5 min-[414px]:px-3 min-[414px]:py-2 sm:px-4 sm:py-3 md:px-6 md:py-4',
            message.isDeleted
              ? 'border border-slate-200 bg-slate-100 text-slate-400 font-normal italic'
              : isCustomer
                ? `rounded-tr-[4px] ${(hasCard && !message.isDeleted) ? '' : 'bg-slate-900 text-white shadow-slate-900/10'}`
                : `rounded-tl-[4px] ${(hasCard && !message.isDeleted) ? '' : 'border border-slate-100 bg-white text-slate-800 shadow-slate-100/50'}`,
            message.is_pinned && 'ring-2 ring-pixs-mint'
          )}
        >
          {message.is_pinned && (
            <div className="absolute -top-2 -right-2 bg-pixs-mint rounded-full p-1 text-slate-900 shadow-sm z-10">
              <Pin size={10} className="fill-current" />
            </div>
          )}
          {isEditing ? (
            <div className="flex min-w-[200px] flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="custom-scrollbar resize-none rounded-xl bg-slate-800 p-4 text-xs leading-relaxed text-white focus:outline-none"
                rows={3}
                autoFocus
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg px-3 py-1 text-[9px] font-black uppercase hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="bg-pixs-mint rounded-lg px-3 py-1 text-[9px] font-black text-slate-900 uppercase"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.isDeleted ? (
                <span>this message has been removed.</span>
              ) : (
                !hasCard && message.text
              )}

              {message.isEdited && !message.isDeleted && (
                <span
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="text-pixs-mint ml-2 cursor-pointer text-[9px] font-black tracking-widest uppercase italic opacity-60 hover:opacity-100"
                >
                  (Edited)
                </span>
              )}
            </>
          )}

          {message.order_id && !isEditing && !message.isDeleted && (
            <div className="mt-2 group-last:mb-0">
               <OrderConfirmMessage messageId={message.id} orderId={message.order_id} isCustomer={isCustomer} isConfirm={message.is_confirm} />
            </div>
          )}

          {message.screenplate_request_id && !isEditing && !message.isDeleted && (
            <div className="mt-2 group-last:mb-0">
               <ScreenplateConfirmMessage requestId={message.screenplate_request_id} isCustomer={isCustomer} onImageClick={onImageClick} />
            </div>
          )}

          {message.payment_code_id && !isEditing && !message.isDeleted && (
            <div className={clsx(
              "mt-3 flex items-center gap-2 rounded-lg p-2 border",
              isCustomer ? "bg-slate-800/50 border-white/10" : "bg-slate-50 border-slate-200"
            )}>
              <span className={clsx("text-[10px] font-black uppercase", isCustomer ? "text-pixs-mint" : "text-slate-500")}>Pay Code:</span>
              <span className="text-[12px] font-bold tracking-wider">{message.payment_code_id}</span>
              <button 
                onClick={() => { 
                  navigator.clipboard.writeText(message.payment_code_id!); 
                  toast.success('Payment code copied!'); 
                }}
                className={clsx(
                  "ml-auto flex items-center gap-1 rounded px-2 py-1 text-[9px] transition",
                  isCustomer ? "bg-white/10 hover:bg-white/20" : "bg-white hover:bg-slate-100 border border-slate-200"
                )}
              >
                <Copy size={10} /> Copy
              </button>
            </div>
          )}

          <AnimatePresence>
            {showOriginal && message.originalText && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 rounded-xl border-t border-white/10 bg-white/5 p-3 pt-3 text-[11px] leading-tight text-slate-400 italic blur-[0.4px] transition-all hover:blur-none"
              >
                <div className="mb-1.5 flex items-center gap-1.5 opacity-50">
                  <History size={10} />
                  <span className="text-[8px] font-black tracking-widest uppercase">
                    Original Node Projection
                  </span>
                </div>
                {message.originalText}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={clsx(
              'mt-2 flex items-center gap-1 text-[8px] font-black tracking-widest uppercase opacity-40',
              isCustomer
                ? (hasCard ? 'justify-end text-slate-500' : 'justify-end text-white')
                : 'justify-start text-slate-400',
            )}
          >
            {format(new Date(message.timestamp), 'HH:mm')}
            {isCustomer && <CheckCheck size={10} className="text-pixs-mint" />}
          </div>
        </div>

        {/* Fulfillment Asset Node: Images & Documents */}
        {message.attachments &&
          message.attachments.length > 0 &&
          !message.isDeleted && (
            <div
              className={clsx(
                'mt-3 flex w-full flex-col gap-3',
                isCustomer ? 'items-end' : 'items-start',
              )}
            >
              {message.attachments.map((at, idx) => (
                <div key={idx} className="max-w-full">
                  {at.type === 'image' ? (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="group relative cursor-pointer overflow-hidden rounded-[16px] md:rounded-[24px] border border-slate-100 bg-slate-50 shadow-lg"
                      onClick={() => onImageClick(getAssetUrl(at))}
                    >
                      <img
                        src={getAssetUrl(at)}
                        alt={at.name}
                        className="max-h-[180px] sm:max-h-[240px] md:max-h-[300px] w-auto object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <ExternalLink size={24} className="text-white" />
                      </div>
                    </motion.div>
                  ) : (
                    <a
                      href={getAssetUrl(at)}
                      download={at.name}
                      className={clsx(
                        'group flex items-center gap-3 md:gap-4 rounded-[16px] md:rounded-[22px] border p-3 md:p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]',
                        isCustomer
                          ? 'hover:border-pixs-mint/50 border-slate-200 bg-slate-50 text-slate-900'
                          : 'hover:border-pixs-mint/50 border-slate-100 bg-white text-slate-900',
                      )}
                    >
                      <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/10">
                        <FileText size={18} className="text-pixs-mint md:hidden" />
                        <FileText size={20} className="text-pixs-mint hidden md:block" />
                      </div>
                      <div className="min-w-0 pr-2 md:pr-4">
                        <p className="truncate text-[9px] md:text-[10px] leading-none font-black uppercase italic">
                          {at.name}
                        </p>
                        <p className="mt-1.5 md:mt-2 flex items-center gap-1.5 text-[7px] md:text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                          Click to Download{' '}
                          <Download size={10} className="text-pixs-mint" />
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

        {/* Reaction Display Node */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={clsx(
              'absolute -bottom-3 flex gap-1',
              isCustomer ? 'right-2' : 'left-2',
            )}
          >
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map(
              (emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2 py-1 shadow-sm transition-colors hover:bg-slate-50"
                  onClick={() => onReact(emoji)}
                >
                  <span className="text-[14px] leading-none">{emoji}</span>
                  <span className="text-[9px] font-black text-slate-900">
                    {message.reactions?.filter((r) => r.emoji === emoji).length}
                  </span>
                </motion.div>
              ),
            )}
          </div>
        )}

        {/* Advanced Action Terminal */}
        {!message.isDeleted && !isEditing && (
          <div
            className={clsx(
              'absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100',
              isCustomer ? '-left-12 md:-left-24 flex-row-reverse' : '-right-12 md:-right-24',
            )}
          >
            <div className="relative" ref={anchorRef}>
              <button
                onClick={(e) => {
                  setAnchorRect(e.currentTarget.getBoundingClientRect())
                  setShowQuickBar(!showQuickBar)
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-md transition-all hover:scale-110 hover:text-slate-900"
              >
                <Smile size={18} />
              </button>

              <AnimatePresence>
                {showQuickBar && (
                  <>
                    <QuickReactBar
                      isCustomer={isCustomer}
                      anchorRect={anchorRect}
                      onSelect={(emoji) => {
                        onReact(emoji)
                        setShowQuickBar(false)
                      }}
                      onShowMore={() => {
                        setShowQuickBar(false)
                        setShowFullPicker(true)
                      }}
                    />
                    <button
                      onClick={() => setShowQuickBar(false)}
                      className="pointer-events-auto fixed inset-0 z-[9998] border-none bg-transparent outline-none"
                    />
                  </>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showFullPicker && anchorRect && (
                  <MessagePortal>
                    <div
                      style={{
                        position: 'fixed',
                        top: Math.max(10, anchorRect.top - 450),
                        left: isCustomer
                          ? Math.max(10, anchorRect.right - 350)
                          : anchorRect.left,
                        zIndex: 9999,
                        pointerEvents: 'auto',
                      }}
                    >
                      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-2xl">
                        <EmojiPicker
                          onEmojiClick={(emoji: EmojiClickData) => {
                            onReact(emoji.emoji)
                            setShowFullPicker(false)
                          }}
                          theme={Theme.LIGHT}
                          skinTonesDisabled
                          searchDisabled
                        />
                      </div>
                      <button
                        onClick={() => setShowFullPicker(false)}
                        className="fixed inset-0 z-[-1] border-none bg-transparent outline-none"
                      />
                    </div>
                  </MessagePortal>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  setAnchorRect(e.currentTarget.getBoundingClientRect())
                  setShowOptions(!showOptions)
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-md transition-all hover:scale-110 hover:text-slate-900"
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {showOptions && anchorRect && (
                  <MessagePortal>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      style={{
                        position: 'fixed',
                        top: Math.max(10, anchorRect.top - 160),
                        left: isCustomer
                          ? anchorRect.right - 144
                          : anchorRect.right + 10,
                        zIndex: 9999,
                        pointerEvents: 'auto',
                      }}
                      className={clsx(
                        'w-36 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl',
                        isCustomer
                          ? 'origin-bottom-right'
                          : 'origin-bottom-left',
                      )}
                    >
                      <button
                        onClick={() => {
                          onReply()
                          setShowOptions(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-slate-700 uppercase transition-colors hover:bg-slate-50"
                      >
                        <CornerUpRight size={16} className="text-slate-400" />{' '}
                        Reply
                      </button>
                      {isCustomer && (
                        <button
                          onClick={() => {
                            setIsEditing(true)
                            setShowOptions(false)
                          }}
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-slate-700 uppercase transition-colors hover:bg-slate-50"
                        >
                          <Edit2 size={16} className="text-slate-400" /> Edit
                        </button>
                      )}
                      {isAdmin && onPin && (
                        <button
                          onClick={() => {
                            onPin()
                            setShowOptions(false)
                          }}
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-emerald-600 uppercase transition-colors hover:bg-emerald-50"
                        >
                          <Pin size={16} className="text-emerald-500" /> {message.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDelete()
                          setShowOptions(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-rose-500 uppercase transition-colors hover:bg-rose-50"
                      >
                        <Trash2 size={16} className="text-rose-400" /> Delete
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm('Hard delete this message and all its files from the server?')) {
                              onDelete(true)
                            }
                            setShowOptions(false)
                          }}
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-white bg-red-600 uppercase transition-colors hover:bg-red-700"
                        >
                          <Trash2 size={16} className="text-white" /> Delete DB
                        </button>
                      )}
                      <button
                        onClick={() => setShowOptions(false)}
                        className="fixed inset-0 z-[-1] border-none bg-transparent outline-none"
                      />
                    </motion.div>
                  </MessagePortal>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  isAdmin,
  isLoading,
  onLoadMore,
  isLoadingMore,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const [hasScrolledUp, setHasScrolledUp] = useState(false)
  const prevLengthRef = useRef(messages.length)

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activeImage, setActiveImage] = useState('')

  const handleImageClick = (url: string) => {
    setActiveImage(url)
    setGalleryOpen(true)
  }

  // Check if viewport is at the bottom
  const isNearBottom = (): boolean => {
    const container = scrollContainerRef.current
    if (!container) return true
    
    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < 50
  }

  // Scroll to the very bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = scrollContainerRef.current
    if (!container) return
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    })
  }

  // Handle scroll event
  const handleScroll = useCallback(() => {
    setHasScrolledUp(!isNearBottom())
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [scrollContainer, handleScroll])

  useEffect(() => {
    const newMessage = messages.length > prevLengthRef.current
    prevLengthRef.current = messages.length

    if (newMessage || isNearBottom()) {
      setTimeout(() => {
        scrollToBottom(newMessage ? 'smooth' : 'auto')
      }, 50)
    }
  }, [messages])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={(el) => {
          scrollContainerRef.current = el
          setScrollContainer(el)
        }}
        className="MessageList flex flex-col scroll-smooth bg-emoji-pattern bg-slate-50/20 px-2 min-[360px]:px-3 min-[414px]:px-3 sm:px-8 pt-6 md:pt-12 md:pb-14"
        style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#39ff14 transparent',
        }}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-col">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-20 text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
              <p className="text-xs font-black uppercase tracking-widest">Loading Conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center opacity-60 transition-opacity hover:opacity-100">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[32px] bg-white shadow-2xl shadow-slate-200/50">
                <FileText size={40} className="text-slate-300" />
              </div>
              <h3 className="mb-2 text-xl font-black tracking-tight text-slate-800 uppercase italic">Awaiting Transmission</h3>
              <p className="max-w-xs text-[10px] font-bold tracking-[2px] text-slate-400 uppercase leading-relaxed">
                The communication channel is open. Send a message to initiate contact directly with PIXS Administration.
              </p>
            </div>
          ) : (
            <Virtuoso
              customScrollParent={scrollContainer || undefined}
              data={messages}
              firstItemIndex={10000 - messages.length}
              startReached={() => {
                if (onLoadMore && !isLoadingMore) {
                  onLoadMore()
                }
              }}
              initialTopMostItemIndex={messages.length - 1}
              itemContent={(_index, msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onReact={(emoji) => onReact(msg.id, emoji)}
                  onReply={() => onReply(msg)}
                  onEdit={(text) => onEdit(msg.id, text)}
                  onDelete={(isHard) => onDelete(msg.id, isHard)}
                  onPin={onPin ? () => onPin(msg.id) : undefined}
                  isAdmin={isAdmin}
                  onImageClick={handleImageClick}
                />
              )}
              components={{
                Header: () => isLoadingMore ? (
                  <div className="py-4 flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800"></div>
                  </div>
                ) : <div className="h-4" />,
                Footer: () => <div className="md:pb-10" />
              }}
            />
          )}
        </div>
      </div>

      <MessagePortal>
        <FullscreenGalleryModal
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={[activeImage]}
          productName="Production Assets"
        />
      </MessagePortal>

      <AnimatePresence>
        {hasScrolledUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="group absolute bottom-4 md:bottom-6 left-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-900 shadow-2xl transition-all hover:scale-110 active:scale-95"
            style={{ transform: 'translateX(-50%)' }}
          >
            <ArrowDown
              size={20}
              className="transition-transform group-hover:translate-y-0.5 md:group-hover:translate-y-1 md:size-[24px]"
            />
            <div className="absolute -top-12 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest whitespace-nowrap text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
              Latest fulfillment
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageList
