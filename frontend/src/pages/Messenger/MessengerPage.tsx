import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Search, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import BoxFallback from '../../components/common/BoxFallback'
import { format } from 'date-fns'

// Local Components
import HeroSection from './components/HeroSection.tsx'
import ChatHeader from './components/ChatHeader.tsx'
import MessageList from './components/MessageList.tsx'
import MessageInput from './components/MessageInput.tsx'
import GalleryView from './components/GalleryView.tsx'
import AdminControlModal from './components/AdminControlModal.tsx'

import axiosInstance from '../../lib/axiosInstance.ts'


interface UserData {
  id: string
  name: string
  email: string
  account_type: 'employee' | 'customer'
  profile_picture?: string
  status?: 'online' | 'offline'
}

export interface IMessage {
  id: string
  sender: 'customer' | 'admin'
  senderName: string
  text: string
  timestamp: string
  attachments?: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[]
  reactions?: { user: string; emoji: string }[]
  isEdited?: boolean
  originalText?: string
  isDeleted?: boolean
  replyTo?: { id: string; text: string; senderName: string; isDeleted?: boolean }
  senderId?: string
  receiverId?: string
  order_id?: string
  screenplate_request_id?: string
  is_confirm?: number
  payment_code_id?: string
  is_pinned?: string | null
  refund_id?: string
  expenditures_id?: string
  an_email?: boolean
  product_concern?: boolean
}

interface ApiMessage {
  id: string;
  sender_type: 'customer' | 'employee';
  message: string;
  created_at: string;
  sender_id?: string;
  receiver_id?: string;
  attachments?: { type: 'image' | 'file'; url: string; name: string }[];
  reactions?: { user: string; emoji: string; user_type?: string }[];
  reply_to_id?: string;
  is_deleted?: number;
  reply_to?: {
    id: string;
    text: string;
    sender_type: 'customer' | 'employee';
    sender_id: string;
    is_deleted?: number;
  } | null;
  order_id?: string
  screenplate_request_id?: string
  is_confirm?: number
  payment_code_id?: string
  is_pinned?: string | null
  refund_id?: string
  expenditures_id?: string
  an_email?: number | boolean
  product_concern?: number | boolean
}

const SidebarUserAvatar: React.FC<{
  src?: string | null
  name: string
  size?: string
}> = ({ src, name, size = 'h-10 w-10' }) => {
  const [error, setError] = useState(false)

  const displaySrc =
    src && !error
      ? src.startsWith('http') ||
        src.startsWith('blob:') ||
        src.startsWith('data:')
        ? src
        : `/src/assets/profile/${src}`
      : null

  if (!displaySrc) {
    return (
      <BoxFallback
        className={`${size} shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-800`}
        iconClassName="h-6 w-6 brightness-0 invert opacity-30"
      />
    )
  }

  return (
    <img
      src={displaySrc}
      alt={name}
      onError={() => setError(true)}
      className={`${size} shrink-0 rounded-2xl border-2 border-white bg-slate-100 object-cover shadow-sm ring-1 ring-slate-100`}
    />
  )
}

