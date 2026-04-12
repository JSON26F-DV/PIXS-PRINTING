import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Image as ImageIcon,
  User,
  Shield,
  Trash2,
  AlertCircle,
  MessageSquare,
  Users,
  Clock,
  ChevronLeft,
  Smile,
  RefreshCcw,
  UserCheck,
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../../context/AuthContext'
import { PermissionWrapper } from '../../components/guards/PermissionWrapper'
import toast from 'react-hot-toast'
import ErrorBoundary from '../../components/common/ErrorBoundary'
import { SafeTerminal } from '../../utils/safeTerminal'

// Mock Data
import initialUsersData from '../../data/users.json'
import initialMessages from '../../data/messages.json'

interface UserData {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff' | 'technician' | 'welder' | 'customer'
  profile_picture?: string
  status?: 'online' | 'offline'
}

interface MessageData {
  id: string
  conversation_id: string
  participants: string[]
  sender_id: string
  receiver_id: string
  message: string
  attachments?: { type: 'image' | 'file'; url: string; name: string }[]
  is_read: boolean
  is_starred?: boolean
  is_pinned?: boolean
  created_at: string
}

interface InitialMessageData {
  id?: string
  sender?: string
  text?: string
  message?: string
  timestamp?: string
  created_at?: string
  attachments?: unknown[]
  conversation_id?: string
  sender_id?: string
  receiver_id?: string
  participants?: string[]
}

