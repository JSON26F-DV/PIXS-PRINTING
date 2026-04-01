import React, { useRef, useEffect, useState } from 'react';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, MoreHorizontal, CheckCheck, Edit2, Trash2, CornerUpRight, History, Plus, FileText, Download, ExternalLink } from 'lucide-react';

import { clsx } from 'clsx';
import { format } from 'date-fns';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

import type { IMessage } from '../MessengerPage.tsx';

interface MessageListProps {
  messages: IMessage[];
  onReact: (messageId: string, emoji: string) => void;
  onReply: (msg: IMessage) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface PortalProps {
  children: React.ReactNode;
}

const MessagePortal: React.FC<PortalProps> = ({ children }) => {
  const mount = document.getElementById('messenger-portal-root');
  if (!mount) return null;
  return createPortal(children, mount);
};

const QuickReactBar: React.FC<{ 
  onSelect: (emoji: string) => void; 
  onShowMore: () => void;
  isCustomer: boolean;
  anchorRect: DOMRect | null;
}> = ({ onSelect, onShowMore, isCustomer, anchorRect }) => {
  if (!anchorRect) return null;

  return (
    <MessagePortal>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        style={{
          position: 'fixed',
          top: anchorRect.top - 60,
          left: isCustomer ? anchorRect.right - 280 : anchorRect.left,
          zIndex: 9999,
        }}
        className={clsx(
          "bg-white border border-slate-100 rounded-full shadow-2xl p-1.5 flex items-center gap-1 pointer-events-auto",
          isCustomer ? "origin-right" : "origin-left"
        )}
      >
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 transition-transform active:scale-95 bubble-emoji"
          >
            {emoji}
          </button>
        ))}
        <div className="w-px h-6 bg-slate-100 mx-1" />
        <button
          onClick={onShowMore}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <Plus size={20} />
        </button>
      </motion.div>
    </MessagePortal>
  );
};