const MessengerPage: React.FC = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'customer'>('all')

  const selectedUser = users.find(u => u.id === selectedUserId)

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/api/messages/users')
      setUsers(res.data.data)
    } catch (error) {
      console.error('Failed to fetch users', error)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!u || u.id === user?.id) return false
    const nameMatch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const roleMatch = roleFilter === 'all' || u.account_type === roleFilter
    return nameMatch && roleMatch
  })

  const [messages, setMessages] = useState<IMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [imageUploadCount, setImageUploadCount] = useState(0)

  const fetchImageCount = async () => {
    try {
      const res = await axiosInstance.get('/api/messages/image-count')
      setImageUploadCount(res.data.count)
    } catch (error) {
      console.error('Failed to fetch image count', error)
    }
  }

  const fetchMessages = async (cursor?: string) => {
    try {
      const endpoint = '/api/messages'
      const limit = cursor ? '30' : '10'
      const params = new URLSearchParams({ per_page: limit })
      if (cursor) params.append('cursor', cursor)
      
      if (user?.role === 'admin' && selectedUserId) {
        params.append('target_id', selectedUserId)
      } else if (user?.role === 'admin' && !selectedUserId) {
        return { formatted: [], nextCursor: null }
      }

      const res = await axiosInstance.get(`${endpoint}?${params.toString()}`)
      const formatted = res.data.data.map((m: ApiMessage) => {
        const isMine = String(m.sender_id) === String(user?.id)
        
        let replyTo = undefined;
        if (m.reply_to) {
          const replyIsMine = String(m.reply_to.sender_id) === String(user?.id);
          replyTo = {
            id: m.reply_to.id,
            text: m.reply_to.text,
            senderName: replyIsMine ? 'You' : (m.reply_to.sender_type === 'employee' ? 'PIXS Admin' : 'Customer'),
            isDeleted: m.reply_to.is_deleted === 1,
          };
        }

        return {
          id: m.id,
          sender: isMine ? 'customer' : 'admin', 
          senderName: isMine ? 'You' : (m.sender_type === 'employee' ? 'PIXS Admin' : 'Customer'),
          text: m.message,
          timestamp: m.created_at,
          attachments: m.attachments ? m.attachments.map((a: { type: 'image' | 'file', url: string, name: string }) => ({ type: a.type, url: a.url, name: a.name })) : [],
          reactions: m.reactions ? m.reactions.map((r: { user: string, emoji: string }) => ({ user: r.user, emoji: r.emoji })) : [],
          replyTo,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          order_id: m.order_id,
          screenplate_request_id: m.screenplate_request_id,
          is_confirm: m.is_confirm,
          payment_code_id: m.payment_code_id,
          is_pinned: m.is_pinned,
          isDeleted: m.is_deleted === 1,
          refund_id: m.refund_id,
          expenditures_id: m.expenditures_id,
          an_email: Boolean(m.an_email),
          product_concern: Boolean(m.product_concern)
        }
      })
      
      return { formatted, nextCursor: res.data.next_cursor }
    } catch (error) {
      console.error('Failed to load messages', error)
      return { formatted: [], nextCursor: null }
    }
  }

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return
    setIsLoadingMore(true)
    const cursor = messages[0]?.id
    const { formatted: olderMessages, nextCursor } = await fetchMessages(cursor)
    
    if (olderMessages.length > 0) {
      setMessages(prev => [...olderMessages, ...prev])
      setHasMoreMessages(nextCursor !== null)
    } else {
      setHasMoreMessages(false)
    }
    setIsLoadingMore(false)
  }

  useEffect(() => {
    const initializeMessages = async () => {
      if (user && user.id) {
        setIsLoading(true)
        if (user.role === 'admin' && !selectedUserId) {
           setMessages([])
           setIsLoading(false)
        } else {
           const { formatted, nextCursor } = await fetchMessages()
           setMessages(formatted)
           setHasMoreMessages(nextCursor !== null)
           setIsLoading(false)
        }
        if (user.role === 'admin') fetchUsers()
        fetchImageCount()
      } else {
        setIsLoading(false)
      }
    }
    initializeMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedUserId])

  const [isHeroVisible, setIsHeroVisible] = useState(() => {
    return localStorage.getItem('pixs_messenger_hero_seen') !== 'true'
  })

  const handleStartHero = () => {
    localStorage.setItem('pixs_messenger_hero_seen', 'true')
    setIsHeroVisible(false)
  }

  // Initialize panels
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isAccountsOpen, setIsAccountsOpen] = useState(window.innerWidth >= 1024)
  const [isAdminControlsOpen, setIsAdminControlsOpen] = useState(false)
  const [activeReplyTo, setActiveReplyTo] = useState<IMessage | null>(null)

  // Auto-manage panel visibility based on terminal viewport
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth >= 1024) {
        setIsAccountsOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleToggleGallery = () => {
    setIsGalleryOpen(!isGalleryOpen)
    if (!isGalleryOpen) {
      setIsAccountsOpen(false)
    }
  }

  const handleToggleAccounts = () => {
    setIsAccountsOpen(!isAccountsOpen)
    if (!isAccountsOpen) {
      setIsGalleryOpen(false)
    }
  }

  const isSmallMobile = windowWidth <= 430

  // Persistence Protocol
  useEffect(() => {
    localStorage.setItem('pixs_messenger_v1', JSON.stringify(messages))
  }, [messages])

  const handleSendMessage = async (
    text: string,
    attachments: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[] = [],
    payment_code_id?: string
  ) => {
    const tempId = `msg_${Date.now()}`
    const newMessage: IMessage = {
      id: tempId,
      sender: 'customer',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
      attachments: attachments.map(a => ({ type: a.type, url: a.url, name: a.name })),
      reactions: [],
      payment_code_id,
      replyTo: activeReplyTo
        ? {
            id: activeReplyTo.id,
            text: activeReplyTo.text,
            senderName: activeReplyTo.senderName,
          }
        : undefined,
      senderId: user.id,
    }
    setMessages((prev) => [...prev, newMessage])
    setActiveReplyTo(null)

    try {
      const formData = new FormData()
      formData.append('message', text)
      
      const receiverId = user.role === 'admin' 
        ? (selectedUserId || activeReplyTo?.senderId || '1') 
        : '1';
      const receiverType = user.role === 'admin'
        ? (users.find(u => u.id === selectedUserId)?.account_type || 'customer')
        : 'employee';

      formData.append('receiver_id', receiverId)
      formData.append('receiver_type', receiverType)
      if (newMessage.replyTo) {
        formData.append('reply_to_id', newMessage.replyTo.id)
      }
      if (payment_code_id) {
        formData.append('payment_code_id', payment_code_id)
      }

      attachments.forEach((att, index) => {
        formData.append(`attachments[${index}][name]`, att.name)
        formData.append(`attachments[${index}][type]`, att.type)
        formData.append(`attachments[${index}][url]`, att.url)
        if (att.fileObj) {
          formData.append(`attachments[${index}][file]`, att.fileObj)
        }
      })

      interface SendResponse {
        data: {
          id: string;
          attachments?: { type: 'image' | 'file'; url: string; name: string }[];
        };
      }

      const res = await axiosInstance.post<SendResponse>('/api/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const realId = res.data.data.id
      const realAttachments = res.data.data.attachments || []

      // Sync local optimistic message state with the database ID and generated attachment names
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === tempId) {
            return {
              ...msg,
              id: realId,
              attachments: realAttachments,
            }
          }
          return msg
        })
      )

      // Refresh image count after successful send if attachments contained images
      if (attachments.some(a => a.type === 'image')) {
        fetchImageCount()
      }
    } catch (error) {
      console.error('Message failed to send', error)
    }
  }

  const handleDeleteConversation = async (targetId: string) => {
    try {
      await axiosInstance.delete(`/api/messages/conversation/${targetId}`)
      setMessages([])
    } catch (error) {
      console.error('Failed to delete conversation', error)
    }
  }

  const handleEditMessage = async (id: string, newText: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === id) {
          return {
            ...msg,
            text: newText,
            isEdited: true,
            originalText: msg.originalText || msg.text,
          }
        }
        return msg
      }),
    )
    try {
      await axiosInstance.put(`/api/messages/${id}`, { message: newText })
    } catch (error) {
      console.error('Failed to edit message', error)
    }
  }

  const handleDeleteMessage = async (id: string, isHardDelete?: boolean) => {
    if (isHardDelete) {
      setMessages((prev) => prev.filter((msg) => msg.id !== id))
    } else {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === id) {
            return {
              ...msg,
              isDeleted: true,
              attachments: [],
            }
          }
          return msg
        }),
      )
    }
    try {
      await axiosInstance.delete(`/api/messages/${id}${isHardDelete ? '?hard=true' : ''}`)
    } catch (error) {
      console.error('Failed to delete message', error)
    }
  }

  const handlePinMessage = async (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === id) {
          return {
            ...msg,
            is_pinned: msg.is_pinned ? null : new Date().toISOString(),
          }
        }
        return msg
      }),
    )
    try {
      await axiosInstance.patch(`/api/messages/${id}/pin`)
    } catch (error) {
      console.error('Failed to pin message', error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || []
          // Check if this specific user already reacted
          const existingIdx = reactions.findIndex((r) => String(r.user) === String(user.id))
          if (existingIdx > -1) {
            const existingReact = reactions[existingIdx]
            if (existingReact.emoji === emoji) {
              // Same emoji: toggle off (remove)
              return {
                ...msg,
                reactions: reactions.filter((r) => String(r.user) !== String(user.id))
              }
            } else {
              // Different emoji: update
              const newReactions = [...reactions]
              newReactions[existingIdx] = { user: user.id, emoji }
              return { ...msg, reactions: newReactions }
            }
          }
          // No reaction: add new one
          return {
            ...msg,
            reactions: [...reactions, { user: user.id, emoji }]
          }
        }
        return msg
      }),
    )

    try {
      await axiosInstance.post(`/api/messages/${messageId}/react`, { emoji })
    } catch (error) {
      console.error('Failed to persist reaction in backend', error)
    }
  }

  const handleDeleteMediaAttachment = async (messageId: string, filename: string) => {
    try {
      await axiosInstance.delete(`/api/messages/${messageId}/attachments/${filename}`)
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              attachments: (msg.attachments || []).filter((at) => at.name !== filename),
            }
          }
          return msg
        })
      )
      fetchImageCount()
    } catch (error) {
      console.error('Failed to delete media attachment', error)
    }
  }

  return (
    <div className="MessengerTerminal relative flex h-screen max-h-screen overflow-hidden flex-col bg-slate-50">
      {user?.role === 'admin' ? (
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          {/* Header Fixed Logic */}
          <div className="fixed top-0 left-0 z-40 w-full">
            <ChatHeader
              onToggleGallery={handleToggleGallery}
              isGalleryOpen={isGalleryOpen}
              onToggleAccounts={handleToggleAccounts}
              isAccountsOpen={isAccountsOpen}
              onOpenAdminControls={() => setIsAdminControlsOpen(true)}
              title={selectedUser?.name}
              subtitle={messages.length > 0 ? `Response: ${format(new Date(messages[messages.length - 1].timestamp), 'HH:mm')}` : 'No messages'}
            />
          </div>

          <main className="relative flex flex-1 overflow-hidden pt-[80px] pb-[116px]">
            {selectedUserId ? (
              <div className="flex flex-1 flex-col px-0.5 min-[360px]:px-1 min-[414px]:px-1 sm:px-0">
                <MessageList 
                  messages={messages} 
                  onReact={handleReaction} 
                  onReply={setActiveReplyTo} 
                  onEdit={handleEditMessage} 
                  onDelete={handleDeleteMessage} 
                  onPin={handlePinMessage}
                  isAdmin={(user?.role as string) === 'admin'}
                  isLoading={isLoading} 
                  onLoadMore={loadMoreMessages}
                  isLoadingMore={isLoadingMore}
                  onDeleteMedia={handleDeleteMediaAttachment}
                />
              </div>
            ) : (
              <div className="flex h-[calc(100vh-80px)] flex-col items-center justify-center p-12 text-center text-slate-400 w-full mt-[80px]">
                <div className="mb-6 h-24 w-24 rounded-3xl bg-slate-100 flex items-center justify-center shadow-inner">
                  <UserIcon size={40} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-black uppercase italic text-slate-800">Select a User</h2>
                <p className="mt-2 max-w-xs text-[10px] font-bold tracking-widest uppercase text-slate-400">Choose a user from the panel to view their messages.</p>
              </div>
            )}
            
            {/* Gallery Node for Desktop */}
            <AnimatePresence mode="popLayout">
              {isGalleryOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '33.33%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="fixed top-[80px] right-0 bottom-0 z-30 hidden border-l border-slate-100 bg-white lg:block h-[calc(100vh-80px)] shadow-2xl"
                >
                  <GalleryView
                    messages={messages}
                    onClose={() => setIsGalleryOpen(false)}
                    onDeleteMedia={handleDeleteMediaAttachment}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accounts Panel for Desktop */}
            <AnimatePresence mode="popLayout">
              {isAccountsOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '360px', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="fixed top-[80px] right-0 bottom-0 z-30 hidden border-l border-slate-200 bg-white lg:flex flex-col h-[calc(100vh-80px)] shadow-2xl"
                >
                  <div className="p-6 space-y-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase italic text-slate-900">Admin Control</h3>
                      <button
                        onClick={() => setIsAccountsOpen(false)}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-950"
                      >
                        Close
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search Users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'employee', 'customer'].map((role) => (
                        <button
                          key={role}
                          onClick={() => setRoleFilter(role as 'all' | 'employee' | 'customer')}
                          className={clsx(
                            'rounded-lg px-2.5 py-1 text-[9px] font-black uppercase transition-all',
                            roleFilter === role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-2xl p-3 transition-all mb-2',
                          selectedUserId === u.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-900'
                        )}
                      >
                        <SidebarUserAvatar src={u.profile_picture} name={u.name} />
                        <div className="text-left flex-1 min-w-0">
                          <p className="truncate text-xs font-black uppercase leading-tight">{u.name}</p>
                          <p className={clsx("text-[8px] font-black uppercase tracking-widest", selectedUserId === u.id ? 'text-slate-300' : 'text-slate-400')}>{u.account_type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* MessageInput Fixed Logic */}
          {selectedUserId && (
            <div className="fixed bottom-0 left-0 z-40 w-full bg-white">
              <MessageInput onSend={handleSendMessage} activeReplyTo={activeReplyTo} onCancelReply={() => setActiveReplyTo(null)} totalImageUploads={imageUploadCount} isEmployee={true} />
            </div>
          )}
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {isHeroVisible ? (
          <div className="flex flex-1 flex-col pt-20">
            <div className="fixed top-0 left-0 z-40 w-full md:top-20">
              <ChatHeader
                onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
                isGalleryOpen={isGalleryOpen}
                subtitle={messages.length > 0 ? `Response: ${format(new Date(messages[messages.length - 1].timestamp), 'HH:mm')}` : 'Response: ~5m'}
              />
            </div>
            <main className="flex flex-1 items-center justify-center p-6 pt-32 md:pt-40">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
                  <p className="text-xs font-black uppercase tracking-widest">
                    Waking up terminal...
                  </p>
                </div>
              ) : (
                <HeroSection onStart={handleStartHero} />
              )}
            </main>
          </div>
        ) : (
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            {/* Header Fixed Logic */}
            <div className="fixed top-0 left-0 z-40 w-full md:top-20">
              <ChatHeader
                onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
                isGalleryOpen={isGalleryOpen}
                subtitle={messages.length > 0 ? `Response: ${format(new Date(messages[messages.length - 1].timestamp), 'HH:mm')}` : 'Response: ~5m'}
              />
            </div>

            <main className="relative flex flex-1 overflow-hidden pt-[80px] pb-[196px] md:pt-[176px] md:pb-[116px]">
              <div className="flex flex-1 flex-col px-0.5 min-[360px]:px-1 min-[414px]:px-1 sm:px-0">
                <MessageList
                  messages={messages}
                  onReact={handleReaction}
                  onReply={setActiveReplyTo}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onPin={handlePinMessage}
                  isAdmin={(user?.role as string) === 'admin'}
                  isLoading={isLoading}
                  onLoadMore={loadMoreMessages}
                  isLoadingMore={isLoadingMore}
                  onDeleteMedia={undefined}
                />
              </div>

              {/* Gallery Node for Desktop */}
              <AnimatePresence mode="popLayout">
                {isGalleryOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '33.33%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="fixed top-[176px] right-0 bottom-[116px] z-30 hidden border-l border-slate-100 bg-white lg:block"
                  >
                    <GalleryView
                      messages={messages}
                      onClose={() => setIsGalleryOpen(false)}
                      onDeleteMedia={undefined}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* MessageInput Fixed Logic */}
            <div className="fixed bottom-0 left-0 z-40 w-full bg-white pb-20 md:pb-0">
              <MessageInput
                onSend={handleSendMessage}
                activeReplyTo={activeReplyTo}
                onCancelReply={() => setActiveReplyTo(null)}
                totalImageUploads={imageUploadCount}
                isEmployee={user?.account_type === 'employee'}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
      )}

      {/* Gallery Modal for Mobile */}
      <AnimatePresence>
        {isGalleryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
            {!isSmallMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsGalleryOpen(false)}
              />
            )}
            <motion.div
              initial={
                isSmallMobile
                  ? { y: '100%' }
                  : { opacity: 0, scale: 0.9, y: 20 }
              }
              animate={
                isSmallMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                isSmallMobile
                  ? { y: '100%' }
                  : { opacity: 0, scale: 0.9, y: 20 }
              }
              className={clsx(
                'relative bg-white shadow-2xl transition-all duration-300',
                isSmallMobile
                  ? 'fixed inset-0 h-full w-full'
                  : 'h-[85vh] w-[90%] max-w-[440px] overflow-hidden rounded-[32px]',
              )}
            >
              <GalleryView
                messages={messages}
                onClose={() => setIsGalleryOpen(false)}
                isMobile
                onDeleteMedia={user?.role === 'admin' ? handleDeleteMediaAttachment : undefined}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accounts Modal for Mobile */}
      <AnimatePresence>
        {isAccountsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
            {!isSmallMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsAccountsOpen(false)}
              />
            )}
            <motion.div
              initial={
                isSmallMobile
                  ? { y: '100%' }
                  : { opacity: 0, scale: 0.9, y: 20 }
              }
              animate={
                isSmallMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                isSmallMobile
                  ? { y: '100%' }
                  : { opacity: 0, scale: 0.9, y: 20 }
              }
              className={clsx(
                'relative bg-white shadow-2xl transition-all duration-300 flex flex-col',
                isSmallMobile
                  ? 'fixed inset-0 h-full w-full'
                  : 'h-[85vh] w-[90%] max-w-[440px] overflow-hidden rounded-[32px]',
              )}
            >
              <div className="p-6 space-y-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase italic text-slate-900">Admin Control</h3>
                  <button
                    onClick={() => setIsAccountsOpen(false)}
                    className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-950"
                  >
                    Close
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search Users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'employee', 'customer'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role as 'all' | 'employee' | 'customer')}
                      className={clsx(
                        'rounded-lg px-2.5 py-1 text-[9px] font-black uppercase transition-all',
                        roleFilter === role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setIsAccountsOpen(false);
                    }}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-2xl p-3 transition-all mb-2',
                      selectedUserId === u.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-900'
                    )}
                  >
                    <SidebarUserAvatar src={u.profile_picture} name={u.name} />
                    <div className="text-left flex-1 min-w-0">
                      <p className="truncate text-xs font-black uppercase leading-tight">{u.name}</p>
                      <p className={clsx("text-[8px] font-black uppercase tracking-widest", selectedUserId === u.id ? 'text-slate-300' : 'text-slate-400')}>{u.account_type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div
        id="messenger-portal-root"
        className="pointer-events-none fixed inset-0 z-[10000]"
      />

      <AdminControlModal
        isOpen={isAdminControlsOpen}
        onClose={() => setIsAdminControlsOpen(false)}
        messages={messages}
        targetUser={users.find(u => u.id === selectedUserId)}
        onDeleteConversation={handleDeleteConversation}
        onSendMessage={handleSendMessage}
        onToggleGallery={() => {
          setIsGalleryOpen(true)
          setIsAccountsOpen(false)
        }}
      />
    </div>
  )
}

export default MessengerPage