const StaffComHubContent: React.FC = () => {
  const { user: currentUser } = useAuth()

  const [loadError, setLoadError] = useState<boolean>(false)
  const [users] = useState<UserData[]>(() => {
    const rawData = initialUsersData as unknown as {
      employees: UserData[]
      customers: UserData[]
    }
    const employees = SafeTerminal.array(rawData.employees)
    const customers = (SafeTerminal.array(rawData.customers) as UserData[]).map(
      (u) => ({ ...u, role: 'customer' as const }),
    )
    return [...employees, ...customers] as UserData[]
  })
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isInitializing, setIsInitializing] = useState(true)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>(
    'all',
  )
  const [messageText, setMessageText] = useState('')
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: string
  } | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  const initializeData = () => {
    try {
      setIsInitializing(true)
      setLoadError(false)

      const storedMessages = SafeTerminal.parseJson(
        'pixs_admin_messages_v1',
        null,
      )

      let finalMessages: MessageData[] = []

      if (storedMessages) {
        finalMessages = SafeTerminal.array(storedMessages)
      } else {
        finalMessages = SafeTerminal.array(initialMessages).map(
          (m: unknown, idx: number) => {
            const typedM = m as InitialMessageData
            if (
              typedM.conversation_id &&
              typedM.sender_id &&
              typedM.receiver_id
            ) {
              return typedM as unknown as MessageData
            }

            return {
              id: typedM.id || `msg_init_${idx}`,
              conversation_id: `CONV_SYSTEM`,
              participants: [
                currentUser?.id || 'admin',
                typedM.sender === 'admin' ? 'CUST-501' : 'admin',
              ],
              sender_id:
                typedM.sender === 'admin'
                  ? currentUser?.id || 'EMP-001'
                  : 'CUST-501',
              receiver_id:
                typedM.sender === 'admin'
                  ? 'CUST-501'
                  : currentUser?.id || 'EMP-001',
              message:
                typedM.message || typedM.text || 'Corrupted Message Content',
              attachments: SafeTerminal.array(typedM.attachments),
              is_read: true,
              created_at:
                typedM.created_at ||
                typedM.timestamp ||
                new Date().toISOString(),
            } as MessageData
          },
        )
      }

      setMessages(finalMessages)
    } catch (e) {
      console.error('Critical Load Failure:', e)
      setLoadError(true)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    initializeData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id])

  useEffect(() => {
    if (!isInitializing && !loadError) {
      try {
        localStorage.setItem('pixs_admin_messages_v1', JSON.stringify(messages))
      } catch (e) {
        console.warn('Storage Write Failure', e)
      }
    }
  }, [messages, isInitializing, loadError])

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [selectedUserId, messages])

  const filteredUsers = useMemo(() => {
    return users.filter((u: UserData) => {
      if (!u || !u.id || u.id === currentUser?.id) return false
      const nameMatch = (u.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesSearch = nameMatch
      const matchesRole = roleFilter === 'all' || u.role === roleFilter

      // Visibility restrictions:
      // Admin sees everyone (but themselves)
      // Staff only sees Admin and Customers
      const isVisible =
        currentUser?.role === 'admin'
          ? true
          : u.role === 'admin' || u.role === 'customer'

      return matchesSearch && matchesRole && isVisible
    })
  }, [users, searchQuery, roleFilter, currentUser])

  const activeConversation = useMemo(() => {
    if (!selectedUserId || !currentUser?.id) return []
    const currId = currentUser.id
    return messages
      .filter(
        (m: MessageData) =>
          m &&
          m.participants &&
          m.participants.includes(selectedUserId) &&
          m.participants.includes(currId),
      )
      .sort(
        (a: MessageData, b: MessageData) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
  }, [selectedUserId, messages, currentUser])

  const selectedUser = useMemo(
    () => users.find((u: UserData) => u && u.id === selectedUserId),
    [selectedUserId, users],
  )

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!messageText.trim() || !selectedUserId || !currentUser?.id) return

    try {
      const newMessage: MessageData = {
        id: `msg_${uuidv4()}`,
        conversation_id: [currentUser.id, selectedUserId].sort().join('_'),
        participants: [currentUser.id, selectedUserId],
        sender_id: currentUser.id,
        receiver_id: selectedUserId,
        message: messageText.trim(),
        attachments: [],
        is_read: false,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, newMessage])
      setMessageText('')
    } catch (err) {
      console.error(err)
      toast.error('Message Sync Failure')
    }
  }

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m && m.id !== id))
    setShowDeleteConfirm(null)
    toast.success('Trace deleted')
  }

  if (loadError) {
    return (
      <div className="MessageRetrieveError flex h-[calc(100vh-140px)] flex-col items-center justify-center rounded-[32px] border border-slate-100 bg-white p-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
          <AlertCircle className="text-rose-500" size={40} />
        </div>
        <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-900 uppercase italic">
          Com-Hub Offline
        </h2>
        <p className="mb-8 max-w-[320px] text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase">
          Unable to retrieve messages. Please reload or contact administrator.
        </p>
        <button
          onClick={initializeData}
          className="flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
        >
          <RefreshCcw size={18} />
          Reconnect Node
        </button>
      </div>
    )
  }

  if (isInitializing) {
    return (
      <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center rounded-[40px] bg-white p-12 shadow-inner">
        <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-slate-900" />
        <p className="animate-pulse text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
          Initializing Communication Matrix...
        </p>
      </div>
    )
  }

  return (
    <div className="StaffComHubContainer flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl">
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={clsx(
            'StaffComHubSidebar flex flex-col border-r border-slate-100 transition-all duration-300',
            isMobileView && selectedUserId
              ? 'w-0 opacity-0'
              : 'w-full opacity-100 lg:w-[400px]',
          )}
        >
          <div className="space-y-6 p-8">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                Com-Hub
              </h3>
              <p className="mt-1 text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                Personnel Interaction Relay
              </p>
            </div>

            <div className="relative">
              <Search
                className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search Active Nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 pr-4 pl-12 text-xs font-black tracking-widest uppercase transition-all focus:ring-4 focus:ring-slate-900/5 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['all', 'customer', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={clsx(
                    'rounded-xl px-5 py-2 text-[9px] font-black tracking-widest uppercase transition-all',
                    roleFilter === role
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100',
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-8">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected = selectedUserId === u.id
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={clsx(
                      'group mb-2 flex w-full items-center gap-5 rounded-[28px] p-5 transition-all',
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30'
                        : 'border border-transparent text-slate-900 hover:border-slate-100 hover:bg-slate-50',
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={clsx(
                          'h-14 w-14 overflow-hidden rounded-2xl border-2 transition-all group-hover:scale-105',
                          isSelected
                            ? 'border-slate-700'
                            : 'border-white shadow-sm',
                        )}
                      >
                        {u.profile_picture ? (
                          <img
                            src={u.profile_picture}
                            alt={u.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div
                        className={clsx(
                          'absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2',
                          isSelected
                            ? 'border-slate-900'
                            : 'border-white shadow-sm',
                          u.status === 'online'
                            ? 'bg-emerald-500'
                            : 'bg-slate-300',
                        )}
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <p
                        className={clsx(
                          'truncate text-sm font-black tracking-tight uppercase italic',
                          isSelected ? 'text-white' : 'text-slate-900',
                        )}
                      >
                        {u.name}
                      </p>
                      <span
                        className={clsx(
                          'mt-1 inline-block rounded-lg px-2 py-0.5 text-[8px] font-black tracking-widest uppercase',
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-emerald-100 text-emerald-600',
                        )}
                      >
                        {u.role}
                      </span>
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-12 text-center">
                <Users className="mx-auto mb-4 text-slate-200" size={48} />
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Spectral Void Detected
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Chat Window */}
        <main
          className={clsx(
            'StaffComHubChatWindow relative flex flex-1 flex-col bg-slate-50/20 transition-all duration-300',
            isMobileView && !selectedUserId ? 'hidden' : 'flex',
          )}
        >
          {selectedUser ? (
            <>
              {/* Header */}
              <header className="z-10 flex items-center justify-between border-b border-slate-100 bg-white px-10 py-8 shadow-sm">
                <div className="flex items-center gap-5">
                  {isMobileView && (
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="rounded-2xl p-3 transition-colors hover:bg-slate-50"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <div className="relative">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-slate-50 bg-white shadow-sm">
                      {selectedUser.profile_picture ? (
                        <img
                          src={selectedUser.profile_picture}
                          alt={selectedUser.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                          <User size={28} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg leading-tight font-black tracking-tight text-slate-900 uppercase italic">
                      {selectedUser.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <div
                        className={clsx(
                          'h-2 w-2 rounded-full',
                          selectedUser.status === 'online'
                            ? 'animate-pulse bg-emerald-500'
                            : 'bg-slate-300',
                        )}
                      />
                      <p className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                        {selectedUser.status === 'online'
                          ? 'Active Interface'
                          : 'Dormant Node'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="mr-4 flex flex-col items-end">
                    <p className="text-[10px] font-black tracking-[2px] text-slate-900 uppercase">
                      Terminal 12
                    </p>
                    <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">
                      Encrypted Stream
                    </p>
                  </div>
                  <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </header>

              {/* List */}
              <div
                ref={scrollRef}
                className="StaffComHubMessageList custom-scrollbar flex-1 space-y-12 overflow-y-auto px-10 py-12"
              >
                {activeConversation.length > 0 ? (
                  activeConversation.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                      <div
                        key={msg.id}
                        className={clsx(
                          'group flex flex-col',
                          isMe ? 'items-end' : 'items-start',
                        )}
                      >
                        <div
                          className={clsx(
                            'group relative max-w-[75%] rounded-[32px] px-8 py-5 text-[13px] leading-relaxed font-bold break-words whitespace-pre-wrap shadow-sm',
                            isMe
                              ? 'rounded-tr-[4px] bg-slate-900 text-white shadow-slate-900/10'
                              : 'rounded-tl-[4px] border border-slate-100 bg-white text-slate-800',
                          )}
                        >
                          {msg.message}

                          <div
                            className={clsx(
                              'absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-2xl border border-slate-100 bg-white p-1 opacity-0 shadow-xl transition-all group-hover:opacity-100',
                              isMe
                                ? 'right-[calc(100%+16px)]'
                                : 'left-[calc(100%+16px)]',
                            )}
                          >
                            <PermissionWrapper
                              allowedRoles={['admin']}
                              hideIfNoAccess
                            >
                              <button
                                onClick={() =>
                                  setShowDeleteConfirm({ id: msg.id })
                                }
                                className="rounded-xl p-2 text-rose-500 transition-all hover:bg-rose-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            </PermissionWrapper>
                            <button className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-50">
                              <Smile size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 text-[9px] font-black tracking-[3px] text-slate-300 uppercase">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                    <div className="relative mb-10 flex h-32 w-32 items-center justify-center rounded-[48px] bg-white shadow-2xl">
                      <MessageSquare className="text-slate-900" size={64} />
                      <div className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-slate-900">
                        <Clock className="text-white" size={20} />
                      </div>
                    </div>
                    <h4 className="mb-4 text-2xl font-black tracking-tighter text-slate-900 uppercase italic line-through decoration-slate-100 decoration-8">
                      No Initial Sequence
                    </h4>
                    <p className="max-w-[320px] text-[10px] leading-relaxed font-black tracking-[2.5px] text-slate-400 uppercase">
                      Begin the audit trail by transmitting a secure message
                      coordinate to this node.
                    </p>
                  </div>
                )}
              </div>

              {/* Input */}
              <footer className="StaffComHubMessageInput relative z-20 border-t border-slate-100 bg-white p-10 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
                <form
                  onSubmit={handleSendMessage}
                  className="mx-auto flex max-w-6xl items-center gap-6"
                >
                  <div className="flex rounded-[28px] border border-slate-100 bg-slate-50 p-2">
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-white hover:text-slate-900 active:scale-90"
                    >
                      <Paperclip size={20} />
                    </button>
                    <button
                      type="button"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-white hover:text-slate-900 active:scale-90"
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={`TRANSMIT MESSAGE TO ${selectedUser.name.toUpperCase()}...`}
                      className="max-h-[160px] min-h-[64px] w-full resize-none rounded-[32px] border border-slate-100 bg-slate-50 px-8 py-5 text-sm font-black tracking-widest text-slate-900 uppercase transition-all placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:outline-none"
                      rows={1}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className={clsx(
                      'flex h-16 w-16 items-center justify-center rounded-[32px] shadow-2xl transition-all active:scale-[0.95]',
                      messageText.trim()
                        ? 'bg-slate-900 text-[#75EEA5] shadow-slate-900/30 hover:bg-slate-800'
                        : 'cursor-not-allowed bg-slate-100 text-slate-300 shadow-none grayscale',
                    )}
                  >
                    <Send
                      size={28}
                      className={
                        messageText.trim() ? 'translate-x-1 -translate-y-1' : ''
                      }
                    />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-white p-12 text-center">
              <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
                <div className="grid grid-cols-10 gap-4">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="font-mono text-[10px] font-black">
                      PIXS_SYNC_{i}
                    </div>
                  ))}
                </div>
              </div>

              <div className="animate-in zoom-in mb-10 flex h-40 w-40 items-center justify-center rounded-[64px] bg-slate-900 shadow-2xl duration-700">
                <UserCheck className="text-[#75EEA5]" size={80} />
              </div>
              <h4 className="mb-4 text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                Secure Communication Matrix
              </h4>
              <p className="mb-12 max-w-[360px] text-[11px] leading-loose font-black tracking-[4px] text-slate-400 uppercase">
                Authorized Personnel only. Select an external data node to
                initialize secure interaction protocols.
              </p>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                    <Shield className="text-slate-900" size={20} />
                  </div>
                  <p className="text-[9px] font-black tracking-[2px] uppercase">
                    Encrypted
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                    <Clock className="text-slate-900" size={20} />
                  </div>
                  <p className="text-[9px] font-black tracking-[2px] uppercase">
                    Audited
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-[40px] border border-slate-200 bg-white p-10 shadow-2xl"
            >
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
              <h3 className="mb-3 text-2xl font-black tracking-tight text-slate-900 uppercase italic underline decoration-rose-500 decoration-4">
                Purge Trace?
              </h3>
              <p className="mb-10 text-[10px] leading-loose font-black tracking-widest text-slate-400 uppercase">
                Immediate removal of this projection node. This event will be
                recorded in the security logs.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 rounded-2xl bg-slate-100 py-5 text-[10px] font-black tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-200"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleDeleteMessage(showDeleteConfirm.id)}
                  className="flex-1 rounded-2xl bg-slate-900 py-5 text-[10px] font-black tracking-widest text-white uppercase shadow-xl shadow-slate-900/20 transition-all"
                >
                  PURGE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const StaffComHub: React.FC = () => {
  return (
    <ErrorBoundary>
      <StaffComHubContent />
    </ErrorBoundary>
  )
}

export default StaffComHub
