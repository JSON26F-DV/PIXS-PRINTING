'use no memo';
import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Eye } from 'lucide-react';

export interface PayrollRecord {
  id: string;
  name: string;
  role: string;
  profile_picture: string;
  daily_rate: number;
  ot_rate: number;
  attendance_days: number;
  overtime_hours: number;
  gross_pay: number;
  status: 'Paid' | 'Unpaid';
}

interface PayrollTableProps {
  data: PayrollRecord[];
  onUpdate: (id: string, field: keyof PayrollRecord, value: string | number) => void;
  onViewDetails: (record: PayrollRecord) => void;
}

const columnHelper = createColumnHelper<PayrollRecord>();

const PayrollTable: React.FC<PayrollTableProps> = ({ data, onUpdate, onViewDetails }) => {
  const columns = useMemo(() => [
    columnHelper.accessor('profile_picture', {
      header: 'Profile',
      cell: info => (
        <img 
          src={info.getValue()} 
          alt="Avatar" 
          className="w-10 h-10 rounded-2xl object-cover border border-slate-100 shadow-sm"
        />
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{info.getValue()}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{info.row.original.id}</span>
        </div>
      ),
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => (
        <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-100">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('daily_rate', {
      header: 'Daily Rate',
      cell: info => (
        <div className="relative w-24">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">₱</span>
          <input 
            type="number"
            value={info.getValue()}
            onChange={(e) => onUpdate(info.row.original.id, 'daily_rate', parseFloat(e.target.value) || 0)}
            className="w-full pl-6 pr-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-mono font-black focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none"
          />
        </div>
      ),
    }),
    columnHelper.accessor('ot_rate', {
      header: 'OT Rate',
      cell: info => (
        <div className="relative w-24">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">₱</span>
          <input 
            type="number"
            value={info.getValue()}
            onChange={(e) => onUpdate(info.row.original.id, 'ot_rate', parseFloat(e.target.value) || 0)}
            className="w-full pl-6 pr-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-mono font-black focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none"
          />
        </div>
      ),
    }),
    columnHelper.accessor('attendance_days', {
      header: 'Days',
      cell: info => (
        <input 
          type="number"
          min="0"
          max="31"
          value={info.getValue()}
          onChange={(e) => {
            const val = Math.min(31, Math.max(0, parseInt(e.target.value) || 0));
            onUpdate(info.row.original.id, 'attendance_days', val);
          }}
          className="w-16 px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-mono font-black text-center focus:ring-2 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
        />
      ),
    }),
    columnHelper.accessor('overtime_hours', {
      header: 'OT Hrs',
      cell: info => (
        <input 
          type="number"
          min="0"
          max="200"
          value={info.getValue()}
          onChange={(e) => {
            const val = Math.min(200, Math.max(0, parseFloat(e.target.value) || 0));
            onUpdate(info.row.original.id, 'overtime_hours', val);
          }}
          className="w-16 px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-mono font-black text-center focus:ring-2 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
        />
      ),
    }),
    columnHelper.accessor('gross_pay', {
      header: 'Gross Pay',
      cell: info => (
        <span className="font-black text-slate-900 text-sm">
          ₱{info.getValue().toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${
          info.getValue() === 'Paid' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: info => (
        <button 
          onClick={() => onViewDetails(info.row.original)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-[#75EEA5] hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95"
        >
          <Eye size={14} />
          Details
        </button>
      ),
    }),
  ], [onUpdate, onViewDetails]);

  const options = useMemo(() => ({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  }), [data, columns]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable(options);

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] shadow-lg shadow-slate-200/50 overflow-hidden payroll-table-container">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Employee Payroll Matrix</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Unified salary distribution ledger</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-slate-50/50 border-b border-slate-100">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                {row.getVisibleCells().map(cell => (
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
  );
};

export default PayrollTable;
