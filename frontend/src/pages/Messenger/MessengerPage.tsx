import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Local Components
import HeroSection from './components/HeroSection.tsx';
import ChatHeader from './components/ChatHeader.tsx';
import MessageList from './components/MessageList.tsx';
import MessageInput from './components/MessageInput.tsx';
import GalleryView from './components/GalleryView.tsx';


// Mock Data
import initialMessages from '../../data/messages.json';


export interface IMessage {
  id: string;
  sender: 'customer' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  attachments?: { type: 'image' | 'file'; url: string; name: string }[];
  reactions?: { user: string; emoji: string }[];
  isEdited?: boolean;
  originalText?: string;
  isDeleted?: boolean;
  replyTo?: { id: string; text: string; senderName: string };
}

const MessengerPage: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>(() => {
    const saved = localStorage.getItem('pixs_messenger_v1');
    const localMessages: IMessage[] = saved ? JSON.parse(saved) : [];
    
    // Merge initialMessages (casted to IMessage[]) and localMessages
    const combined = [...(initialMessages as IMessage[]), ...localMessages];
    const unique = combined.filter((m, i, self) => 
       i === self.findIndex(t => t.id === m.id)
    );
    
    return unique.length > 0 ? unique : (initialMessages as IMessage[]);
  });




  const [isHeroVisible, setIsHeroVisible] = useState(messages.length === 0);
  // Initialize gallery to true for desktop mode reveal
  const [isGalleryOpen, setIsGalleryOpen] = useState(window.innerWidth >= 1024);
  const [activeReplyTo, setActiveReplyTo] = useState<IMessage | null>(null);

  // Auto-manage gallery visibility based on terminal viewport
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsGalleryOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persistence Protocol
  useEffect(() => {
    localStorage.setItem('pixs_messenger_v1', JSON.stringify(messages));
  }, [messages]);



  const handleSendMessage = (text: string, attachments: { type: 'image' | 'file'; url: string; name: string }[] = []) => {
    const newMessage: IMessage = {
      id: `msg_${Date.now()}`,
      sender: 'customer',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
      attachments,
      reactions: [],
      replyTo: activeReplyTo ? {
        id: activeReplyTo.id,
        text: activeReplyTo.text,
        senderName: activeReplyTo.senderName
      } : undefined
    };
    setMessages(prev => [...prev, newMessage]);
    setActiveReplyTo(null);
  };

  const handleEditMessage = (id: string, newText: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          text: newText,
          isEdited: true,
          originalText: msg.originalText || msg.text
        };
      }
      return msg;
    }));
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          text: 'This message has been removed.',
          isDeleted: true,
          attachments: []
        };
      }
      return msg;
    }));
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reactions = msg.reactions || [];
        const existingIdx = reactions.findIndex(r => r.user === 'customer');
        if (existingIdx > -1) {
          // Replace reaction (one logic)
          const newReactions = [...reactions];
          newReactions[existingIdx] = { user: 'customer', emoji };
          return { ...msg, reactions: newReactions };
        }
        return { ...msg, reactions: [...reactions, { user: 'customer', emoji }] };
      }
      return msg;
    }));
  };

  return (
    <div className="MessengerTerminal h-[calc(100vh-6rem)] bg-slate-50 flex flex-col overflow-hidden">

      <AnimatePresence mode="wait">
        {isHeroVisible ? (
          <motion.div 
            key="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ChatHeader 
              onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)} 
              isGalleryOpen={isGalleryOpen}
            />
            <div className="flex-1 flex items-center justify-center p-6 bg-white md:rounded-t-[48px] border-t border-slate-100 shadow-2xl overflow-hidden relative">
               <HeroSection onStart={() => setIsHeroVisible(false)} />
            </div>
          </motion.div>
        ) : (

          <motion.div 
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ChatHeader 
              onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)} 
              isGalleryOpen={isGalleryOpen}
            />
            
            <main className="flex-1 flex overflow-hidden h-full relative bg-white md:rounded-t-[48px] border-t border-slate-100 shadow-2xl">
              <div className="flex-[2] flex flex-col min-w-0 h-full border-r border-slate-50 relative overflow-hidden">
                <MessageList 
                  messages={messages} 
                  onReact={handleReaction}
                  onReply={setActiveReplyTo}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
                
                <MessageInput 
                  onSend={handleSendMessage} 
                  activeReplyTo={activeReplyTo}
                  onCancelReply={() => setActiveReplyTo(null)}
                />
              </div>

              <AnimatePresence mode="popLayout">
                {isGalleryOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '33.33%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="hidden lg:block bg-slate-50/10 overflow-hidden h-full"
                  >
                    <GalleryView messages={messages} onClose={() => setIsGalleryOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>

        )}
      </AnimatePresence>

      {/* Gallery Modal for Mobile */}
      <AnimatePresence>
        {isGalleryOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="lg:hidden fixed inset-0 z-50 bg-white"
          >
            <GalleryView messages={messages} onClose={() => setIsGalleryOpen(false)} isMobile />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Portal Root for high-fidelity interaction nodes */}
      <div id="messenger-portal-root" className="fixed inset-0 pointer-events-none z-[9999]" />
    </div>
  );

};

export default MessengerPage;
