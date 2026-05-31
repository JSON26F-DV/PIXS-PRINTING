import re

with open('src/pages/Messenger/MessengerPage.tsx', 'r') as f:
    content = f.read()

# 1. Add lucide-react imports
content = content.replace("import { clsx } from 'clsx'", "import { clsx } from 'clsx'\nimport { Search, User as UserIcon } from 'lucide-react'")

# 2. Add UserData interface
interfaces = """
interface UserData {
  id: string
  name: string
  email: string
  account_type: 'employee' | 'customer'
  profile_picture?: string
  status?: 'online' | 'offline'
}
"""
content = content.replace("export interface IMessage {", interfaces + "\nexport interface IMessage {")

# 3. Add states to MessengerPage
states = """  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'customer'>('all')

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

"""
content = content.replace("  const [messages, setMessages] = useState<IMessage[]>([])", states + "  const [messages, setMessages] = useState<IMessage[]>([])")

# 4. Update fetchMessages inside useEffect
old_use_effect = """  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get('/api/messages')
        
        // Filter messages to only show those related to the current user
        const relatedMessages = res.data.data.filter(
          (m: ApiMessage) => m.sender_id === user.id || m.receiver_id === user.id
        )

        const formatted = relatedMessages.map((m: ApiMessage) => {
          const isMine = m.sender_id === user.id
          return {
            id: m.id,
            // If the current user sent it, treat as 'customer' for right-side alignment
            sender: isMine ? 'customer' : 'admin', 
            senderName: isMine ? 'You' : (m.sender_type === 'employee' ? 'PIXS Admin' : 'Customer'),
            text: m.message,
            timestamp: m.created_at,
            attachments: m.attachments ? m.attachments.map(a => ({ type: a.type, url: a.url, name: a.name })) : [],
            reactions: [],
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            order_id: m.order_id,
            screenplate_request_id: m.screenplate_request_id,
            is_confirm: m.is_confirm
          }
        })
        setMessages(formatted)
      } catch (error) {
        console.error('Failed to load messages', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (user && user.id) {
      fetchMessages()
      fetchImageCount()
    } else {
      setIsLoading(false)
    }
  }, [user])"""

new_use_effect = """  useEffect(() => {
    const fetchMessages = async () => {
      try {
        let endpoint = '/api/messages'
        if (user.role === 'admin' && selectedUserId) {
          endpoint += `?target_id=${selectedUserId}`
        } else if (user.role === 'admin' && !selectedUserId) {
          setMessages([])
          setIsLoading(false)
          return
        }

        const res = await axiosInstance.get(endpoint)
        const formatted = res.data.data.map((m: ApiMessage) => {
          const isMine = m.sender_id === user.id
          return {
            id: m.id,
            sender: isMine ? 'customer' : 'admin', 
            senderName: isMine ? 'You' : (m.sender_type === 'employee' ? 'PIXS Admin' : 'Customer'),
            text: m.message,
            timestamp: m.created_at,
            attachments: m.attachments ? m.attachments.map(a => ({ type: a.type, url: a.url, name: a.name })) : [],
            reactions: [],
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            order_id: m.order_id,
            screenplate_request_id: m.screenplate_request_id,
            is_confirm: m.is_confirm
          }
        })
        setMessages(formatted)
      } catch (error) {
        console.error('Failed to load messages', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (user && user.id) {
      if (user.role === 'admin') fetchUsers()
      fetchMessages()
      fetchImageCount()
    } else {
      setIsLoading(false)
    }
  }, [user, selectedUserId])"""

content = content.replace(old_use_effect, new_use_effect)

# 5. Fix Message Send Logic
old_handle_send = """      const receiverId = user.account_type === 'employee' 
        ? (activeReplyTo?.senderId || '1') 
        : '1';
      const receiverType = user.account_type === 'employee'
        ? 'customer'
        : 'employee';"""

new_handle_send = """      const receiverId = user.role === 'admin' 
        ? (selectedUserId || activeReplyTo?.senderId || '1') 
        : '1';
      const receiverType = user.role === 'admin'
        ? (users.find(u => u.id === selectedUserId)?.account_type || 'customer')
        : 'employee';"""
content = content.replace(old_handle_send, new_handle_send)

