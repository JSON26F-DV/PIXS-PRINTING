/**
 * MessageImageGrid
 *
 * Magazine-style mosaic image grid used in:
 * - AdminControlModal (quick preview of conversation images)
 * - MessageBubble (image attachments on card-type messages)
 *
 * Layout rules:
 *  1 image  → full-width single
 *  2 images → two equal columns
 *  3 images → 1 large left + 2 stacked right
 *  4 images → 2×2 equal grid
 *  5 images → 1 large left (2 rows) + 4 smalls right (2×2)
 *  6+ images → magazine mosaic:
 *    ┌──────┬──────┐
 *    │      │  2   │
 *    │  1   ├──┬──┤
 *    │      │3 │4 │
 *    ├──┬───┴──┤  │
 *    │5 │  6   │  │  (actually per the spec below)
 *    └──┴──────┴──┘
 *
 *  The exact magazine layout requested:
 *    1st 1st 2nd 2nd
 *    1st 1st 2nd 2nd
 *    1st 1st 3rd 4th
 *    1st 1st 5th 6th
 *
 *  Implemented as a CSS grid-area approach on a 4-col × 4-row grid.
 */

import React from 'react'
import { ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

interface MessageImageGridProps {
  /** Array of resolved image URLs to display */
  images: string[]
  /** Called with the index of the clicked image */
  onImageClick: (index: number) => void
  /** Extra class on the outer wrapper */
  className?: string
  /** Max images to show (default 6) */
  maxVisible?: number
}

const MessageImageGrid: React.FC<MessageImageGridProps> = ({
  images,
  onImageClick,
  className,
  maxVisible = 6,
}) => {
  if (images.length === 0) return null

  const visible = images.slice(0, maxVisible)
  const overflow = images.length - maxVisible

  // Single image
  if (visible.length === 1) {
    return (
      <div className={clsx('w-full', className)}>
        <GridCell url={visible[0]} index={0} onClick={onImageClick} className="aspect-video w-full" />
      </div>
    )
  }

  // 2 images — equal columns
  if (visible.length === 2) {
    return (
      <div className={clsx('grid grid-cols-2 gap-1 rounded-[20px] overflow-hidden', className)}>
        {visible.map((url, i) => (
          <GridCell key={i} url={url} index={i} onClick={onImageClick} className="aspect-square" />
        ))}
      </div>
    )
  }

  // 3 images — large left + 2 stacked right
  if (visible.length === 3) {
    return (
      <div className={clsx('grid grid-cols-2 gap-1 rounded-[20px] overflow-hidden', className)} style={{ height: 240 }}>
        <GridCell url={visible[0]} index={0} onClick={onImageClick} className="h-full" />
        <div className="flex flex-col gap-1 h-full">
          <GridCell url={visible[1]} index={1} onClick={onImageClick} className="flex-1" />
          <GridCell url={visible[2]} index={2} onClick={onImageClick} className="flex-1" />
        </div>
      </div>
    )
  }

  // 4 images — 2×2 equal
  if (visible.length === 4) {
    return (
      <div className={clsx('grid grid-cols-2 gap-1 rounded-[20px] overflow-hidden', className)}>
        {visible.map((url, i) => (
          <GridCell key={i} url={url} index={i} onClick={onImageClick} className="aspect-square" />
        ))}
      </div>
    )
  }

  // 5 images — large left (row-span 2) + 4 small right (2×2)
  if (visible.length === 5) {
    return (
      <div
        className={clsx('grid grid-cols-2 gap-1 rounded-[20px] overflow-hidden', className)}
        style={{ height: 240 }}
      >
        <GridCell url={visible[0]} index={0} onClick={onImageClick} className="h-full row-span-2" />
        <div className="grid grid-cols-2 gap-1 h-full col-start-2">
          {visible.slice(1).map((url, i) => (
            <GridCell key={i + 1} url={url} index={i + 1} onClick={onImageClick} className="aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  // 6+ images — Magazine mosaic:
  //   col: [0]  [1]  [2]  [3]
  // row 0: 1st  1st  2nd  2nd
  // row 1: 1st  1st  2nd  2nd
  // row 2: 1st  1st  3rd  4th
  // row 3: 1st  1st  5th  6th
  return (
    <div
      className={clsx('rounded-[20px] overflow-hidden', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: 4,
        height: 280,
      }}
    >
      {/* 1st — cols 0-1, rows 0-3 (full left half) */}
      <GridCell
        url={visible[0]}
        index={0}
        onClick={onImageClick}
        className="h-full w-full"
        style={{ gridColumn: '1 / 3', gridRow: '1 / 5' }}
      />
      {/* 2nd — cols 2-3, rows 0-1 */}
      <GridCell
        url={visible[1]}
        index={1}
        onClick={onImageClick}
        className="h-full w-full"
        style={{ gridColumn: '3 / 5', gridRow: '1 / 3' }}
      />
      {/* 3rd — col 2, row 2 */}
      <GridCell
        url={visible[2]}
        index={2}
        onClick={onImageClick}
        className="h-full w-full"
        style={{ gridColumn: '3 / 4', gridRow: '3 / 4' }}
      />
      {/* 4th — col 3, row 2 */}
      <GridCell
        url={visible[3]}
        index={3}
        onClick={onImageClick}
        className="h-full w-full"
        style={{ gridColumn: '4 / 5', gridRow: '3 / 4' }}
      />
      {/* 5th — col 2, row 3 */}
      <GridCell
        url={visible[4]}
        index={4}
        onClick={onImageClick}
        className="h-full w-full"
        style={{ gridColumn: '3 / 4', gridRow: '4 / 5' }}
      />
      {/* 6th — col 3, row 3 — may show overflow badge */}
      <GridCell
        url={visible[5]}
        index={5}
        onClick={onImageClick}
        className="h-full w-full"
        style={{ gridColumn: '4 / 5', gridRow: '4 / 5' }}
        overflowCount={overflow > 0 ? overflow : undefined}
      />
    </div>
  )
}

// ─── Internal Cell Component ─────────────────────────────────────────────────

interface GridCellProps {
  url: string
  index: number
  onClick: (index: number) => void
  className?: string
  style?: React.CSSProperties
  overflowCount?: number
}

const GridCell: React.FC<GridCellProps> = ({
  url,
  index,
  onClick,
  className,
  style,
  overflowCount,
}) => (
  <div
    className={clsx(
      'group relative cursor-pointer overflow-hidden bg-slate-100',
      className,
    )}
    style={style}
    onClick={() => onClick(index)}
  >
    <img
      src={url}
      alt=""
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      loading="lazy"
    />
    {/* Hover overlay */}
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
      {overflowCount !== undefined ? (
        <span className="text-2xl font-black text-white">+{overflowCount}</span>
      ) : (
        <ExternalLink size={20} className="text-white drop-shadow" />
      )}
    </div>
  </div>
)

export default MessageImageGrid
