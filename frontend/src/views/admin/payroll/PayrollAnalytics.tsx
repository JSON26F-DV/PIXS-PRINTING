import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import {
  Landmark,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react'
import { type PayrollRecord } from './types'
import _ from 'lodash'

interface PayrollAnalyticsProps {
  data: PayrollRecord[]
  weekDates: string[]
}

const COLORS = [
  '#75EEA5',
  '#7C3AED',
  '#3B82F6',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#6366F1',
]

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl backdrop-blur-md">
        <p className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
          {label}
        </p>
        <p className="text-sm font-black text-[#75EEA5]">
          ₱{payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

const PayrollAnalytics: React.FC<PayrollAnalyticsProps> = ({
  data,
  weekDates,
}) => {
  const dailyCosts = weekDates.map((dateStr) => {
    const total = data.reduce((sum, r) => {
      const day = r.attendance.find((a) => a.date === dateStr)
      return sum + (day?.computed_salary || 0)
    }, 0)
    const dayName = new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
    })
    return { name: dayName, value: total }
  })

  const sortedData = _.orderBy(data, ['weekly_total'], ['desc'])
  const top5 = sortedData
    .slice(0, 5)
    .map((r) => ({ name: r.name, value: r.weekly_total }))
  const others = sortedData.slice(5).reduce((sum, r) => sum + r.weekly_total, 0)
  const pieData =
    others > 0 ? [...top5, { name: 'Others', value: others }] : top5

  return (
    <div className="PayrollAnalyticsContainer mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="PayrollAnalyticsCard group relative min-h-[400px] overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-slate-300/40">
        <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-700 group-hover:scale-110">
          <BarChart3 className="h-32 w-32 text-slate-900" />
        </div>
        <div className="relative z-10 mb-10 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[#75EEA5]">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tighter text-slate-900 uppercase">
              Temporal Fiscal Consumption
            </h3>
            <p className="text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
              Daily Aggregate Node Expenditure
            </p>
          </div>
        </div>
        <div className="relative z-10 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyCosts}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                dy={10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#f1f5f9', radius: 10 }}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 8, 8]}
                animationBegin={0}
                animationDuration={1500}
                barSize={32}
              >
                {dailyCosts.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="PayrollAnalyticsCard group relative min-h-[400px] overflow-hidden rounded-[32px] bg-slate-900 p-8 shadow-2xl shadow-slate-900/30 transition-all hover:shadow-slate-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform duration-700 group-hover:scale-110">
          <PieIcon className="h-32 w-32 text-white" />
        </div>
        <div className="relative z-10 mb-10 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#75EEA5]/10 text-[#75EEA5]">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tighter text-white uppercase">
              Unified Payload Distribution
            </h3>
            <p className="text-[10px] font-black tracking-[2px] text-slate-500 uppercase">
              Weighted Personnel Statistics
            </p>
          </div>
        </div>
        <div className="relative z-10 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={8}
                dataKey="value"
                animationDuration={1500}
                stroke="none"
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default PayrollAnalytics
