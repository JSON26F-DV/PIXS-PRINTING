import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Local Components
import HeroSection from './components/HeroSection.tsx'
import ChatHeader from './components/ChatHeader.tsx'
import MessageList from './components/MessageList.tsx'
import MessageInput from './components/MessageInput.tsx'
import GalleryView from './components/GalleryView.tsx'

import axiosInstance from '../../lib/axiosInstance.ts'

export interface IMessage {
  id: string
  sender: 'customer' | 'admin'
  senderName: string
  text: string
  timestamp: string
  attachments?: { type: 'image' | 'file'; url: string; name: string }[]
  reactions?: { user: string; emoji: string }[]
  isEdited?: boolean
  originalText?: string
  isDeleted?: boolean
  replyTo?: { id: string; text: string; senderName: string }
}

interface ApiMessage {
  id: string;
  sender_type: 'customer' | 'employee';
  message: string;
  created_at: string;
  sender_id?: string;
  receiver_id?: string;
}

const MessengerPage: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get('/api/messages')
        const formatted = res.data.data.map((m: ApiMessage) => ({
          id: m.id,
          sender: m.sender_type === 'customer' ? 'customer' : 'admin',
          senderName: m.sender_type === 'customer' ? 'You' : 'PIXS Admin',
          text: m.message,
          timestamp: m.created_at,
          attachments: [],
          reactions: []
        }))
        setMessages(formatted)
      } catch (error) {
        console.error('Failed to load messages', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMessages()
  }, [])

  const [isHeroVisible, setIsHeroVisible] = useState(messages.length === 0)
  // Initialize gallery to true for desktop mode reveal
  const [isGalleryOpen, setIsGalleryOpen] = useState(window.innerWidth >= 1024)
  const [activeReplyTo, setActiveReplyTo] = useState<IMessage | null>(null)

  // Auto-manage gallery visibility based on terminal viewport
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsGalleryOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Persistence Protocol
  useEffect(() => {
    localStorage.setItem('pixs_messenger_v1', JSON.stringify(messages))
  }, [messages])

  const handleSendMessage = async (
    text: string,
    attachments: { type: 'image' | 'file'; url: string; name: string }[] = [],
  ) => {
    const tempId = `msg_${Date.now()}`
    const newMessage: IMessage = {
      id: tempId,
      sender: 'customer',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
      attachments,
      reactions: [],
      replyTo: activeReplyTo
        ? {
            id: activeReplyTo.id,
            text: activeReplyTo.text,
            senderName: activeReplyTo.senderName,
          }
        : undefined,
    }
    setMessages((prev) => [...prev, newMessage])
    setActiveReplyTo(null)

    try {
      await axiosInstance.post('/api/messages/send', {
        message: text,
        receiver_id: '1', // default to first admin
        receiver_type: 'employee',
      })
    } catch (error) {
      console.error('Message failed to send', error)
      // Ideally flag message as failed here
    }
  }

  const handleEditMessage = (id: string, newText: string) => {
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
  }

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === id) {
          return {
            ...msg,
            text: 'This message has been removed.',
            isDeleted: true,
            attachments: [],
          }
        }
        return msg
      }),
    )
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || []
          const existingIdx = reactions.findIndex((r) => r.user === 'customer')
          if (existingIdx > -1) {
            // Replace reaction (one logic)
            const newReactions = [...reactions]
            newReactions[existingIdx] = { user: 'customer', emoji }
            return { ...msg, reactions: newReactions }
          }
          return {
            ...msg,
            reactions: [...reactions, { user: 'customer', emoji }],
          }
        }
        return msg
      }),
    )
  }

  return (
    <div className="MessengerTerminal flex h-[100dvh] flex-col overflow-hidden bg-slate-50 pb-20 md:pb-0 md:pt-20">
      <AnimatePresence mode="wait">
        {isHeroVisible ? (
          <motion.div
            key="hero"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <ChatHeader
              onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
              isGalleryOpen={isGalleryOpen}
            />
            <div className="relative flex flex-1 items-center justify-center overflow-hidden border-t border-slate-100 bg-white p-6 shadow-2xl md:rounded-t-[48px]">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
                  <p className="text-xs font-black uppercase tracking-widest">Waking up terminal...</p>
                </div>
              ) : (
                <HeroSection onStart={() => setIsHeroVisible(false)} />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <ChatHeader
              onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
              isGalleryOpen={isGalleryOpen}
            />

            <main className="relative flex h-full flex-1 overflow-hidden border-t border-slate-100 bg-white shadow-2xl md:rounded-t-[48px]">
              <div className="relative flex h-full min-w-0 flex-[2] flex-col overflow-hidden border-r border-slate-50">
                <MessageList
                  messages={messages}
                  onReact={handleReaction}
                  onReply={setActiveReplyTo}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  isLoading={isLoading}
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
                    className="hidden h-full overflow-hidden bg-slate-50/10 lg:block"
                  >
                    <GalleryView
                      messages={messages}
                      onClose={() => setIsGalleryOpen(false)}
                    />
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
            className="fixed inset-0 z-50 bg-white lg:hidden"
          >
            <GalleryView
              messages={messages}
              onClose={() => setIsGalleryOpen(false)}
              isMobile
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Portal Root for high-fidelity interaction nodes */}
      <div
        id="messenger-portal-root"
        className="pointer-events-none fixed inset-0 z-[9999]"
      />
    </div>
  )
}

export default MessengerPage
