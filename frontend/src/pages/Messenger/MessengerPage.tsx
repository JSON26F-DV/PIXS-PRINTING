import React, { useState, useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { Search, User as UserIcon, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import BoxFallback from '../../components/common/BoxFallback'
import debounce from 'lodash/debounce'
import { format } from 'date-fns'

// Local Components
import HeroSection from './components/HeroSection.tsx'
import ChatHeader from './components/ChatHeader.tsx'
import MessageList from './components/MessageList.tsx'
import MessageInput from './components/MessageInput.tsx'
import GalleryView from './components/GalleryView.tsx'
import AdminControlModal from './components/AdminControlModal.tsx'

import axiosInstance from '../../lib/axiosInstance.ts'
import { STORAGE_KEYS } from '../../constants/storageKeys'

interface UserData {
  id: string
  name: string
  email: string
  account_type: 'employee' | 'customer'
  profile_picture?: string
  status?: 'online' | 'offline'
  unread_count?: number
  contact_numbers?: string
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
  message_type?: string | null
  type_id?: string | null
  is_confirm?: number
  is_pinned?: string | null
  is_email?: boolean
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
  message_type?: string | null
  type_id?: string | null
  is_confirm?: number
  is_pinned?: string | null
  is_email?: number | boolean
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_USER_ID)
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'customer'>('all')

  const selectedUser = users.find(u => u.id === selectedUserId)

  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_USER_ID, selectedUserId)
    }
  }, [selectedUserId])

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

  const formatMessage = (m: ApiMessage): IMessage => {
    const isMine = String(m.sender_id) === String(user?.id)
    let replyTo = undefined
    if (m.reply_to) {
      const replyIsMine = String(m.reply_to.sender_id) === String(user?.id)
      replyTo = {
        id: m.reply_to.id,
        text: m.reply_to.text,
        senderName: replyIsMine ? 'You' : (m.reply_to.sender_type === 'employee' ? 'PIXS Admin' : 'Customer'),
        isDeleted: m.reply_to.is_deleted === 1,
      }
    }
    return {
      id: m.id,
      sender: isMine ? 'customer' : 'admin',
      senderName: isMine ? 'You' : (m.sender_type === 'employee' ? 'PIXS Admin' : 'Customer'),
      text: m.message,
      timestamp: m.created_at,
      attachments: m.attachments ? m.attachments.map((a) => ({ type: a.type, url: a.url, name: a.name })) : [],
      reactions: m.reactions ? m.reactions.map((r) => ({ user: r.user, emoji: r.emoji })) : [],
      replyTo,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      message_type: m.message_type,
      type_id: m.type_id,
      is_confirm: m.is_confirm,
      is_pinned: m.is_pinned,
      isDeleted: m.is_deleted === 1,
      is_email: Boolean(m.is_email),
      product_concern: Boolean(m.product_concern)
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
      const formatted = res.data.data.map((m: ApiMessage) => formatMessage(m))
      
      return { formatted, nextCursor: res.data.next_cursor }
    } catch (error) {
      console.error('Failed to load messages', error)
      return { formatted: [], nextCursor: null }
    }
  }

  const markMessagesAsRead = async () => {
    try {
      // Mark all messages in current conversation as read
      await axiosInstance.patch('/api/messages/mark-read', {
        target_id: selectedUserId || (user?.role !== 'admin' ? '1' : undefined),
      })
      // Refresh users list to update unread counts
      if (user?.role === 'admin') {
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to mark messages as read', error)
    }
  }

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return
    setIsLoadingMore(true)
    const cursor = messages[0]?.id
    const { formatted: olderMessages, nextCursor } = await fetchMessages(cursor)
    
    if (olderMessages.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const uniqueOlder = olderMessages.filter((m: IMessage) => !existingIds.has(m.id))
        return [...uniqueOlder, ...prev]
      })
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
        const promises: Promise<unknown>[] = []

        if (user.role === 'admin' && !selectedUserId) {
          setMessages([])
        } else {
          promises.push(
            fetchMessages().then(({ formatted, nextCursor }) => {
              setMessages(formatted)
              setHasMoreMessages(nextCursor !== null)
            }),
          )
        }

        if (user.role === 'admin') {
          promises.push(fetchUsers())
        }

        promises.push(fetchImageCount())

        await Promise.all(promises)
        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    }
    initializeMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedUserId])

  // POLLING: Fetch new messages periodically
  useEffect(() => {
    if (!user?.id) return
    if (user.role === 'admin' && !selectedUserId) return // Admin with no selected user, skip polling
    
    const POLL_INTERVAL = 4000 // 4 seconds
    
    const pollMessages = async () => {
      try {
        // Fetch the latest page to sync edits, deletes, reactions, and new messages
        // We pass poll=true to bypass the backend auto-mark-as-read mechanism
        const endpoint = user.role === 'admin' && selectedUserId
          ? `/api/messages?per_page=20&target_id=${selectedUserId}&poll=true`
          : `/api/messages?per_page=20&poll=true`
        
        const res = await axiosInstance.get(endpoint)
        
        if (res.data.data) {
          const polledMessages = res.data.data.map((m: ApiMessage) => formatMessage(m))
          
          setMessages(prev => {
            const existingMap = new Map(prev.map(msg => [msg.id, msg]))
            let hasChanges = false
            
            // Sync modifications to existing messages (reactions, text, pins, confirms, deletes)
            const updated = prev.map(msg => {
              const polledMsg = polledMessages.find((pm: IMessage) => pm.id === msg.id)
              if (polledMsg) {
                const reactionsChanged = JSON.stringify(polledMsg.reactions) !== JSON.stringify(msg.reactions)
                const textChanged = polledMsg.text !== msg.text
                const deletedChanged = polledMsg.isDeleted !== msg.isDeleted
                const pinnedChanged = polledMsg.is_pinned !== msg.is_pinned
                const confirmChanged = polledMsg.is_confirm !== msg.is_confirm
                
                if (reactionsChanged || textChanged || deletedChanged || pinnedChanged || confirmChanged) {
                  hasChanges = true
                  return {
                    ...msg,
                    reactions: polledMsg.reactions,
                    text: polledMsg.text,
                    isDeleted: polledMsg.isDeleted,
                    is_pinned: polledMsg.is_pinned,
                    is_confirm: polledMsg.is_confirm,
                    isEdited: polledMsg.isEdited,
                    originalText: polledMsg.originalText,
                  }
                }
              }
              return msg
            })
            
            // Append any new messages (also skip if it matches a temp optimistic ID pattern)
            const newMessages = polledMessages.filter((pm: IMessage) => {
              if (existingMap.has(pm.id)) return false
              // Check if any existing temp message matches (sent but not yet ID-swapped)
              const hasTempDuplicate = prev.some(m => 
                m.id.startsWith('msg_') && m.text === pm.text && m.senderId === pm.senderId
              )
              return !hasTempDuplicate
            })
            if (newMessages.length > 0) {
              hasChanges = true
              return [...updated, ...newMessages]
            }
            
            return hasChanges ? updated : prev
          })
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }
    
    const interval = setInterval(pollMessages, POLL_INTERVAL)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedUserId])

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' && !selectedUserId) return
      markMessagesAsRead()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, user])

  const [isHeroVisible, setIsHeroVisible] = useState(() => {
    if (user?.role && user.role !== 'customer') return false
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
  // scrollToMessageId: set by AdminControlModal pin/search; consumed by MessageList
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null)

  const [showScrollDown, setShowScrollDown] = useState(false)
  const [hasUnreadNewMessages, setHasUnreadNewMessages] = useState(false)
  const scrollToBottomRef = useRef<(() => void) | null>(null)

  const handleScrollDown = () => {
    scrollToBottomRef.current?.()
  }

  // Reset scroll down states when user changes
  useEffect(() => {
    setShowScrollDown(false)
    setHasUnreadNewMessages(false)
  }, [selectedUserId])

  // Auto-manage panel visibility based on terminal viewport
  // Accounts panel is admin-only — never auto-open for other roles
  useEffect(() => {
    const handleResize = debounce(() => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth >= 1024 && user?.role === 'admin') {
        setIsAccountsOpen(true)
      }
    }, 150)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      handleResize.cancel()
    }
  }, [user?.role])

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
      message_type: payment_code_id ? 'payment_code' : null,
      type_id: payment_code_id || null,
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

      // Show success alert if message had attachments
      if (attachments.length > 0) {
        toast.success('Upload successful')
      }

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
    <div className="MessengerTerminal relative flex h-[100dvh] w-[100dvw] max-h-screen overflow-hidden flex-col bg-slate-50">
      {user?.role === 'admin' ? (
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          {/* Header Fixed Logic */}
          <div className="fixed top-0 left-0 z-40 w-full">
            <ChatHeader
              onToggleGallery={handleToggleGallery}
              isGalleryOpen={isGalleryOpen}
              onToggleAccounts={handleToggleAccounts}
              isAccountsOpen={isAccountsOpen}
              onOpenAdminControls={() => {
                if (!selectedUserId) {
                  setIsAccountsOpen(true)
                } else {
                  setIsAdminControlsOpen(true)
                }
              }}
              title={selectedUser?.name}
              subtitle={messages.length > 0 ? `Response: ${format(new Date(messages[messages.length - 1].timestamp), 'HH:mm')}` : 'No messages'}
              userContactNumbers={selectedUser?.contact_numbers || (user as UserData)?.contact_numbers}
            />
          </div>

          <main className="relative flex flex-1 overflow-hidden pt-[80px]">
            {selectedUserId ? (
              <div className="flex flex-1 flex-col overflow-x-hidden">
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
                  scrollToMessageId={scrollToMessageId}
                  onDeleteMedia={handleDeleteMediaAttachment}
                  onShowScrollDownChange={setShowScrollDown}
                  onHasUnreadNewMessagesChange={setHasUnreadNewMessages}
                  scrollToBottomRef={scrollToBottomRef}
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
                <m.div
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
                </m.div>
              )}
            </AnimatePresence>

            {/* Accounts Panel for Desktop */}
            <AnimatePresence mode="popLayout">
              {isAccountsOpen && (
                <m.div
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
                  <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={clsx(
                          'flex w-full items-center gap-3 rounded-2xl p-3 transition-all mb-2',
                          selectedUserId === u.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-900'
                        )}
                      >
                        <div className="relative shrink-0">
                          <SidebarUserAvatar src={u.profile_picture} name={u.name} />
                          {(u.unread_count ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-sm">
                              {u.unread_count! > 99 ? '99+' : u.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="truncate text-xs font-black uppercase leading-tight">{u.name}</p>
                          <p className={clsx("text-[8px] font-black uppercase tracking-widest", selectedUserId === u.id ? 'text-slate-300' : 'text-slate-400')}>{u.account_type}</p>
                        </div>
                        {(u.unread_count ?? 0) > 0 && selectedUserId !== u.id && (
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest shrink-0">
                            {u.unread_count} new
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </main>

          {/* MessageInput Fixed Logic */}
          {selectedUserId && (
            <div className="fixed bottom-0 left-0 z-40 w-full bg-white">
              {showScrollDown && (
                <button
                  onClick={handleScrollDown}
                  className="group absolute bottom-[calc(100%+16px)] left-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-900 shadow-2xl active:scale-95"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <ArrowDown
                    size={20}
                    className="group-hover:translate-y-0.5 md:group-hover:translate-y-1 md:size-[24px]"
                  />
                  {hasUnreadNewMessages && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  <div className="absolute -top-12 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest whitespace-nowrap text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
                    {hasUnreadNewMessages ? 'New message below' : 'Latest fulfillment'}
                  </div>
                </button>
              )}
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
                onOpenAdminControls={() => setIsAdminControlsOpen(true)}
                subtitle={messages.length > 0 ? `Response: ${format(new Date(messages[messages.length - 1].timestamp), 'HH:mm')}` : 'Response: ~5m'}
                userContactNumbers={(user as UserData)?.contact_numbers}
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
            <div className={`fixed top-0 left-0 z-40 w-full ${user?.role === 'customer' ? 'md:top-20' : ''}`}>
              <ChatHeader
                onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
                isGalleryOpen={isGalleryOpen}
                onOpenAdminControls={() => setIsAdminControlsOpen(true)}
                subtitle={messages.length > 0 ? `Response: ${format(new Date(messages[messages.length - 1].timestamp), 'HH:mm')}` : 'Response: ~5m'}
                userContactNumbers={(user as UserData)?.contact_numbers}
              />
            </div>

            <main className={`relative flex flex-1 overflow-hidden ${user?.role === 'customer' ? 'pt-[80px] md:pt-[176px]' : 'pt-[80px]'}`}>
              <div className="flex flex-1 flex-col overflow-x-hidden">
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
                  scrollToMessageId={scrollToMessageId}
                  onDeleteMedia={undefined}
                  onShowScrollDownChange={setShowScrollDown}
                  onHasUnreadNewMessagesChange={setHasUnreadNewMessages}
                  scrollToBottomRef={scrollToBottomRef}
                />
              </div>

              {/* Gallery Node for Desktop */}
              <AnimatePresence mode="popLayout">
                {isGalleryOpen && (
                  <m.div
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
                  </m.div>
                )}
              </AnimatePresence>
            </main>

            {/* MessageInput Fixed Logic */}
            <div className={`fixed bottom-0 left-0 z-40 w-full bg-white `}>
              {showScrollDown && (
                <button
                  onClick={handleScrollDown}
                  className="group absolute bottom-[calc(100%+16px)] left-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-900 shadow-2xl active:scale-95"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <ArrowDown
                    size={20}
                    className="group-hover:translate-y-0.5 md:group-hover:translate-y-1 md:size-[24px]"
                  />
                  {hasUnreadNewMessages && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  <div className="absolute -top-12 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black tracking-widest whitespace-nowrap text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
                    {hasUnreadNewMessages ? 'New message below' : 'Latest fulfillment'}
                  </div>
                </button>
              )}
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
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsGalleryOpen(false)}
              />
            )}
            <m.div
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
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accounts Modal for Mobile — admin only */}
      <AnimatePresence>
        {isAccountsOpen && user?.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
            {!isSmallMobile && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setIsAccountsOpen(false)}
              />
            )}
            <m.div
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
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
                      <div className="relative shrink-0">
                        <SidebarUserAvatar src={u.profile_picture} name={u.name} />
                        {(u.unread_count ?? 0) > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-sm">
                            {u.unread_count! > 99 ? '99+' : u.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="truncate text-xs font-black uppercase leading-tight">{u.name}</p>
                        <p className={clsx("text-[8px] font-black uppercase tracking-widest", selectedUserId === u.id ? 'text-slate-300' : 'text-slate-400')}>{u.account_type}</p>
                      </div>
                      {(u.unread_count ?? 0) > 0 && selectedUserId !== u.id && (
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest shrink-0">
                          {u.unread_count} new
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <div
        id="messenger-portal-root"
        className="pointer-events-none fixed inset-0 z-[10000]"
      />

      {/* AdminControlModal */}
      <AdminControlModal
        isOpen={isAdminControlsOpen}
        onClose={() => {
          setIsAdminControlsOpen(false)
          if (user?.role === 'admin') {
            setIsAccountsOpen(true)
          }
        }}
        messages={messages}
        targetUser={user?.role === 'admin' ? users.find(u => u.id === selectedUserId) : { id: '1', name: 'PIXS Admin', profile_picture: undefined, company_name: 'PIXS Administration' }}
        onDeleteConversation={user?.role === 'admin' ? handleDeleteConversation : undefined}
        onSendMessage={handleSendMessage}
        onToggleGallery={() => {
          setIsGalleryOpen(true)
          setIsAccountsOpen(false)
        }}
        onScrollToMessage={(id) => {
          setScrollToMessageId(id)
          setIsAdminControlsOpen(false)   // hide the modal so message is visible
          // Reset after a moment so the same message can be re-scrolled to
          setTimeout(() => setScrollToMessageId(null), 800)
        }}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  )
}

export default MessengerPage
