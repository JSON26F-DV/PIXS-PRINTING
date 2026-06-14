import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'

import { createPortal } from 'react-dom'
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
  Pin,
  Copy,

  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { clsx } from 'clsx'
import { format } from 'date-fns'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import type { EmojiClickData } from 'emoji-picker-react'

import type { IMessage } from '../MessengerPage.tsx'
import OrderConfirmMessage from './OrderConfirmMessage'
import ExpenditureConfirmMessage from './ExpenditureConfirmMessage'
import RefundMessage from './RefundMessage'
import EmailMessage from './EmailMessage'
import MessageImageGrid from './MessageImageGrid'
import FullscreenGalleryModal from '../../../components/common/FullscreenGalleryModal'
import MessageNotFound from './MessageNotFound'

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
  onDeleteMedia?: (messageId: string, filename: string) => void
  onShowScrollDownChange?: (show: boolean) => void
  onHasUnreadNewMessagesChange?: (hasUnread: boolean) => void
  scrollToBottomRef?: React.MutableRefObject<(() => void) | null>
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

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 667

  const quickBarWidth = 296
  const quickBarHeight = 54

  let top = anchorRect.top - quickBarHeight - 6
  let left = isCustomer ? anchorRect.right - quickBarWidth : anchorRect.left

  const isMobile = viewportWidth < 768
  if (isMobile) {
    top = viewportHeight - quickBarHeight - 16
    left = (viewportWidth - quickBarWidth) / 2
  } else {
    if (top < 8) {
      top = anchorRect.bottom + 6
    }
    top = Math.max(8, Math.min(viewportHeight - quickBarHeight - 8, top))
    left = Math.max(8, Math.min(viewportWidth - quickBarWidth - 8, left))
  }

  return (
    <MessagePortal>
      <div
        style={{
          position: 'fixed',
          top,
          left,
          zIndex: 99999,
        }}
        className={clsx(
          'pointer-events-auto flex items-center gap-1 rounded-full border border-slate-100 bg-white p-1.5 shadow-2xl transition-all duration-200',
          isCustomer ? 'origin-right' : 'origin-left',
        )}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="bubble-emoji flex h-10 w-10 items-center justify-center text-xl active:scale-95"
          >
            {emoji}
          </button>
        ))}
        <div className="mx-1 h-6 w-px bg-slate-100" />
        <button
          onClick={onShowMore}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900"
        >
          <Plus size={20} />
        </button>
      </div>
    </MessagePortal>
  )
}

