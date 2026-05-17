import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip,
  Image as ImageIcon,
  Send,
  X,
  CornerUpRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import type { IMessage } from '../MessengerPage.tsx'

interface MessageInputProps {
  onSend: (
    text: string,
    attachments?: { type: 'image' | 'file'; url: string; name: string }[],
  ) => void
  activeReplyTo: IMessage | null
  onCancelReply: () => void
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  activeReplyTo,
  onCancelReply,
}) => {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return

    onSend(text.trim())
    setText('')
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'file' | 'image',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast.success(`Uploading ${type}: ${file.name}`)

    const attachment = {
      type,
      url: type === 'image' ? URL.createObjectURL(file) : '#',
      name: file.name,
    }

    onSend(`Sent a ${type}: ${file.name}`, [attachment])
  }

  return (
    <div className="MessageInput relative z-10 w-full flex-none border-t border-slate-100/50 bg-white/70 backdrop-blur-2xl transition-all duration-300 ease-out">
      {/* Reply Context Node */}
      <AnimatePresence>
        {activeReplyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-50 bg-slate-50/50"
          >
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <CornerUpRight size={14} className="text-pixs-mint" />
                </div>
                <div className="overflow-hidden">
                  <p className="mb-1.5 text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase">
                    Replying to {activeReplyTo.senderName}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-800 italic">
                    {activeReplyTo.text}
                  </p>
                </div>
              </div>
              <button
                onClick={onCancelReply}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-end gap-3 md:gap-4"
        >
          <div className="flex items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1.5 shadow-inner md:p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white hover:text-slate-900 active:scale-90"
              title="Attach Production Specs"
            >
              <Paperclip size={18} />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'file')}
              />
            </button>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white hover:text-slate-900 active:scale-90"
              title="Attach Design Template"
            >
              <ImageIcon size={18} />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
            </button>
          </div>

          <div className="group relative h-14 flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Type your message ..."
              className="max-h-[150px] min-h-[56px] w-full resize-none overflow-hidden whitespace-nowrap rounded-[24px] border border-slate-100 bg-slate-50 px-6 py-4 text-sm leading-relaxed font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className={clsx(
              'flex h-14 w-14 items-center justify-center rounded-[20px] shadow-xl transition-all active:scale-95 md:h-14 md:w-16',
              text.trim()
                ? 'text-pixs-mint bg-slate-900 shadow-slate-900/20 hover:scale-[1.05]'
                : 'cursor-not-allowed bg-slate-100 text-slate-300 shadow-none grayscale',
            )}
          >
            <Send
              size={24}
              className={clsx(
                text.trim() ? 'translate-x-0.5 -translate-y-0.5' : '',
              )}
            />
          </button>
        </form>

        <p className="mt-4 text-center text-[8px] font-black tracking-[3px] text-slate-300 uppercase opacity-40">
          PIXS INDUSTRIAL ENCRYPTED CHANNEL · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

export default MessageInput
