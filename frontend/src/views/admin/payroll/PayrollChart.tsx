import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

interface PayrollChartProps {
  barData: { name: string; gross_pay: number }[]
  pieData: { name: string; value: number; color: string }[]
}

const PayrollChart: React.FC<PayrollChartProps> = ({ barData, pieData }) => {
  return (
    <div className="payroll-analytics-section mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50 lg:col-span-8">
        <h3 className="mb-8 text-lg font-bold text-slate-900">
          Gross Pay Distribution
        </h3>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                tickFormatter={(val) => `₱${val / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  boxShadow:
                    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="gross_pay" radius={[8, 8, 0, 0]} barSize={48}>
                {barData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? '#3b82f6' : '#cbd5e1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50 lg:col-span-4">
        <h3 className="mb-8 text-lg font-bold text-slate-900">
          Payout Fulfillment
        </h3>
        <div className="relative min-h-[220px] flex-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={6}
                dataKey="value"
                isAnimationActive={false}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 space-y-4">
          {pieData.map((status) => (
            <div
              key={status.name}
              className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3.5 w-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="text-sm font-semibold text-slate-600">
                  {status.name}
                </span>
              </div>
              <span className="text-base font-bold text-slate-900">
                {status.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PayrollChart
