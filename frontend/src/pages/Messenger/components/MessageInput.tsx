import React, { useState, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Paperclip,
  Image as ImageIcon,
  Send,
  X,
  CornerUpRight,
  AlertTriangle,
} from 'lucide-react'
import debounce from 'lodash/debounce'
import type { IMessage } from '../MessengerPage.tsx'

// --- Upload Constraints ---
const IMAGE_MAX_SIZE_MB = 3
const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024 // 3MB
const DOC_MAX_SIZE_MB = 5
const DOC_MAX_SIZE_BYTES = DOC_MAX_SIZE_MB * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BLOCKED_VIDEO_TYPES = ['video/']
const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.csv', '.xls', '.xlsx']

interface MessageInputProps {
  onSend: (
    text: string,
    attachments?: { type: 'image' | 'file'; url: string; name: string; fileObj?: File }[],
  ) => void
  activeReplyTo: IMessage | null
  onCancelReply: () => void
  totalImageUploads?: number // current total uploaded images for this user
  isEmployee?: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  activeReplyTo,
  onCancelReply,
  totalImageUploads = 0,
  isEmployee = false,
}) => {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  // Handle responsive placeholder
  React.useEffect(() => {
    const checkMobile = debounce(() => setIsMobile(window.innerWidth < 768), 150)
    window.addEventListener('resize', checkMobile)
    return () => {
      window.removeEventListener('resize', checkMobile)
      checkMobile.cancel()
    }
  }, [])

  // Modal alert state
  const [alertModal, setAlertModal] = useState<{
    open: boolean
    title: string
    message: string
  }>({ open: false, title: '', message: '' })

  const showAlert = (title: string, message: string) => {
    setAlertModal({ open: true, title, message })
  }

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

    // Reset input so user can re-select same file
    e.target.value = ''

    // --- VIDEO BLOCK (applies to both image and file inputs) ---
    if (file.type.startsWith('video/') || BLOCKED_VIDEO_TYPES.some(v => file.type.startsWith(v))) {
      showAlert(
        'Video Upload Not Allowed',
        'Video files are not supported. Please upload images (JPEG, PNG, WebP) or documents (PDF, DOC, DOCX, CSV, XLS, XLSX) only.'
      )
      return
    }

    if (type === 'image') {
      // --- IMAGE VALIDATION ---
      // Check if it's actually an image type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showAlert(
          'Invalid Image Format',
          `Only JPEG, PNG, and WebP images are allowed. You tried to upload: ${file.type || 'unknown format'}.`
        )
        return
      }

      // Check image size (1MB–3MB max)
      if (file.size > IMAGE_MAX_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        showAlert(
          'Image Too Large',
          `Maximum image size is ${IMAGE_MAX_SIZE_MB}MB. Your file "${file.name}" is ${sizeMB}MB. Please compress or resize the image before uploading.`
        )
        return
      }

      // Check 20-image upload limit (Only for customers)
      if (!isEmployee && totalImageUploads >= 20) {
        showAlert(
          'Upload Limit Reached',
          'You have reached the maximum of 20 image uploads. Please wait for an admin to review and manage your uploads before sending more.'
        )
        // Also send an auto-notification message
        onSend('⚠️ I have reached the 20-image upload limit. Requesting admin assistance to manage my uploaded images. (Nag-exceed na ang limit sa pag-upload ng images, hintayin na ayusin ng admin ito.)')
        return
      }
    } else {
      // --- DOCUMENT VALIDATION ---
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
        showAlert(
          'Invalid Document Format',
          `Only PDF, DOC, DOCX, CSV, XLS, and XLSX documents are allowed. You tried to upload: "${file.name}".`
        )
        return
      }

      if (file.size > DOC_MAX_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
        showAlert(
          'Document Too Large',
          `Maximum document size is ${DOC_MAX_SIZE_MB}MB. Your file "${file.name}" is ${sizeMB}MB. Please reduce the file size before uploading.`
        )
        return
      }
    }

    const attachment = {
      type,
      url: type === 'image' ? URL.createObjectURL(file) : '#',
      name: file.name,
      fileObj: file
    }

    onSend(type === 'image' ? 'Sent an image' : 'Sent a file', [attachment])
  }

  return (
    <div className="MessageInput relative z-10 w-full flex-none border-t border-slate-100/50 bg-white/70 backdrop-blur-2xl transition-all duration-300 ease-out">
      
      {/* ─── Alert Modal ─── */}
      <AnimatePresence>
        {alertModal.open && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={() => setAlertModal({ ...alertModal, open: false })}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50">
                  <AlertTriangle size={24} className="text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black tracking-tight text-slate-900">
                    {alertModal.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {alertModal.message}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setAlertModal({ ...alertModal, open: false })}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-black tracking-widest text-white uppercase transition-all hover:bg-slate-800 active:scale-95"
                >
                  Got it
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Reply Context Node */}
      <AnimatePresence>
        {activeReplyTo && (
          <m.div
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
                    {activeReplyTo.isDeleted ? 'this message has been removed.' : activeReplyTo.text}
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
          </m.div>
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
                accept=".pdf,.doc,.docx,.csv,.xls,.xlsx"
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
                accept="image/jpeg,image/png,image/webp"
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
              placeholder={isMobile ? "Message" : "Type your message ..."}
              className="max-h-[150px] min-h-[56px] w-full resize-none overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50 px-6 py-4 text-sm leading-relaxed font-bold text-slate-700 shadow-inner transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:outline-none"
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className="group flex h-14 w-12 items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:grayscale"
          >
            <m.div
              whileHover={text.trim() ? { rotateX: 30, rotateY: -15, rotateZ: 10, scale: 1.1 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Send
                size={28}
                strokeWidth={2.5}
                style={{ color: text.trim() ? '#75eea5' : '#cbd5e1' }}
                className="drop-shadow-sm"
              />
            </m.div>
          </button>
        </form>
      </div>
    </div>
  )
}

export default MessageInput