const MessageBubble: React.FC<{ 
  message: IMessage; 
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
}> = ({ message, onReact, onReply, onEdit, onDelete }) => {

  const [showQuickBar, setShowQuickBar] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showOriginal, setShowOriginal] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const isCustomer = message.sender === 'customer';

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -100 || info.offset.x > 100) onReply();
      }}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={clsx(
        "flex flex-col mb-8 group cursor-default relative",
        isCustomer ? "items-end" : "items-start"
      )}
    >
      <div className={clsx(
        "max-w-[85%] md:max-w-[70%] relative flex flex-col",
        isCustomer ? "items-end" : "items-start"
      )}>

        {/* Reply Snippet Node */}
        {message.replyTo && (
           <div className={clsx(
             "mb-2 flex items-center gap-2 opacity-40 px-3 py-1.5 border-l-2 border-slate-300",
             isCustomer ? "flex-row-reverse text-right mr-3" : "ml-3"
           )}>
              <CornerUpRight size={12} />
              <div className="overflow-hidden">
                 <p className="text-[8px] font-black uppercase tracking-widest">{message.replyTo.senderName}</p>
                 <p className="text-[10px] font-bold truncate italic">{message.replyTo.text}</p>
              </div>
           </div>
        )}

        {/* Message Container */}
        <div className={clsx(
          "px-6 py-4 rounded-[28px] text-sm font-bold leading-relaxed shadow-sm transition-all relative",
          message.isDeleted ? "bg-slate-100 text-slate-400 border border-slate-200" :
          isCustomer 
            ? "bg-slate-900 text-white rounded-tr-[4px] shadow-slate-900/10" 
            : "bg-white border border-slate-100 text-slate-800 rounded-tl-[4px] shadow-slate-100/50"
        )}>
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="bg-slate-800 text-white rounded-xl p-4 focus:outline-none text-xs leading-relaxed resize-none custom-scrollbar"
                rows={3}
                autoFocus
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="text-[9px] uppercase font-black px-3 py-1 hover:bg-slate-700 rounded-lg">Cancel</button>
                <button onClick={handleEditSubmit} className="text-[9px] uppercase font-black px-3 py-1 bg-pixs-mint text-slate-900 rounded-lg">Save</button>
              </div>
            </div>
          ) : (
            <>
              {message.text}
              
              {message.isEdited && !message.isDeleted && (
                <span 
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="ml-2 text-[9px] font-black uppercase tracking-widest text-pixs-mint opacity-60 cursor-pointer hover:opacity-100 italic"
                >
                  (Edited)
                </span>
              )}
            </>
          )}

          <AnimatePresence>
            {showOriginal && message.originalText && (
               <motion.div
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="mt-3 pt-3 border-t border-white/10 text-[11px] text-slate-400 italic blur-[0.4px] hover:blur-none transition-all leading-tight bg-white/5 p-3 rounded-xl"
               >
                  <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                     <History size={10} />
                     <span className="text-[8px] font-black uppercase tracking-widest">Original Node Projection</span>
                  </div>
                  {message.originalText}
               </motion.div>
            )}
          </AnimatePresence>
          
          <div className={clsx(
            "mt-2 text-[8px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1",
            isCustomer ? "justify-end text-white" : "justify-start text-slate-400"
          )}>
            {format(new Date(message.timestamp), 'HH:mm')}
            {isCustomer && <CheckCheck size={10} className="text-pixs-mint" />}
          </div>
        </div>

        {/* Fulfillment Asset Node: Images & Documents */}
        {message.attachments && message.attachments.length > 0 && !message.isDeleted && (
          <div className={clsx(
            "mt-3 flex flex-col gap-3 w-full",
            isCustomer ? "items-end" : "items-start"
          )}>
            {message.attachments.map((at, idx) => (
              <div key={idx} className="max-w-full">
                {at.type === 'image' ? (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="relative group rounded-[24px] overflow-hidden border border-slate-100 shadow-lg cursor-pointer bg-slate-50"
                    onClick={() => window.open(at.url, '_blank')}
                  >
                    <img src={at.url} alt={at.name} className="max-h-[300px] w-auto object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <ExternalLink size={24} className="text-white" />
                    </div>
                  </motion.div>
                ) : (
                  <a 
                    href={at.url} 
                    download={at.name}
                    className={clsx(
                      "flex items-center gap-4 p-4 rounded-[22px] border transition-all hover:scale-[1.02] active:scale-[0.98] group shadow-sm",
                      isCustomer 
                        ? "bg-slate-50 border-slate-200 text-slate-900 hover:border-pixs-mint/50" 
                        : "bg-white border-slate-100 text-slate-900 hover:border-pixs-mint/50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/10">
                       <FileText size={20} className="text-pixs-mint" />
                    </div>
                    <div className="min-w-0 pr-4">
                       <p className="text-[10px] font-black uppercase truncate italic leading-none">{at.name}</p>
                       <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                          Click to Download <Download size={10} className="text-pixs-mint" />
                       </p>
                    </div>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}


        {/* Reaction Display Node */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={clsx(
            "absolute -bottom-3 flex gap-1",
            isCustomer ? "right-2" : "left-2"
          )}>
            {Array.from(new Set(message.reactions.map(r => r.emoji))).map((emoji, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className="bg-white border border-slate-100 rounded-full px-2 py-1 shadow-sm flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => onReact(emoji)}
              >
                <span className="text-[14px] leading-none">{emoji}</span>
                <span className="text-[9px] font-black text-slate-900">
                   {message.reactions?.filter(r => r.emoji === emoji).length}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Advanced Action Terminal */}
        {!message.isDeleted && !isEditing && (
          <div className={clsx(
            "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5",
            isCustomer ? "-left-24 flex-row-reverse" : "-right-24"
          )}>
            <div className="relative" ref={anchorRef}>
              <button 
                onClick={(e) => {
                  setAnchorRect(e.currentTarget.getBoundingClientRect());
                  setShowQuickBar(!showQuickBar);
                }}
                className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all hover:scale-110"
              >
                <Smile size={18} />
              </button>

              
              <AnimatePresence>
                {showQuickBar && (
                  <>
                    <QuickReactBar 
                      isCustomer={isCustomer}
                      anchorRect={anchorRect}
                      onSelect={(emoji) => {
                        onReact(emoji);
                        setShowQuickBar(false);
                      }}
                      onShowMore={() => {
                        setShowQuickBar(false);
                        setShowFullPicker(true);
                      }}
                    />
                    <button onClick={() => setShowQuickBar(false)} className="fixed inset-0 z-[9998] pointer-events-auto bg-transparent border-none outline-none" />
                  </>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showFullPicker && anchorRect && (
                  <MessagePortal>
                    <div 
                      style={{
                        position: 'fixed',
                        top: Math.max(10, anchorRect.top - 450),
                        left: isCustomer ? Math.max(10, anchorRect.right - 350) : anchorRect.left,
                        zIndex: 9999,
                        pointerEvents: 'auto'
                      }}
                    >
                      <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-100">
                        <EmojiPicker 
                          onEmojiClick={(emoji: EmojiClickData) => {
                            onReact(emoji.emoji);
                            setShowFullPicker(false);
                          }}
                          theme={Theme.LIGHT}
                          skinTonesDisabled
                          searchDisabled
                        />
                      </div>
                      <button onClick={() => setShowFullPicker(false)} className="fixed inset-0 z-[-1] bg-transparent border-none outline-none" />
                    </div>
                  </MessagePortal>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={(e) => {
                  setAnchorRect(e.currentTarget.getBoundingClientRect());
                  setShowOptions(!showOptions);
                }}
                className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all hover:scale-110"
              >
                <MoreHorizontal size={18} />
              </button>


              <AnimatePresence>
                {showOptions && anchorRect && (
                  <MessagePortal>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      style={{
                        position: 'fixed',
                        top: Math.max(10, anchorRect.top - 160),
                        left: isCustomer ? anchorRect.right - 144 : anchorRect.right + 10,
                        zIndex: 9999,
                        pointerEvents: 'auto'
                      }}
                      className={clsx(
                        "bg-white border border-slate-100 rounded-2xl shadow-xl p-2 w-36",
                        isCustomer ? "origin-bottom-right" : "origin-bottom-left"
                      )}
                    >
                      <button 
                        onClick={() => { onReply(); setShowOptions(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors"
                      >
                        <CornerUpRight size={16} className="text-slate-400" /> Reply
                      </button>
                      {isCustomer && (
                        <button 
                          onClick={() => { setIsEditing(true); setShowOptions(false); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-700 transition-colors"
                        >
                          <Edit2 size={16} className="text-slate-400" /> Edit
                        </button>
                      )}
                      <button 
                        onClick={() => { onDelete(); setShowOptions(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} className="text-rose-400" /> Delete
                      </button>
                      <button onClick={() => setShowOptions(false)} className="fixed inset-0 z-[-1] bg-transparent border-none outline-none" />
                    </motion.div>
                  </MessagePortal>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onReact, 
  onReply, 
  onEdit, 
  onDelete 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom('auto');
    }
  }, [messages, isNearBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    
    const nearBottom = scrollBottom < 100;
    setIsNearBottom(nearBottom);
    setShowScrollDown(scrollTop > 200 && !nearBottom);
  };

  return (
    <div className="flex-1 relative flex flex-col overflow-hidden">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="MessageList flex-1 overflow-y-auto px-6 pt-8 pb-10 md:px-12 md:pt-12 md:pb-14 bg-slate-50/20 scroll-smooth no-scrollbar bg-emoji-pattern"
      >
        <div className="max-w-4xl mx-auto flex flex-col">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              onReact={(emoji) => onReact(msg.id, emoji)}
              onReply={() => onReply(msg)}
              onEdit={(text) => onEdit(msg.id, text)}
              onDelete={() => onDelete(msg.id)}
            />
          ))}
        </div>

      </div>

      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border border-slate-100 text-slate-900 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
          >
            <div className="relative">
              <Plus size={20} className="rotate-45 transition-transform group-hover:translate-y-0.5" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-pixs-mint rounded-full animate-pulse" />
            </div>
            <div className="absolute -top-10 bg-slate-900 text-[8px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Latest Fulfillment</div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageList;
