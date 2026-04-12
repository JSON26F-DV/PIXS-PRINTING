import React from 'react'
import { type LucideIcon } from 'lucide-react'
import AnimatedNumber from './animations/AnimatedNumber'

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ')

interface StatCardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  trend?: number
  icon: LucideIcon
  className?: string
  variant?: 'dark' | 'emerald' | 'light'
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  icon: Icon,
  className,
  variant = 'light',
}) => {
  const isDark = variant === 'dark' || variant === 'emerald'
  const bgClass =
    variant === 'dark'
      ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-2xl shadow-slate-900/20 text-white'
      : variant === 'emerald'
        ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-none shadow-2xl shadow-emerald-500/20 text-white'
        : 'bg-white border border-slate-100 shadow-xl shadow-slate-200/40 text-slate-900'

  const textMuted =
    variant === 'dark'
      ? 'text-slate-400'
      : variant === 'emerald'
        ? 'text-emerald-50'
        : 'text-slate-500'

  const prefixColor =
    variant === 'dark'
      ? 'text-slate-500'
      : variant === 'emerald'
        ? 'text-emerald-100'
        : 'text-slate-400'

  const trendBg =
    variant === 'dark'
      ? 'bg-white/10 text-emerald-400'
      : variant === 'emerald'
        ? 'bg-white/20 text-white'
        : 'bg-emerald-50 text-emerald-600'

  return (
    <div
      className={cn(
        'group relative h-full min-h-[160px] overflow-hidden rounded-[24px] p-6 transition-all hover:-translate-y-1',
        bgClass,
        className,
      )}
    >
      <div
        className={cn(
          'absolute -top-4 -right-4 p-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12',
          isDark ? 'opacity-10' : 'opacity-5',
        )}
      >
        <Icon
          className={cn('h-32 w-32', isDark ? 'text-white' : 'text-slate-900')}
        />
      </div>
      <p
        className={cn(
          'relative z-10 mb-3 text-xs font-bold tracking-widest uppercase',
          textMuted,
        )}
      >
        {title}
      </p>
      <div className="relative z-10 flex items-baseline gap-1">
        {typeof value === 'number' && (
          <span className={cn('text-2xl font-bold', prefixColor)}>
            {prefix}
          </span>
        )}

        {typeof value === 'number' ? (
          <AnimatedNumber
            value={value}
            className="text-4xl font-black tracking-tighter"
          />
        ) : (
          <span className="line-clamp-1 text-2xl font-black tracking-tight">
            {value}
          </span>
        )}

        {typeof value === 'number' && (
          <span className={cn('text-sm font-bold', prefixColor)}>{suffix}</span>
        )}
      </div>
      {trend !== undefined && (
        <div
          className={cn(
            'relative z-10 mt-5 flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md',
            trendBg,
          )}
        >
          <span>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% compared to last week
          </span>
        </div>
      )}
    </div>
  )
}

export default StatCard
