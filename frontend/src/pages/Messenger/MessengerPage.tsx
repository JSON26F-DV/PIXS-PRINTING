import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'

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
  attachments?: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[]
  reactions?: { user: string; emoji: string }[]
  isEdited?: boolean
  originalText?: string
  isDeleted?: boolean
  replyTo?: { id: string; text: string; senderName: string }
  senderId?: string
  receiverId?: string
}

interface ApiMessage {
  id: string;
  sender_type: 'customer' | 'employee';
  message: string;
  created_at: string;
  sender_id?: string;
  receiver_id?: string;
  attachments?: { type: 'image' | 'file'; url: string; name: string }[];
}

const MessengerPage: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<IMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
            receiverId: m.receiver_id
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
    } else {
      setIsLoading(false)
    }
  }, [user])

  const [isHeroVisible, setIsHeroVisible] = useState(() => {
    return localStorage.getItem('pixs_messenger_hero_seen') !== 'true'
  })

  const handleStartHero = () => {
    localStorage.setItem('pixs_messenger_hero_seen', 'true')
    setIsHeroVisible(false)
  }

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
    attachments: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[] = [],
  ) => {
    const tempId = `msg_${Date.now()}`
    const newMessage: IMessage = {
      id: tempId,
      sender: 'customer',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
      attachments: attachments.map(a => ({ type: a.type, url: a.url, name: a.name })), // Safe for saving in state without non-serializable File object
      reactions: [],
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
      
      const receiverId = user.account_type === 'employee' 
        ? (activeReplyTo?.senderId || '1') 
        : '1';
      const receiverType = user.account_type === 'employee'
        ? 'customer'
        : 'employee';

      formData.append('receiver_id', receiverId)
      formData.append('receiver_type', receiverType)

      attachments.forEach((att, index) => {
        formData.append(`attachments[${index}][name]`, att.name)
        formData.append(`attachments[${index}][type]`, att.type)
        formData.append(`attachments[${index}][url]`, att.url)
        if (att.fileObj) {
          formData.append(`attachments[${index}][file]`, att.fileObj)
        }
      })

      await axiosInstance.post('/api/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
        ) : (
          <div className="flex flex-1 flex-col">
            {/* Header Fixed Logic */}
            <div className="fixed top-0 left-0 z-40 w-full md:top-20">
              <ChatHeader
                onToggleGallery={() => setIsGalleryOpen(!isGalleryOpen)}
                isGalleryOpen={isGalleryOpen}
              />
            </div>

            <main className="relative flex flex-1 overflow-hidden pt-[80px] pb-[196px] md:pt-[176px] md:pb-[116px]">
              <div className="flex flex-1 flex-col">
                <MessageList
                  messages={messages}
                  onReact={handleReaction}
                  onReply={setActiveReplyTo}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  isLoading={isLoading}
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
              />
            </div>
          </div>
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

      <div
        id="messenger-portal-root"
        className="pointer-events-none fixed inset-0 z-[9999]"
      />
    </div>
  )
}

export default MessengerPage
