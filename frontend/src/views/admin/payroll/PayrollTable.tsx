'use no memo'
import React, { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import BoxFallback from '@/components/common/BoxFallback'
import { useState } from 'react'

export interface PayrollRecord {
  id: string
  name: string
  role: string
  profile_picture: string
  daily_rate: number
  ot_rate: number
  attendance_days: number
  overtime_hours: number
  gross_pay: number
  status: 'Paid' | 'Unpaid'
}

interface PayrollTableProps {
  data: PayrollRecord[]
  onUpdate: (
    id: string,
    field: keyof PayrollRecord,
    value: string | number,
  ) => void
  onViewDetails: (record: PayrollRecord) => void
}

const PayrollAvatar = ({ src, name }: { src: string; name: string }) => {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <BoxFallback
        className="h-10 w-10 rounded-2xl bg-slate-100"
        iconClassName="h-6 w-6 opacity-30"
      />
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className="h-10 w-10 rounded-2xl border border-slate-100 object-cover shadow-sm"
    />
  )
}

const columnHelper = createColumnHelper<PayrollRecord>()

const PayrollTable: React.FC<PayrollTableProps> = ({
  data,
  onUpdate,
  onViewDetails,
}) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('profile_picture', {
        header: 'Profile',
        cell: (info) => (
          <PayrollAvatar
            src={info.getValue()}
            name={info.row.original.name}
          />
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{info.getValue()}</span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              {info.row.original.id}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => (
          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black tracking-wider text-slate-600 uppercase">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('daily_rate', {
        header: 'Daily Rate',
        cell: (info) => (
          <div className="relative w-24">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              ₱
            </span>
            <input
              type="number"
              value={info.getValue()}
              onChange={(e) =>
                onUpdate(
                  info.row.original.id,
                  'daily_rate',
                  parseFloat(e.target.value) || 0,
                )
              }
              className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-1.5 pr-3 pl-6 font-mono text-xs font-black transition-all outline-none focus:border-blue-500/30 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        ),
      }),
      columnHelper.accessor('ot_rate', {
        header: 'OT Rate',
        cell: (info) => (
          <div className="relative w-24">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              ₱
            </span>
            <input
              type="number"
              value={info.getValue()}
              onChange={(e) =>
                onUpdate(
                  info.row.original.id,
                  'ot_rate',
                  parseFloat(e.target.value) || 0,
                )
              }
              className="w-full rounded-xl border border-slate-100 bg-slate-50/50 py-1.5 pr-3 pl-6 font-mono text-xs font-black transition-all outline-none focus:border-blue-500/30 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        ),
      }),
      columnHelper.accessor('attendance_days', {
        header: 'Days',
        cell: (info) => (
          <input
            type="number"
            min="0"
            max="31"
            value={info.getValue()}
            onChange={(e) => {
              const val = Math.min(
                31,
                Math.max(0, parseInt(e.target.value) || 0),
              )
              onUpdate(info.row.original.id, 'attendance_days', val)
            }}
            className="w-16 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-center font-mono text-xs font-black shadow-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        ),
      }),
      columnHelper.accessor('overtime_hours', {
        header: 'OT Hrs',
        cell: (info) => (
          <input
            type="number"
            min="0"
            max="200"
            value={info.getValue()}
            onChange={(e) => {
              const val = Math.min(
                200,
                Math.max(0, parseFloat(e.target.value) || 0),
              )
              onUpdate(info.row.original.id, 'overtime_hours', val)
            }}
            className="w-16 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-center font-mono text-xs font-black shadow-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/10"
          />
        ),
      }),
      columnHelper.accessor('gross_pay', {
        header: 'Gross Pay',
        cell: (info) => (
          <span className="text-sm font-black text-slate-900">
            ₱{info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <span
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase ${
              info.getValue() === 'Paid'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                : 'border-rose-100 bg-rose-50 text-rose-600'
            }`}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: (info) => (
          <button
            onClick={() => onViewDetails(info.row.original)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black text-[#75EEA5] uppercase shadow-lg transition-all hover:bg-slate-800 active:scale-95"
          >
            <Eye size={14} />
            Details
          </button>
        ),
      }),
    ],
    [onUpdate, onViewDetails],
  )

  const options = useMemo(
    () => ({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    }),
    [data, columns],
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable(options)

  return (
    <div className="payroll-table-container overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-lg shadow-slate-200/50">
      <div className="flex items-center justify-between border-b border-slate-50 p-8">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 uppercase">
            Employee Payroll Matrix
          </h3>
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Unified salary distribution ledger
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-100 bg-slate-50/50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-8 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group border-b border-slate-50 transition-colors hover:bg-slate-50/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-8 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PayrollTable