# 6. UI Update
# Modify the render tree for admin sidebar
old_render = """  return (
    <div className="MessengerTerminal relative flex min-h-screen flex-col bg-slate-50 scrollbar-neogreen">
      <AnimatePresence mode="wait">
        {isHeroVisible ? (
          <div className="flex flex-1 flex-col pt-20">
            <div className="fixed top-0 left-0 z-40 w-full md:top-20">
              <ChatHeader
                onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
                isGalleryOpen={isGalleryOpen}
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
        ) : ("""

new_render = """  return (
    <div className="MessengerTerminal relative flex min-h-screen flex-col bg-slate-50 scrollbar-neogreen">
      {user?.role === 'admin' ? (
        <div className="flex flex-1 flex-col lg:flex-row pt-20">
          <aside className="w-full lg:w-[400px] flex flex-col border-r border-slate-200 bg-white shadow-sm overflow-hidden h-[calc(100vh-80px)]">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-black uppercase italic text-slate-900">Admin Control</h3>
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
                    onClick={() => setRoleFilter(role as any)}
                    className={clsx(
                      'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition-all',
                      roleFilter === role ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={clsx(
                    'flex w-full items-center gap-4 rounded-2xl p-4 transition-all mb-2',
                    selectedUserId === u.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-900'
                  )}
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center">
                    {u.profile_picture ? <img src={u.profile_picture} alt={u.name} className="h-full w-full object-cover" /> : <UserIcon size={20} className={selectedUserId === u.id ? 'text-white' : 'text-slate-400'} />}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="truncate text-sm font-black uppercase">{u.name}</p>
                    <p className={clsx("text-[9px] font-black uppercase tracking-widest", selectedUserId === u.id ? 'text-slate-300' : 'text-slate-400')}>{u.account_type}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>
          
          <main className="flex flex-1 flex-col relative h-[calc(100vh-80px)]">
            {selectedUserId ? (
              <div className="flex flex-1 flex-col h-full">
                <div className="absolute top-0 left-0 z-40 w-full">
                  <ChatHeader onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)} isGalleryOpen={isGalleryOpen} />
                </div>
                <div className="flex-1 overflow-hidden relative pt-[80px] pb-[80px]">
                  <MessageList messages={messages} onReact={handleReaction} onReply={setActiveReplyTo} onEdit={handleEditMessage} onDelete={handleDeleteMessage} isLoading={isLoading} />
                </div>
                <div className="absolute bottom-0 left-0 z-40 w-full bg-white">
                  <MessageInput onSend={handleSendMessage} activeReplyTo={activeReplyTo} onCancelReply={() => setActiveReplyTo(null)} totalImageUploads={imageUploadCount} isEmployee={true} />
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-12 text-center text-slate-400">
                <div className="mb-6 h-24 w-24 rounded-3xl bg-slate-100 flex items-center justify-center shadow-inner">
                  <UserIcon size={40} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-black uppercase italic text-slate-800">Select a User</h2>
                <p className="mt-2 max-w-xs text-[10px] font-bold tracking-widest uppercase text-slate-400">Choose a user from the sidebar to view their messages.</p>
              </div>
            )}
            
            {/* Gallery Node for Desktop */}
            <AnimatePresence mode="popLayout">
              {isGalleryOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '33.33%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="absolute top-[80px] right-0 bottom-[80px] z-30 hidden border-l border-slate-100 bg-white lg:block"
                >
                  <GalleryView
                    messages={messages}
                    onClose={() => setIsGalleryOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      ) : (
      <AnimatePresence mode="wait">
        {isHeroVisible ? (
          <div className="flex flex-1 flex-col pt-20">
            <div className="fixed top-0 left-0 z-40 w-full md:top-20">
              <ChatHeader
                onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
                isGalleryOpen={isGalleryOpen}
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
        ) : ("""

content = content.replace(old_render, new_render)

# Add closing tag for the `user?.role === 'admin' ?` condition
# Find the end of AnimatePresence
old_end = """        )}
      </AnimatePresence>

      {/* Gallery Modal for Mobile */}"""

new_end = """        )}
      </AnimatePresence>
      )}

      {/* Gallery Modal for Mobile */}"""
content = content.replace(old_end, new_end)

with open('src/pages/Messenger/MessengerPage.tsx', 'w') as f:
    f.write(content)

