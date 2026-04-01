import React from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, FileText, Download, ExternalLink } from 'lucide-react';

import { format } from 'date-fns';
import FullscreenGalleryModal from '../../../components/common/FullscreenGalleryModal';
import type { IMessage } from '../MessengerPage.tsx';



interface GalleryViewProps {
  messages: IMessage[];
  onClose: () => void;
  isMobile?: boolean;
}

const GalleryView: React.FC<GalleryViewProps> = ({ messages, onClose, isMobile }) => {
  const [fullscreenOpen, setFullscreenOpen] = React.useState(false);
  const [fullscreenIndex, setFullscreenIndex] = React.useState(0);

  // Extract all attachments across all messages

  const allAttachments = messages.flatMap(msg => 
    (msg.attachments || []).map(at => ({ ...at, timestamp: msg.timestamp }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const images = allAttachments.filter(at => at.type === 'image');
  const files = allAttachments.filter(at => at.type === 'file');

  return (
    <div className="GalleryView h-full flex flex-col bg-white lg:bg-transparent">
      <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Shared Assets</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Production Gallery Hub</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-10">
        {/* Images Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon size={14} /> Media ({images.length})
            </h3>
          </div>
          
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group aspect-square rounded-[18px] bg-slate-100 overflow-hidden relative cursor-pointer border border-slate-200/50"
                  onClick={() => {
                    setFullscreenIndex(i);
                    setFullscreenOpen(true);
                  }}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />

                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ExternalLink size={20} className="text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-[28px] bg-slate-50/20">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[3px]">Zero Media Assets Identified</p>
            </div>
          )}
        </section>

        {/* Files List */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} /> Documents ({files.length})
          </h3>
          
          {files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file, i) => (
                <motion.div 
                   key={i}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100 group hover:border-slate-300 transition-all cursor-pointer"
                >
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                         <FileText size={18} className="text-pixs-mint" />
                      </div>
                      <div className="max-w-[120px] truncate">
                         <p className="text-[10px] font-black text-slate-900 uppercase truncate italic leading-none">{file.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{format(new Date(file.timestamp), 'MMM dd, yyyy')}</p>
                      </div>
                   </div>
                   <a 
                     href={file.url} 
                     download={file.name}
                     className="block"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <Download size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                   </a>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-[28px] bg-slate-50/20">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[3px]">Zero Specification Nodes Identified</p>
            </div>
          )}
        </section>
      </div>

      {!isMobile && (
        <div className="p-8 border-t border-slate-50 bg-slate-50/10">
           <div className="p-5 rounded-[24px] bg-slate-900 text-white space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest italic text-pixs-mint leading-none font-black italic">Production Protocol</p>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest italic">All assets shared in this channel are archived for quality assurance.</p>
           </div>
        </div>
      )}

      <FullscreenGalleryModal 
        isOpen={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        images={images.map(img => img.url)}
        initialIndex={fullscreenIndex}
        productName="Production Assets"
      />
    </div>

  );
};

export default GalleryView;
