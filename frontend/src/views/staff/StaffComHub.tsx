import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';
import { PermissionWrapper } from '../../components/guards/PermissionWrapper';
import toast from 'react-hot-toast';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { SafeTerminal } from '../../utils/safeTerminal';

// Mock Data
import initialUsers from '../../data/user.json';
import initialMessages from '../../data/messages.json';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  profile_picture?: string;
  status?: 'online' | 'offline';
}

interface MessageData {
  id: string;
  conversation_id: string;
  participants: string[];
  sender_id: string;
  receiver_id: string;
  message: string;
  attachments?: { type: 'image' | 'file'; url: string; name: string }[];
  is_read: boolean;
  is_starred?: boolean;
  is_pinned?: boolean;
  created_at: string;
}

interface InitialMessageData {
  id?: string;
  sender?: string;
  text?: string;
  message?: string;
  timestamp?: string;
  created_at?: string;
  attachments?: unknown[];
  conversation_id?: string;
  sender_id?: string;
  receiver_id?: string;
  participants?: string[];
}

const StaffComHubContent: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  const [loadError, setLoadError] = useState<boolean>(false);
  const [users] = useState<UserData[]>(() => SafeTerminal.array(initialUsers) as UserData[]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [messageText, setMessageText] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const initializeData = () => {
    try {
      setIsInitializing(true);
      setLoadError(false);
      
      const storedMessages = SafeTerminal.parseJson('pixs_admin_messages_v1', null);
      
      let finalMessages: MessageData[] = [];
      
      if (storedMessages) {
        finalMessages = SafeTerminal.array(storedMessages);
      } else {
        finalMessages = SafeTerminal.array(initialMessages).map((m: unknown, idx: number) => {
          const typedM = m as InitialMessageData;
          if (typedM.conversation_id && typedM.sender_id && typedM.receiver_id) {
            return typedM as unknown as MessageData;
          }
          
          return {
            id: typedM.id || `msg_init_${idx}`,
            conversation_id: `CONV_SYSTEM`,
            participants: [currentUser?.id || 'admin', typedM.sender === 'admin' ? 'CUST-501' : 'admin'],
            sender_id: typedM.sender === 'admin' ? (currentUser?.id || 'EMP-001') : 'CUST-501',
            receiver_id: typedM.sender === 'admin' ? 'CUST-501' : (currentUser?.id || 'EMP-001'),
            message: typedM.message || typedM.text || "Corrupted Message Content",
            attachments: SafeTerminal.array(typedM.attachments),
            is_read: true,
            created_at: typedM.created_at || typedM.timestamp || new Date().toISOString()
          } as MessageData;
        });
      }
      
      setMessages(finalMessages);
    } catch (e) {
      console.error("Critical Load Failure:", e);
      setLoadError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!isInitializing && !loadError) {
      try {
        localStorage.setItem('pixs_admin_messages_v1', JSON.stringify(messages));
      } catch (e) {
        console.warn("Storage Write Failure", e);
      }
    }
  }, [messages, isInitializing, loadError]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedUserId, messages]);

  const filteredUsers = useMemo(() => {
    return users.filter((u: UserData) => {
      if (!u || !u.id || u.id === currentUser?.id) return false;
      const nameMatch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = nameMatch;
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      
      // Visibility restrictions: 
      // Admin sees everyone (but themselves)
      // Staff only sees Admin and Customers
      const isVisible = currentUser?.role === 'admin' 
        ? true 
        : (u.role === 'admin' || u.role === 'customer');
      
      return matchesSearch && matchesRole && isVisible;
    });
  }, [users, searchQuery, roleFilter, currentUser]);

  const activeConversation = useMemo(() => {
    if (!selectedUserId || !currentUser?.id) return [];
    const currId = currentUser.id;
    return messages
      .filter((m: MessageData) => 
        m && m.participants && m.participants.includes(selectedUserId) && m.participants.includes(currId)
      )
      .sort((a: MessageData, b: MessageData) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selectedUserId, messages, currentUser]);

  const selectedUser = useMemo(() => 
    users.find((u: UserData) => u && u.id === selectedUserId), 
    [selectedUserId, users]
  );

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedUserId || !currentUser?.id) return;

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
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
    } catch (err) {
      console.error(err);
      toast.error("Message Sync Failure");
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m && m.id !== id));
    setShowDeleteConfirm(null);
    toast.success('Trace deleted');
  };

  if (loadError) {
    return (
      <div className="MessageRetrieveError h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[32px] p-12 text-center border border-slate-100">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
          <AlertCircle className="text-rose-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase italic">Com-Hub Offline</h2>
        <p className="text-slate-400 font-bold max-w-[320px] mb-8 leading-relaxed uppercase text-[10px] tracking-widest">
          Unable to retrieve messages. Please reload or contact administrator.
        </p>
        <button 
          onClick={initializeData}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
        >
          <RefreshCcw size={18} />
          Reconnect Node
        </button>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center bg-white rounded-[40px] p-12 shadow-inner">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 animate-pulse">Initializing Communication Matrix...</p>
      </div>
    );
  }

  return (
    <div className="StaffComHubContainer h-[calc(100vh-140px)] flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
      
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar */}
        <aside className={clsx(
          "StaffComHubSidebar border-r border-slate-100 flex flex-col transition-all duration-300",
          isMobileView && selectedUserId ? "w-0 opacity-0" : "w-full lg:w-[400px] opacity-100"
        )}>
          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Com-Hub</h3>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[2px] mt-1">Personnel Interaction Relay</p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search Active Nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['all', 'customer', 'admin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={clsx(
                    "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    roleFilter === role 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-8">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(u => {
                const isSelected = selectedUserId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={clsx(
                      "w-full flex items-center gap-5 p-5 transition-all rounded-[28px] mb-2 group",
                      isSelected ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/30" : "hover:bg-slate-50 border border-transparent hover:border-slate-100 text-slate-900"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={clsx(
                        "w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all group-hover:scale-105",
                        isSelected ? "border-slate-700" : "border-white shadow-sm"
                      )}>
                        {u.profile_picture ? (
                          <img src={u.profile_picture} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div className={clsx(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2",
                        isSelected ? "border-slate-900" : "border-white shadow-sm",
                        u.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className={clsx("font-black text-sm truncate tracking-tight uppercase italic", isSelected ? "text-white" : "text-slate-900")}>
                        {u.name}
                      </p>
                      <span className={clsx(
                        "inline-block px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest mt-1",
                        u.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {u.role}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Users className="text-slate-200 mx-auto mb-4" size={48} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spectral Void Detected</p>
              </div>
            )}
          </div>
        </aside>

        {/* Chat Window */}
        <main className={clsx(
          "StaffComHubChatWindow flex-1 flex flex-col bg-slate-50/20 transition-all duration-300 relative",
          isMobileView && !selectedUserId ? "hidden" : "flex"
        )}>
          {selectedUser ? (
            <>
              {/* Header */}
              <header className="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-5">
                  {isMobileView && (
                    <button onClick={() => setSelectedUserId(null)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden border-2 border-slate-50 shadow-sm">
                      {selectedUser.profile_picture ? (
                        <img src={selectedUser.profile_picture} alt={selectedUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <User size={28} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight uppercase italic tracking-tight">{selectedUser.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={clsx("w-2 h-2 rounded-full", selectedUser.status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                      <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">
                        {selectedUser.status === 'online' ? "Active Interface" : "Dormant Node"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end mr-4">
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-[2px]">Terminal 12</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Encrypted Stream</p>
                   </div>
                   <button className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all active:scale-95 border border-slate-100">
                      <MoreVertical size={20} />
                   </button>
                </div>
              </header>

              {/* List */}
              <div ref={scrollRef} className="StaffComHubMessageList flex-1 overflow-y-auto px-10 py-12 space-y-12 custom-scrollbar">
                {activeConversation.length > 0 ? (
                  activeConversation.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    return (
                      <div key={msg.id} className={clsx("flex flex-col group", isMe ? "items-end" : "items-start")}>
                        <div className={clsx(
                          "max-w-[75%] px-8 py-5 rounded-[32px] text-[13px] font-bold shadow-sm relative group whitespace-pre-wrap break-words leading-relaxed",
                          isMe 
                            ? "bg-slate-900 text-white rounded-tr-[4px] shadow-slate-900/10" 
                            : "bg-white text-slate-800 border border-slate-100 rounded-tl-[4px]"
                        )}>
                          {msg.message}
                          
                          <div className={clsx(
                            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white border border-slate-100 shadow-xl p-1 rounded-2xl z-20",
                            isMe ? "right-[calc(100%+16px)]" : "left-[calc(100%+16px)]"
                          )}>
                             <PermissionWrapper allowedRoles={['admin']} hideIfNoAccess>
                                <button onClick={() => setShowDeleteConfirm({ id: msg.id })} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                   <Trash2 size={16} />
                                </button>
                             </PermissionWrapper>
                             <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                                <Smile size={16} />
                             </button>
                          </div>
                        </div>
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[3px] text-slate-300">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12">
                    <div className="w-32 h-32 rounded-[48px] bg-white shadow-2xl flex items-center justify-center mb-10 relative">
                       <MessageSquare className="text-slate-900" size={64} />
                       <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center border-4 border-white">
                          <Clock className="text-white" size={20} />
                       </div>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic line-through decoration-slate-100 decoration-8">No Initial Sequence</h4>
                    <p className="text-[10px] font-black text-slate-400 max-w-[320px] uppercase tracking-[2.5px] leading-relaxed">
                      Begin the audit trail by transmitting a secure message coordinate to this node.
                    </p>
                  </div>
                )}
              </div>

              {/* Input */}
              <footer className="StaffComHubMessageInput p-10 bg-white border-t border-slate-100 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] relative z-20">
                <form onSubmit={handleSendMessage} className="max-w-6xl mx-auto flex items-center gap-6">
                  <div className="flex bg-slate-50 rounded-[28px] p-2 border border-slate-100">
                    <button type="button" className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-white hover:text-slate-900 transition-all active:scale-90">
                      <Paperclip size={20} />
                    </button>
                    <button type="button" className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-white hover:text-slate-900 transition-all active:scale-90">
                      <ImageIcon size={20} />
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <textarea 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`TRANSMIT MESSAGE TO ${selectedUser.name.toUpperCase()}...`}
                      className="w-full bg-slate-50 border border-slate-100 rounded-[32px] px-8 py-5 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all resize-none min-h-[64px] max-h-[160px] uppercase tracking-widest"
                      rows={1}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={!messageText.trim()}
                    className={clsx(
                      "w-16 h-16 flex items-center justify-center rounded-[32px] transition-all shadow-2xl active:scale-[0.95]",
                      messageText.trim() 
                        ? "bg-slate-900 text-[#75EEA5] shadow-slate-900/30 hover:bg-slate-800" 
                        : "bg-slate-100 text-slate-300 shadow-none grayscale cursor-not-allowed"
                    )}
                  >
                    <Send size={28} className={messageText.trim() ? "translate-x-1 -translate-y-1" : ""} />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white relative overflow-hidden">
               <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                  <div className="grid grid-cols-10 gap-4">
                     {Array.from({length: 100}).map((_, i) => (
                        <div key={i} className="text-[10px] font-black font-mono">PIXS_SYNC_{i}</div>
                     ))}
                  </div>
               </div>
               
               <div className="w-40 h-40 rounded-[64px] bg-slate-900 flex items-center justify-center mb-10 shadow-2xl animate-in zoom-in duration-700">
                  <UserCheck className="text-[#75EEA5]" size={80} />
               </div>
               <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Secure Communication Matrix</h4>
               <p className="text-[11px] font-black text-slate-400 max-w-[360px] mb-12 leading-loose uppercase tracking-[4px]">
                  Authorized Personnel only. Select an external data node to initialize secure interaction protocols.
               </p>
               
               <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-3">
                        <Shield className="text-slate-900" size={20} />
                     </div>
                     <p className="text-[9px] font-black uppercase tracking-[2px]">Encrypted</p>
                  </div>
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 mb-3">
                        <Clock className="text-slate-900" size={20} />
                     </div>
                     <p className="text-[9px] font-black uppercase tracking-[2px]">Audited</p>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-8">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase italic underline decoration-rose-500 decoration-4">Purge Trace?</h3>
              <p className="text-[10px] font-black text-slate-400 mb-10 leading-loose uppercase tracking-widest">
                Immediate removal of this projection node. This event will be recorded in the security logs.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest">CANCEL</button>
                <button onClick={() => handleDeleteMessage(showDeleteConfirm.id)} className="flex-1 py-5 bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/20 uppercase text-[10px] tracking-widest">PURGE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

const StaffComHub: React.FC = () => {
  return (
    <ErrorBoundary>
      <StaffComHubContent />
    </ErrorBoundary>
  );
};

export default StaffComHub;