const MessageBubbleComponent: React.FC<{
  message: IMessage
  onReact: (emoji: string) => void
  onReply: () => void
  onEdit: (text: string) => void
  onDelete: (isHardDelete?: boolean) => void
  onPin?: () => void
  isAdmin?: boolean
  onImageClick: (url: string) => void
  isHighlighted?: boolean
  onDeleteMedia?: (messageId: string, filename: string) => void
  isEditing?: boolean
  onStartEdit?: () => void
  onCancelEdit?: () => void
  activeReactionMessageId: string | null
  setActiveReactionMessageId: (id: string | null) => void
  activeOptionsMessageId: string | null
  setActiveOptionsMessageId: (id: string | null) => void
}> = ({
  message,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onPin,
  isAdmin,
  onImageClick,
  isHighlighted,
  onDeleteMedia,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  activeReactionMessageId,
  setActiveReactionMessageId,
  activeOptionsMessageId,
  setActiveOptionsMessageId,
}) => {
  const [showQuickBar, setShowQuickBar] = useState(false)
  const [showFullPicker, setShowFullPicker] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showDeletedText, setShowDeletedText] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showOriginal, setShowOriginal] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  
  const swipeTranslationRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  React.useEffect(() => {
    if (activeReactionMessageId !== message.id) {
      setShowQuickBar(false)
      setShowFullPicker(false)
    }
  }, [activeReactionMessageId, message.id])

  React.useEffect(() => {
    if (activeOptionsMessageId !== message.id) {
      setShowOptions(false)
    }
  }, [activeOptionsMessageId, message.id])

  React.useEffect(() => {
    if (!showQuickBar && !showOptions) return
    const handleOuterClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (
        anchorRef.current &&
        !anchorRef.current.contains(target) &&
        !target.closest('.bubble-emoji') &&
        !target.closest('.emoji-picker-react') &&
        !target.closest('.w-36')
      ) {
        setShowQuickBar(false)
        setShowOptions(false)
        setActiveReactionMessageId(null)
        setActiveOptionsMessageId(null)
      }
    }
    document.addEventListener('mousedown', handleOuterClick)
    document.addEventListener('touchstart', handleOuterClick)
    return () => {
      document.removeEventListener('mousedown', handleOuterClick)
      document.removeEventListener('touchstart', handleOuterClick)
    }
  }, [showQuickBar, showOptions, setActiveReactionMessageId, setActiveOptionsMessageId])
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const isSwipingRef = useRef(false)
  const swipeThreshold = 60

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1 || isEditing || message.isDeleted) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    isSwipingRef.current = false

    isLongPressRef.current = false
    const target = e.currentTarget
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      setAnchorRect(target.getBoundingClientRect())
      setShowOptions(true)
      setActiveOptionsMessageId(message.id)
      setActiveReactionMessageId(null)
    }, 600)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isEditing || message.isDeleted) return
    const touch = e.touches[0]
    const diffX = touch.clientX - touchStartRef.current.x
    const diffY = touch.clientY - touchStartRef.current.y

    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      cancelLongPress()
    }

    if (!isSwipingRef.current) {
      const absX = Math.abs(diffX)
      const absY = Math.abs(diffY)
      if (absX > 10 && absX > absY) {
        isSwipingRef.current = true
      }
    }

    if (isSwipingRef.current) {
      if (e.cancelable) e.preventDefault()
      
      let translation = diffX
      if (isCustomer && translation > 0) translation = 0
      if (!isCustomer && translation < 0) translation = 0

      const maxSwipe = 80
      if (Math.abs(translation) > maxSwipe) {
        const sign = translation > 0 ? 1 : -1
        translation = sign * (maxSwipe + Math.log(Math.abs(translation) - (maxSwipe - 1)) * 5)
      }
      
      swipeTranslationRef.current = translation

      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(${translation}px)`
        containerRef.current.style.transition = 'none'
      }

      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = String(Math.min(1, Math.abs(translation) / swipeThreshold))
        indicatorRef.current.style.transform = `translateY(-50%) scale(${Math.min(1.2, 0.6 + (Math.abs(translation) / swipeThreshold) * 0.4)})`
        indicatorRef.current.style.color = Math.abs(translation) >= swipeThreshold ? '#10b981' : '#94a3b8'
      }
    }
  }

  const handleTouchEnd = () => {
    cancelLongPress()
    if (!touchStartRef.current) return
    if (isSwipingRef.current && Math.abs(swipeTranslationRef.current) >= swipeThreshold) {
      onReply()
      if (navigator.vibrate) {
        navigator.vibrate(15)
      }
    }
    swipeTranslationRef.current = 0
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(0px)`
      containerRef.current.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    }
    if (indicatorRef.current) {
      indicatorRef.current.style.opacity = '0'
      indicatorRef.current.style.transform = 'translateY(-50%) scale(0.6)'
      indicatorRef.current.style.color = '#94a3b8'
    }
    touchStartRef.current = null
    isSwipingRef.current = false
  }

  React.useEffect(() => {
    if (isEditing) {
      setEditText(message.text)
    }
  }, [isEditing, message.text])

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
    if (onCancelEdit) onCancelEdit()
  }

  const hasCard = !!(message.message_type || message.is_email) && message.message_type !== 'payment_code';

  return (
    <div
      className={clsx(
        'group relative mb-3 md:mb-8 flex cursor-default flex-col',
        isHighlighted && 'bg-pixs-mint/10',
        isCustomer ? 'items-end mr-2 min-[360px]:mr-3.5 min-[375px]:mr-3.5 min-[414px]:mr-3 sm:mr-0' : 'items-start',
      )}
    >
      <div
        className={clsx(
          'relative flex w-full min-w-0 max-w-[80%] min-[414px]:max-w-[85%] flex-col md:max-w-[70%] pr-8',
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

        {/* Swipe Reply Indicator */}
        <div
          ref={indicatorRef}
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-0",
            isCustomer ? "right-4" : "left-4"
          )}
          style={{
            opacity: 0,
            transform: `translateY(-50%) scale(0.6)`,
            color: '#94a3b8'
          }}
        >
          <CornerUpRight size={18} className={clsx(isCustomer ? "scale-x-[-1]" : "")} />
        </div>

        {/* Message Container */}
        <div
          ref={containerRef}
          onClick={(e) => {
            if (window.innerWidth < 768) {
              const target = e.target as HTMLElement;
              if (target.closest('button') || target.closest('a') || target.closest('textarea')) {
                return;
              }
              e.stopPropagation();
              if (isLongPressRef.current) {
                isLongPressRef.current = false;
                return;
              }
              setAnchorRect(e.currentTarget.getBoundingClientRect());
              const nextVal = !showQuickBar;
              setShowQuickBar(nextVal);
              if (nextVal) {
                setActiveReactionMessageId(message.id);
                setActiveOptionsMessageId(null);
              } else {
                setActiveReactionMessageId(null);
              }
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => {
            if (window.innerWidth < 768) {
              e.preventDefault();
            }
          }}
          style={{
            transform: `translateX(0px)`,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className={clsx(
            'relative max-w-full rounded-[14px] pr-5 min-[360px]:rounded-[16px] sm:rounded-[20px] md:rounded-[28px] text-[10px] min-[360px]:text-[11px] min-[414px]:text-[12px] sm:text-[13px] md:text-sm leading-relaxed font-bold shadow-sm break-words whitespace-pre-wrap select-none md:select-text z-10 cursor-pointer md:cursor-default',
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
                  onClick={onCancelEdit}
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
                isAdmin && showDeletedText ? (
                  <span className="text-rose-400 italic font-medium">
                    [Deleted message content: {message.text}]
                  </span>
                ) : (
                  <span>this message has been removed.</span>
                )
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

          {message.message_type === 'order' && message.type_id && !isEditing && !message.isDeleted && (
            <div className="mt-2 group-last:mb-0">
              <OrderConfirmMessage
                  messageId={message.id}
                  orderId={message.type_id}
                  isCustomer={isCustomer}
                  isConfirm={message.is_confirm}
                  productConcern={message.product_concern}
                  messageText={message.text}
                />
            </div>
          )}

          {message.message_type === 'expenditure' && message.type_id && !isEditing && !message.isDeleted && (
            <div className="mt-2 group-last:mb-0">
              <ExpenditureConfirmMessage expenditureId={message.type_id} isCustomer={isCustomer} />
            </div>
          )}

          {message.message_type === 'refund' && message.type_id && !isEditing && !message.isDeleted && (
            <div className="mt-2 group-last:mb-0">
              <RefundMessage refundId={message.type_id} isCustomer={isCustomer} />
            </div>
          )}

          {message.is_email && !isEditing && !message.isDeleted && (
            <div className="mt-2 group-last:mb-0">
              <EmailMessage messageText={message.text} created_at={message.timestamp} isCustomer={isCustomer} />
            </div>
          )}

          {message.message_type === 'payment_code' && message.type_id && !isEditing && !message.isDeleted && (() => {
            const paycodeString = message.payment_code || (() => {
              const match = message.text?.match(/PIXS-[A-Z0-9]{10}/i);
              return match ? match[0] : message.type_id;
            })();
            
            return (
              <div className={clsx(
                "mt-2.5 flex items-center gap-2 rounded-xl p-2.5 font-mono text-[11px] font-bold leading-none border-0 shadow-none",
                isCustomer ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800"
              )}>
                <span className={clsx("text-[9px] font-black uppercase tracking-wider select-none", isCustomer ? "text-pixs-mint" : "text-slate-500")}>
                  Code:
                </span>
                <span className="tracking-wider select-all">{paycodeString}</span>
                <button 
                  onClick={() => { 
                    navigator.clipboard.writeText(paycodeString!); 
                    toast.success('Payment code copied!'); 
                  }}
                  className={clsx(
                    "ml-auto flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 active:scale-95",
                    isCustomer ? "hover:bg-white/10 text-slate-300 hover:text-white" : "hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                  )}
                  title="Copy Code"
                >
                  <Copy size={12} />
                </button>
              </div>
            );
          })()}
          
          {(message.message_type && message.type_id && 
            !['order', 'payment_code', 'refund', 'expenditure'].includes(message.message_type)) && (
            <div className="mt-2">
              <MessageNotFound 
                  messageType={message.message_type}
                  typeId={message.type_id}
                  isCustomer={isCustomer}
                />
            </div>
          )}



          {message.product_concern && message.message_type !== 'refund' && !message.is_email && !message.text?.startsWith('[LIVE_QUEUE_COMPLETED]') && !message.text?.startsWith('[LIVE_QUEUE_NOT_COMPLETED]') && (
            <div className="mt-3 rounded-xl border p-4 break-words border-amber-200 bg-amber-50/50 text-amber-950">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="shrink-0 text-amber-500" />
                <span className="text-[10px] font-black tracking-widest uppercase text-amber-500">
                  PRODUCT CONCERN
                </span>
              </div>
              <p className="text-sm font-medium whitespace-pre-wrap">{message.text}</p>
              <p className="mt-2 text-xs opacity-60">Awaiting admin response</p>
            </div>
          )}

          {showOriginal && message.originalText && (
              <div
                className="mt-3 rounded-xl border-t border-white/10 bg-white/5 p-3 pt-3 text-[11px] leading-tight text-slate-400 italic blur-[0.4px] hover:blur-none break-words whitespace-pre-wrap"
              >
                <div className="mb-1.5 flex items-center gap-1.5 opacity-50">
                  <History size={10} />
                  <span className="text-[8px] font-black tracking-widest uppercase">
                    Original Node Projection
                  </span>
                </div>
                {message.originalText}
              </div>
            )}

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
          !message.isDeleted && (() => {
            const imageAttachments = message.attachments!.filter(a => a.type === 'image')
            const fileAttachments  = message.attachments!.filter(a => a.type !== 'image')
            const imageUrls = imageAttachments.map(a => getAssetUrl(a))

            return (
              <div
                className={clsx(
                  'mt-3 flex w-full flex-col gap-3',
                  isCustomer ? 'items-end' : 'items-start',
                )}
              >
                {/* Mosaic image grid */}
                {imageUrls.length > 0 && (
                  <div className={clsx('w-full max-w-full sm:max-w-[320px] md:max-w-[380px]')}>
                    <MessageImageGrid
                      images={imageUrls}
                      onImageClick={(idx) => {
                        onImageClick(imageUrls[idx])
                      }}
                      className="rounded-[20px] overflow-hidden"
                    />
                    {isAdmin && onDeleteMedia && imageAttachments.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 justify-end">
                        {imageAttachments.map((at, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (window.confirm('Delete this image permanently?')) {
                                onDeleteMedia(message.id, at.name)
                              }
                            }}
                            className="text-[8px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 transition"
                          >
                            ✕ img {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* File / document attachments — one-per-row */}
                {fileAttachments.map((at, idx) => (
                  <div key={idx} className="max-w-full relative flex items-center gap-2">
                    <a
                      href={getAssetUrl(at)}
                      download={at.name}
                      className={clsx(
                        'group/doc flex items-center gap-3 md:gap-4 rounded-[16px] md:rounded-[22px] border p-3 md:p-4 shadow-sm flex-1',
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
                    {isAdmin && onDeleteMedia && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          if (window.confirm('Delete this document permanently?')) {
                            onDeleteMedia(message.id, at.name)
                          }
                        }}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}



        {/* Reaction Display Node */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={clsx(
              'absolute -bottom-3 flex gap-1 z-[999]',
              isCustomer ? 'right-12' : 'left-4',
            )}
          >
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map(
              (emoji, i) => (
                <div
                  key={i}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2 py-1 shadow-sm hover:bg-slate-50"
                  onClick={() => onReact(emoji)}
                >
                  <span className="text-[14px] leading-none">{emoji}</span>
                  <span className="text-[9px] font-black text-slate-900">
                    {message.reactions?.filter((r) => r.emoji === emoji).length}
                  </span>
                </div>
              ),
            )}
          </div>
        )}

        {/* Advanced Action Terminal */}
        {((!message.isDeleted && !isEditing) || (message.isDeleted && isAdmin)) && (
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
                  const nextVal = !showQuickBar
                  setShowQuickBar(nextVal)
                  if (nextVal) {
                    setActiveReactionMessageId(message.id)
                    setActiveOptionsMessageId(null)
                  } else {
                    setActiveReactionMessageId(null)
                  }
                }}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-md hover:text-slate-900"
              >
                <Smile size={18} />
              </button>
 
              {showQuickBar && (
                  <>
                    <QuickReactBar
                      isCustomer={isCustomer}
                      anchorRect={anchorRect}
                      onSelect={(emoji) => {
                        onReact(emoji)
                        setShowQuickBar(false)
                        setActiveReactionMessageId(null)
                      }}
                      onShowMore={() => {
                        setShowQuickBar(false)
                        setShowFullPicker(true)
                      }}
                    />
                    <button
                      onClick={() => {
                        setShowQuickBar(false)
                        setActiveReactionMessageId(null)
                      }}
                      className="pointer-events-auto fixed inset-0 z-[9998] border-none bg-transparent outline-none"
                    />
                  </>
                )}
 
              {showFullPicker && (() => {
                const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375
                const isMobile = viewportWidth < 768

                if (isMobile) {
                  return (
                    <MessagePortal>
                      <div 
                        style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.5)', pointerEvents: 'auto' }}
                        onClick={() => {
                          setShowFullPicker(false)
                          setActiveReactionMessageId(null)
                        }}
                      >
                        <div 
                          style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            right: 0,
                            maxHeight: '70vh',
                            background: 'white',
                            borderTopLeftRadius: '16px',
                            borderTopRightRadius: '16px',
                            overflow: 'hidden'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EmojiPicker
                            onEmojiClick={(emoji: EmojiClickData) => {
                              onReact(emoji.emoji)
                              setShowFullPicker(false)
                              setActiveReactionMessageId(null)
                            }}
                            theme={Theme.LIGHT}
                            skinTonesDisabled
                            searchDisabled
                            width="100%"
                            height="70vh"
                          />
                        </div>
                      </div>
                    </MessagePortal>
                  )
                }

                if (!anchorRect) return null

                const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 667
                const pickerWidth = 320
                const pickerHeight = 380

                let top = anchorRect.top - pickerHeight - 10
                if (top < 10) {
                  top = anchorRect.bottom + 10
                }
                top = Math.max(10, Math.min(viewportHeight - pickerHeight - 10, top))

                let left = isCustomer ? anchorRect.right - pickerWidth : anchorRect.left
                left = Math.max(10, Math.min(viewportWidth - pickerWidth - 10, left))

                return (
                  <MessagePortal>
                    <div
                      style={{
                        position: 'fixed',
                        top,
                        left,
                        zIndex: 99999,
                        pointerEvents: 'auto',
                      }}
                    >
                      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-2xl bg-white">
                        <EmojiPicker
                          onEmojiClick={(emoji: EmojiClickData) => {
                            onReact(emoji.emoji)
                            setShowFullPicker(false)
                            setActiveReactionMessageId(null)
                          }}
                          theme={Theme.LIGHT}
                          skinTonesDisabled
                          searchDisabled
                          width={pickerWidth}
                          height={pickerHeight}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setShowFullPicker(false)
                          setActiveReactionMessageId(null)
                        }}
                        className="fixed inset-0 z-[-1] border-none bg-transparent outline-none"
                      />
                    </div>
                  </MessagePortal>
                )
              })()}
            </div>
 
            <div className="relative">
              <button
                onClick={(e) => {
                  setAnchorRect(e.currentTarget.getBoundingClientRect())
                  const nextVal = !showOptions
                  setShowOptions(nextVal)
                  if (nextVal) {
                    setActiveOptionsMessageId(message.id)
                    setActiveReactionMessageId(null)
                  } else {
                    setActiveOptionsMessageId(null)
                  }
                }}
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-md hover:text-slate-900"
              >
                <MoreHorizontal size={18} />
              </button>
 
              {showOptions && anchorRect && (() => {
                const getVisibleOptionsCount = () => {
                  if (message.isDeleted) {
                    return isAdmin ? 2 : 0;
                  }
                  let count = 1; // Reply
                  if (isCustomer && onStartEdit) count++;
                  if (isAdmin && onPin) count++;
                  if (isAdmin || isCustomer) count++;
                  if (isAdmin) count++;
                  return count;
                };
                const visibleCount = getVisibleOptionsCount();
                const estimatedHeight = visibleCount * 44 + 16;
 
                const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 667
                const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375
                const spaceBelow = viewportHeight - anchorRect.bottom
                
                let top = 0
                if (spaceBelow >= estimatedHeight + 20) {
                  top = anchorRect.bottom + 6
                } else {
                  top = anchorRect.top - estimatedHeight - 6
                }
                top = Math.max(10, Math.min(viewportHeight - estimatedHeight - 10, top))

                let left = isCustomer
                  ? anchorRect.right - 144
                  : anchorRect.left
                left = Math.max(10, Math.min(viewportWidth - 144 - 10, left))

                return (
                  <MessagePortal>
                    <div
                      style={{
                        position: 'fixed',
                        top,
                        left,
                        zIndex: 99999,
                        pointerEvents: 'auto',
                      }}
                      className={clsx(
                        'w-36 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl',
                        spaceBelow >= estimatedHeight + 20
                          ? (isCustomer ? 'origin-top-right' : 'origin-top-left')
                          : (isCustomer ? 'origin-bottom-right' : 'origin-bottom-left')
                      )}
                    >
                      {message.isDeleted ? (
                        <>
                          <button
                            onClick={() => {
                              setShowDeletedText(!showDeletedText)
                              setShowOptions(false)
                              setActiveOptionsMessageId(null)
                            }}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-slate-700 uppercase hover:bg-slate-50"
                          >
                            <History size={16} className="text-slate-400" />{' '}
                            {showDeletedText ? 'Hide Text' : 'View Text'}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Hard delete this message and all its files from the server?')) {
                                onDelete(true)
                              }
                              setShowOptions(false)
                              setActiveOptionsMessageId(null)
                            }}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-white bg-red-600 uppercase hover:bg-red-700"
                          >
                            <Trash2 size={16} className="text-white" /> Delete DB
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onReply()
                              setShowOptions(false)
                              setActiveOptionsMessageId(null)
                            }}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-slate-700 uppercase hover:bg-slate-50"
                          >
                            <CornerUpRight size={16} className="text-slate-400" />{' '}
                            Reply
                          </button>
                          {isCustomer && onStartEdit && (
                            <button
                              onClick={() => {
                                onStartEdit()
                                setShowOptions(false)
                                setActiveOptionsMessageId(null)
                              }}
                              className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-slate-700 uppercase hover:bg-slate-50"
                            >
                              <Edit2 size={16} className="text-slate-400" /> Edit
                            </button>
                          )}
                          {isAdmin && onPin && (
                            <button
                              onClick={() => {
                                onPin()
                                setShowOptions(false)
                                setActiveOptionsMessageId(null)
                              }}
                              className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-emerald-600 uppercase hover:bg-emerald-50"
                            >
                              <Pin size={16} className="text-emerald-500" /> {message.is_pinned ? 'Unpin' : 'Pin'}
                            </button>
                          )}
                          {(isAdmin || isCustomer) && (
                            <button
                              onClick={() => {
                                onDelete()
                                setShowOptions(false)
                                setActiveOptionsMessageId(null)
                              }}
                              className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-rose-500 uppercase hover:bg-rose-50"
                            >
                              <Trash2 size={16} className="text-rose-400" /> Delete
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm('Hard delete this message and all its files from the server?')) {
                                  onDelete(true)
                                }
                                setShowOptions(false)
                                setActiveOptionsMessageId(null)
                              }}
                              className="flex w-full items-center gap-3 rounded-xl p-3 text-[10px] font-black tracking-widest text-white bg-red-600 uppercase hover:bg-red-700"
                            >
                              <Trash2 size={16} className="text-white" /> Delete DB
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => {
                          setShowOptions(false)
                          setActiveOptionsMessageId(null)
                        }}
                        className="fixed inset-0 z-[-1] border-none bg-transparent outline-none"
                      />
                    </div>
                  </MessagePortal>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const MessageBubble = React.memo(MessageBubbleComponent, (prevProps, nextProps) => {
  return (
    prevProps.message === nextProps.message &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.activeReactionMessageId === nextProps.activeReactionMessageId &&
    prevProps.activeOptionsMessageId === nextProps.activeOptionsMessageId
  )
})





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
  scrollToMessageId,
  onDeleteMedia,
  onShowScrollDownChange,
  onHasUnreadNewMessagesChange,
  scrollToBottomRef,
}) => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null)
  const [activeOptionsMessageId, setActiveOptionsMessageId] = useState<string | null>(null)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const isScrollLockedRef = useRef(false)
  const [isNearBottom, setIsNearBottom] = useState(true)

  // Notify parent of scroll state changes
  const setShowScrollDown = useCallback((show: boolean) => {
    onShowScrollDownChange?.(show)
  }, [onShowScrollDownChange])

  const setHasUnreadNewMessages = useCallback((hasUnread: boolean) => {
    onHasUnreadNewMessagesChange?.(hasUnread)
  }, [onHasUnreadNewMessagesChange])

  // Expose scroll to bottom action to parent
  useEffect(() => {
    if (scrollToBottomRef) {
      scrollToBottomRef.current = () => {
        virtuosoRef.current?.scrollTo({ top: 9999999, behavior: 'smooth' })
        setHasUnreadNewMessages(false)
        setIsNearBottom(true)
        setShowScrollDown(false)
      }
    }
    return () => {
      if (scrollToBottomRef) {
        scrollToBottomRef.current = null
      }
    }
  }, [scrollToBottomRef, setShowScrollDown, setHasUnreadNewMessages])

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [activeImage, setActiveImage] = useState('')

  const handleImageClick = (url: string) => {
    setActiveImage(url)
    setGalleryOpen(true)
  }

  // Scroll to a specific message by ID (triggered by AdminControlModal pin/search)
  useEffect(() => {
    if (!scrollToMessageId || !virtuosoRef.current) return
    const idx = messages.findIndex(m => m.id === scrollToMessageId)
    if (idx === -1) return
    virtuosoRef.current.scrollToIndex({
      index: idx,
      behavior: 'smooth',
      align: 'center',
    })
  }, [scrollToMessageId, messages])

  // Auto-scroll to bottom on new messages
  const prevMessagesLength = useRef(messages.length)
  const prevLastMessageId = useRef<string | null>(messages.length > 0 ? messages[messages.length - 1].id : null)
  useEffect(() => {
    const currentLength = messages.length
    const currentLastMessageId = currentLength > 0 ? messages[currentLength - 1].id : null

    if (currentLength > prevMessagesLength.current && currentLastMessageId !== prevLastMessageId.current) {
      if (isScrollLockedRef.current) return

      const isMyMessage = currentLength > 0 && messages[currentLength - 1].senderName === 'You'

      if ((isNearBottom || isMyMessage) && virtuosoRef.current) {
        setTimeout(() => {
          virtuosoRef.current?.scrollTo({
            top: 9999999,
            behavior: 'smooth',
          })
          setIsNearBottom(true)
        }, 100)
      } else if (!isNearBottom && !isMyMessage) {
        setTimeout(() => {
          setHasUnreadNewMessages(true)
          setShowScrollDown(true)
        }, 0)
      }
    }

    prevMessagesLength.current = currentLength
    prevLastMessageId.current = currentLastMessageId
  }, [messages, isNearBottom, setShowScrollDown, setHasUnreadNewMessages])

  return (
    <div className="relative w-full h-full overflow-x-hidden flex flex-col">
      {isLoading ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 py-20 text-slate-400 bg-emoji-pattern bg-slate-50/20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
          <p className="text-xs font-black uppercase tracking-widest">Loading Conversation...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center py-20 text-center opacity-60 transition-opacity hover:opacity-100 bg-emoji-pattern bg-slate-50/20">
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
          ref={virtuosoRef}
          className="MessageList no-scrollbar overflow-x-hidden bg-emoji-pattern flex-1 bg-slate-50/20 px-6 pt-8 pb-24 md:px-12 md:pt-12 md:pb-28"
          data={messages}
          computeItemKey={(_, item) => item.id}
          followOutput="auto"
          initialTopMostItemIndex={messages.length - 1}
          increaseViewportBy={400}
          style={{
            height: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
          isScrolling={(scrolling) => {
            isScrollLockedRef.current = scrolling
          }}
          atBottomStateChange={(atBottom) => {
            setTimeout(() => {
              setIsNearBottom(atBottom)
              if (atBottom) {
                setShowScrollDown(false)
                setHasUnreadNewMessages(false)
              } else {
                setShowScrollDown(true)
              }
            }, 50)
          }}
          startReached={() => {
            if (onLoadMore && !isLoadingMore) {
              onLoadMore()
            }
          }}
          itemContent={(_, msg) => (
            <div className="mx-auto max-w-4xl">
              <MessageBubble
                key={msg.id}
                message={msg}
                onReact={(emoji) => onReact(msg.id, emoji)}
                onReply={() => {
                  setEditingMessageId(null)
                  onReply(msg)
                }}
                onEdit={(text) => onEdit(msg.id, text)}
                onDelete={(isHard) => onDelete(msg.id, isHard)}
                onPin={onPin ? () => onPin(msg.id) : undefined}
                isAdmin={isAdmin}
                onImageClick={handleImageClick}
                onDeleteMedia={onDeleteMedia}
                isEditing={editingMessageId === msg.id}
                onStartEdit={() => setEditingMessageId(msg.id)}
                onCancelEdit={() => setEditingMessageId(null)}
                activeReactionMessageId={activeReactionMessageId}
                setActiveReactionMessageId={setActiveReactionMessageId}
                activeOptionsMessageId={activeOptionsMessageId}
                setActiveOptionsMessageId={setActiveOptionsMessageId}
              />
            </div>
          )}
          components={{
            Header: () => isLoadingMore ? (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-md">
                  <div className="h-4 w-4 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-slate-800" />
                  <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-500">
                    Loading messages
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-4" />
            ),
            Footer: () => <div className="h-24 md:h-32" />,
          }}
        />
      )}

      <MessagePortal>
        <FullscreenGalleryModal
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          images={[activeImage]}
          productName="Production Assets"
        />
      </MessagePortal>
    </div>
  )
}

export default MessageList