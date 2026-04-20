import React from 'react'
import cubeIcon from '@/assets/icons/cube.svg'
import { clsx } from 'clsx'

interface BoxFallbackProps {
  className?: string
  iconClassName?: string
}

const BoxFallback: React.FC<BoxFallbackProps> = ({ 
  className = "flex h-full w-full items-center justify-center bg-slate-50",
  iconClassName = "h-16 w-16 opacity-50"
}) => (
  <div className={clsx(className)}>
    <img
      src={cubeIcon}
      alt=""
      className={clsx(iconClassName)}
      loading="lazy"
      draggable={false}
    />
  </div>
)

export default BoxFallback
