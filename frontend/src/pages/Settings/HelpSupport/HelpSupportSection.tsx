import React, { useState } from 'react'
import {
  FiHelpCircle,
  FiSend,
  FiChevronDown,
  FiChevronUp,
  FiMessageSquare,
} from 'react-icons/fi'
import { AnimatePresence, motion } from 'framer-motion'
import axiosInstance from '../../../lib/axiosInstance'
import toast from 'react-hot-toast'

interface FAQ {
  id: string
  question: string
  answer: string
}

const FAQS: FAQ[] = [
  {
    id: 'faq1',
    question: 'How long does printing take?',
    answer:
      'Standard orders are processed within 3–5 business days. Rush orders may be available — contact us for availability.',
  },
  {
    id: 'faq2',
    question: 'What file formats do you accept?',
    answer:
      'We accept PDF, AI, PSD, PNG, and SVG. For best results, submit print-ready files at 300 DPI or higher.',
  },
  {
    id: 'faq3',
    question: 'What is the minimum order quantity?',
    answer:
      'Minimum order quantities vary per product. Most products start at 50–100 pcs. Check each product page for details.',
  },
  {
    id: 'faq4',
    question: 'Do you offer delivery and shipping?',
    answer:
      'Yes! We ship nationwide via partner couriers. Free delivery is available for orders above ₱5,000 in Metro Manila.',
  },
]

const FAQItem: React.FC<{ faq: FAQ }> = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-[16px] border border-slate-100 bg-white transition-all hover:border-slate-200">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-black tracking-tight text-slate-800 italic">
          {faq.question}
        </span>
        {isOpen ? (
          <FiChevronUp size={16} className="shrink-0 text-slate-400" />
        ) : (
          <FiChevronDown size={16} className="shrink-0 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="border-t border-slate-50 px-5 pt-3 pb-4 text-xs leading-relaxed font-bold text-slate-500">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const HelpSupportSection: React.FC = () => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendMessage = async () => {
    if (message.length < 10) {
      toast.error('Message must be at least 10 characters')
      return
    }

    try {
      setIsSending(true)
      const response = await axiosInstance.post('/api/messages/send', {
        message,
        receiver_id: 'EMP-001',
        receiver_type: 'employee',
      })
      toast.success(response.data.message)
      setMessage('')
    } catch {
      toast.error('Transmission failed')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="SettingsHelpSupport space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
          Help & Support
        </h2>
        <p className="text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
          FAQ, contact & assistance nodes
        </p>
      </div>

      {/* Contact Form */}
      <div className="space-y-4 rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
            <FiMessageSquare className="text-pixs-mint" size={16} />
          </div>
          <div>
            <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
              Send a Message
            </p>
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              We respond within 24hrs
            </p>
          </div>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          disabled={isSending}
          placeholder="Describe your issue or question..."
          className="focus:border-pixs-mint w-full resize-none rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-800 italic placeholder-slate-300 transition-colors focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          disabled={isSending}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSending ? (
            'Transmitting...'
          ) : (
            <>
              <FiSend size={13} />
              Send Message
            </>
          )}
        </button>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
          <FiHelpCircle size={12} /> Frequently Asked Questions
        </p>
        {FAQS.map((faq) => (
          <FAQItem key={faq.id} faq={faq} />
        ))}
      </div>
    </section>
  )
}

export default HelpSupportSection
