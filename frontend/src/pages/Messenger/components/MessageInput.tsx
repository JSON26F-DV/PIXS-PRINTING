import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Image as ImageIcon, Send, X, CornerUpRight } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import type { IMessage } from '../MessengerPage.tsx';

interface MessageInputProps {
  onSend: (text: string, attachments?: { type: 'image' | 'file'; url: string; name: string }[]) => void;
  activeReplyTo: IMessage | null;
  onCancelReply: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSend, 
  activeReplyTo, 
  onCancelReply 
}) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSend(text.trim());
    setText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.success(`Uploading ${type}: ${file.name}`);
    
    const attachment = {
      type,
      url: type === 'image' ? URL.createObjectURL(file) : '#',
      name: file.name
    };

    onSend(`Sent a ${type}: ${file.name}`, [attachment]);
  };

  return (
    <div className="MessageInput bg-white/70 backdrop-blur-2xl border-t border-slate-100/50 flex-none relative z-10 w-full transition-all duration-300 ease-out">




      {/* Reply Context Node */}
      <AnimatePresence>
        {activeReplyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-50 bg-slate-50/50"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                     <CornerUpRight size={14} className="text-pixs-mint" />
                  </div>
                  <div className="overflow-hidden">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1.5">Replying to {activeReplyTo.senderName}</p>
                     <p className="text-xs font-bold text-slate-800 truncate italic">{activeReplyTo.text}</p>
                  </div>
               </div>
               <button 
                 onClick={onCancelReply}
                 className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
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
          className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4"
        >
          <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1.5 md:p-2 border border-slate-100 shadow-inner">
             <button 
               type="button"
               onClick={() => fileInputRef.current?.click()}
               className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-900 transition-all active:scale-90"
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
               className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-900 transition-all active:scale-90"
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

          <div className="flex-1 relative group h-14">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe your printing requirements..."
              className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-6 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all resize-none min-h-[56px] max-h-[150px] leading-relaxed shadow-inner"
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className={clsx(
              "w-14 h-14 md:w-16 md:h-14 flex items-center justify-center rounded-[20px] transition-all active:scale-95 shadow-xl",
              text.trim() 
                ? "bg-slate-900 text-pixs-mint shadow-slate-900/20 hover:scale-[1.05]" 
                : "bg-slate-100 text-slate-300 shadow-none grayscale cursor-not-allowed"
            )}
          >
            <Send size={24} className={clsx(text.trim() ? "translate-x-0.5 -translate-y-0.5" : "")} />
          </button>
        </form>
        
        <p className="text-center text-[8px] text-slate-300 font-black uppercase tracking-[3px] mt-4 opacity-40">
          PIXS INDUSTRIAL ENCRYPTED CHANNEL · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
