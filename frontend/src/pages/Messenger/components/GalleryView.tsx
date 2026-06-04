import React from 'react'
import { createPortal } from 'react-dom'
import { m } from 'framer-motion'
import {
  X,
  Image as ImageIcon,
  FileText,
  Download,
  ExternalLink,
  Trash2,
} from 'lucide-react'

import { format } from 'date-fns'
import FullscreenGalleryModal from '../../../components/common/FullscreenGalleryModal'
import type { IMessage } from '../MessengerPage.tsx'

interface GalleryViewProps {
  messages: IMessage[]
  onClose: () => void
  isMobile?: boolean
  onDeleteMedia?: (messageId: string, filename: string) => void
}

const GalleryView: React.FC<GalleryViewProps> = ({
  messages,
  onClose,
  isMobile,
  onDeleteMedia,
}) => {
  const [fullscreenOpen, setFullscreenOpen] = React.useState(false)
  const [fullscreenIndex, setFullscreenIndex] = React.useState(0)
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth)
  const portalRoot = typeof document !== 'undefined' ? document.body : null

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isSmallMobile = windowWidth <= 430
  const showProtocol = !isMobile || (isMobile && !isSmallMobile)

  // Extract all attachments across all messages

  const allAttachments = messages
    .filter((msg) => !msg.isDeleted)
    .flatMap((msg) =>
      (msg.attachments || []).map((at) => ({
        ...at,
        timestamp: msg.timestamp,
        messageId: msg.id,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

  const images = allAttachments.filter((at) => at.type === 'image')
  const files = allAttachments.filter((at) => at.type === 'file')

  const getAssetUrl = (at: { type: string, name: string, url: string }) => {
    if (at.url.startsWith('blob:') || at.url.startsWith('http')) return at.url;
    return at.type === 'image' 
        ? `/src/assets/message_media/${at.name}` 
        : `/src/assets/message_document/${at.name}`;
  }

  return (
    <div className="GalleryView flex h-full flex-col bg-white lg:bg-transparent">
      <div className="flex items-center justify-between border-b border-slate-100 p-6 md:p-8">
        <div className="space-y-1">
          <h2 className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
            Shared Assets
          </h2>
          <p className="text-[9px] leading-none font-bold tracking-widest text-slate-400 uppercase">
            Production Gallery Hub
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:text-slate-900"
        >
          <X size={18} />
        </button>
      </div>

      <div className="no-scrollbar flex-1 space-y-10 overflow-y-auto p-6 md:p-8">
        {/* Images Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              <ImageIcon size={14} /> Media ({images.length})
            </h3>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-[18px] border border-slate-200/50 bg-slate-100"
                  onClick={() => {
                    setFullscreenIndex(i)
                    setFullscreenOpen(true)
                  }}
                >
                  <img
                    src={getAssetUrl(img)}
                    alt={img.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <ExternalLink size={20} className="text-white" />
                  </div>

                  {onDeleteMedia && (
                    <button
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this media permanently?')) {
                          onDeleteMedia(img.messageId, img.name)
                        }
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </m.div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border-2 border-dashed border-slate-50 bg-slate-50/20 py-10 text-center">
              <p className="text-[9px] font-black tracking-[3px] text-slate-300 uppercase">
                No image yet
              </p>
            </div>
          )}
        </section>

        {/* Files List */}
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
            <FileText size={14} /> Documents ({files.length})
          </h3>

          {files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex cursor-pointer items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-900/10">
                      <FileText size={18} className="text-pixs-mint" />
                    </div>
                    <div className="max-w-[120px] truncate">
                      <p className="truncate text-[10px] leading-none font-black text-slate-900 uppercase italic">
                        {file.name}
                      </p>
                      <p className="mt-1.5 text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                        {format(new Date(file.timestamp), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onDeleteMedia && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm('Delete this document permanently?')) {
                            onDeleteMedia(file.messageId, file.name)
                          }
                        }}
                        className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <a
                      href={getAssetUrl(file)}
                      download={file.name}
                      className="block p-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download
                        size={16}
                        className="text-slate-300 transition-colors group-hover:text-slate-900"
                      />
                    </a>
                  </div>
                </m.div>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border-2 border-dashed border-slate-50 bg-slate-50/20 py-10 text-center">
              <p className="text-[9px] font-black tracking-[3px] text-slate-300 uppercase">
                Zero Specification Nodes Identified
              </p>
            </div>
          )}
        </section>
      </div>

      {showProtocol && (
        <div className="border-t border-slate-50 bg-slate-50/10 p-8">
          <div className="space-y-3 rounded-[24px] bg-slate-900 p-5 text-white">
            <p className="text-pixs-mint text-[10px] leading-none font-black tracking-widest uppercase italic">
              Production Protocol
            </p>
            <p className="text-[10px] leading-relaxed font-bold tracking-widest text-slate-400 uppercase italic">
              All assets shared in this channel are archived for quality
              assurance.
            </p>
          </div>
        </div>
      )}

      {fullscreenOpen && portalRoot && 
        createPortal(
          <FullscreenGalleryModal
            isOpen={fullscreenOpen}
            onClose={() => setFullscreenOpen(false)}
            images={images.map((img) => getAssetUrl(img))}
            initialIndex={fullscreenIndex}
            productName="Production Assets"
          />,
          portalRoot
        )
      }
    </div>
  )
}

export default GalleryView
