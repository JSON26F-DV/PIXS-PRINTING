import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Database,
  Activity,
  Calendar,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Search,
  Terminal,
  ClipboardCheck,
  ArrowRight,
  Shield,
  Trash2,
  Edit2,
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import debounce from 'lodash/debounce'

import StatCard from '../../components/StatCard'
import Pagination from '../../components/Pagination/Pagination'
import { getAuditLogs, getAuditLogStats, deleteAuditLog, bulkDeleteAuditLogs, updateAuditLog } from '../../api/audit-log.api'
import type { AuditLog, AuditLogStats, AuditLogFilters } from '../../types/audit-log.types'

const getActionBadgeProps = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
      return {
        bg: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
      }
    case 'update':
      return {
        bg: 'border-blue-100 bg-blue-50 text-blue-700',
        dot: 'bg-blue-500',
      }
    case 'delete':
      return {
        bg: 'border-rose-100 bg-rose-50 text-rose-700',
        dot: 'bg-rose-500',
      }
    case 'login':
      return {
        bg: 'border-purple-100 bg-purple-50 text-purple-700',
        dot: 'bg-purple-500',
      }
    case 'logout':
      return {
        bg: 'border-slate-100 bg-slate-50 text-slate-700',
        dot: 'bg-slate-400',
      }
    default:
      return {
        bg: 'border-slate-100 bg-slate-50 text-slate-700',
        dot: 'bg-slate-400',
      }
  }
}

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-slate-50">
        <td className="px-6 py-6"><div className="h-4 w-32 rounded bg-slate-100"></div></td>
        <td className="px-6 py-6">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-24 rounded bg-slate-100"></div>
            <div className="h-3 w-16 rounded bg-slate-100"></div>
          </div>
        </td>
        <td className="px-6 py-6"><div className="h-6 w-16 rounded bg-slate-100"></div></td>
        <td className="px-6 py-6">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-20 rounded bg-slate-100"></div>
            <div className="h-3 w-16 rounded bg-slate-100"></div>
          </div>
        </td>
        <td className="px-6 py-6"><div className="h-4 w-20 rounded bg-slate-100"></div></td>
        <td className="px-6 py-6"><div className="h-4 w-28 rounded bg-slate-100"></div></td>
        <td className="px-6 py-6"><div className="h-8 w-8 rounded-full bg-slate-100"></div></td>
      </tr>
    ))}
  </>
)

const StatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="h-[160px] animate-pulse rounded-[24px] border border-slate-100 bg-white"
      ></div>
    ))}
  </div>
)

const AuditLogView: React.FC = () => {
  // Page configurations
  useEffect(() => {
    document.title = 'Security & Audit Registry | PIXS ERP'
  }, [])

  // Core States
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [isLoadingLogs, setIsLoadingLogs] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Filters State
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    per_page: 25,
    action: '',
    user_type: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    search: '',
  })

  // Local UI States
  const [searchTerm, setSearchTerm] = useState('')
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null)
  const [copiedType, setCopiedType] = useState<'details' | 'full' | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editDetailsStr, setEditDetailsStr] = useState('')
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 0,
  })

  // Fetch Stats Data
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true)
      const data = await getAuditLogStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching audit statistics:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch Logs Data
  const fetchLogs = async (currentFilters: AuditLogFilters) => {
    try {
      setIsLoadingLogs(true)
      const response = await getAuditLogs(currentFilters)
      if (response.status === 'success') {
        setLogs(response.data)
        setMeta(response.meta)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast.error('Failed to load audit records.')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Initial Sync
  useEffect(() => {
    fetchStats()
  }, [])

  // Refetch logs when filters change
  useEffect(() => {
    fetchLogs(filters)
  }, [filters])

  // Debounced search logic
  const handleSearchDebounce = useMemo(
    () =>
      debounce((val: string) => {
        setFilters((prev) => ({ ...prev, search: val, page: 1 }))
      }, 400),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    handleSearchDebounce(val)
  }

  // Dropdown / Date filter handlers
  const handleFilterChange = (key: keyof AuditLogFilters, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset to first page when query parameters change
      ...(key !== 'page' ? { page: 1 } : {}),
    }))
  }

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setFilters({
      page: 1,
      per_page: filters.per_page, // retain pagination size
      action: '',
      user_type: '',
      entity_type: '',
      start_date: '',
      end_date: '',
      search: '',
    })
    toast.success('Filters cleared')
  }

  // Row expand toggle
  const toggleRowExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id)
  }

  // Copy to clipboard with visual feedback
  const handleCopyToClipboard = (text: string, logId: string, type: 'details' | 'full') => {
    navigator.clipboard.writeText(text)
    setCopiedLogId(logId)
    setCopiedType(type)
    toast.success(
      type === 'details'
        ? 'Audit payload JSON copied to clipboard!'
        : 'Full audit log record copied!'
    )
    setTimeout(() => {
      setCopiedLogId(null)
      setCopiedType(null)
    }, 2000)
  }

  // Export All Filtered Data to Clipboard
  const handleExportAll = async () => {
    try {
      setIsExporting(true)
      // Call endpoint without pagination by requesting a high count
      const exportFilters = { ...filters, page: 1, per_page: 10000 }
      const response = await getAuditLogs(exportFilters)
      if (response.status === 'success' && response.data.length > 0) {
        const payload = JSON.stringify(response.data, null, 2)
        navigator.clipboard.writeText(payload)
        toast.success(`Exported ${response.data.length} records to clipboard!`)
      } else {
        toast.error('No matching records found to export.')
      }
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Could not export filtered logs.')
    } finally {
      setIsExporting(false)
    }
  }

  // Row Selection & Actions
  const toggleRowSelection = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation()
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (logs.length > 0 && selectedRows.length === logs.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(logs.map((log) => log.id))
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this log?')) return
    try {
      await deleteAuditLog(id)
      toast.success('Audit log deleted')
      fetchLogs(filters)
      fetchStats()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete audit log')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} logs?`)) return
    try {
      setIsDeleting(true)
      await bulkDeleteAuditLogs(selectedRows)
      toast.success(`Deleted ${selectedRows.length} audit logs`)
      setSelectedRows([])
      fetchLogs(filters)
      fetchStats()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete audit logs')
    } finally {
      setIsDeleting(false)
    }
  }

  const startEditing = (log: AuditLog, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingLogId(log.id)
    setEditDetailsStr(log.details ? JSON.stringify(log.details, null, 2) : '')
  }

  const saveEdit = async (id: string) => {
    try {
      const parsedDetails = editDetailsStr.trim() ? JSON.parse(editDetailsStr) : null
      await updateAuditLog(id, { details: parsedDetails })
      toast.success('Audit log updated')
      setEditingLogId(null)
      fetchLogs(filters)
    } catch (error) {
      console.error(error)
      toast.error('Invalid JSON or failed to update log')
    }
  }

  // Computed summary aggregates
  const computedStats = useMemo(() => {
    if (!stats) return { total: 0, today: 0, writes: 0, sessions: 0 }
    const create = stats.by_action?.create || 0
    const update = stats.by_action?.update || 0
    const deleteCount = stats.by_action?.delete || 0
    const login = stats.by_action?.login || 0
    const logout = stats.by_action?.logout || 0
    return {
      total: stats.total || 0,
      today: stats.today || 0,
      writes: create + update + deleteCount,
      sessions: login + logout,
    }
  }, [stats])

  return (
    <div className="AuditLogPage animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="flex flex-col justify-between gap-4 pt-12 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-[#75EEA5] shadow-2xl shadow-slate-900/20">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              Security Ledger
            </h1>
            <p className="mt-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              System-wide Audit Trail & Log Monitor
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportAll}
            disabled={isExporting || logs.length === 0}
            className="flex items-center gap-2 rounded-3xl border border-emerald-100 bg-[#75EEA5]/10 px-6 py-3 text-[11px] font-black tracking-[3px] text-emerald-800 uppercase italic transition-all hover:-translate-y-1 hover:bg-[#75EEA5]/25 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {isExporting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Filtered Data
              </>
            )}
          </button>
          {selectedRows.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-3xl border border-rose-100 bg-rose-50 px-6 py-3 text-[11px] font-black tracking-[3px] text-rose-700 uppercase italic transition-all hover:-translate-y-1 hover:bg-rose-100 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <Trash2 size={14} />
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedRows.length})`}
            </button>
          )}
        </div>
      </header>

      {/* Stats Summary Grid */}
      {isLoadingStats ? (
        <StatsSkeleton />
      ) : (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <StatCard
            title="Total Logged Events"
            value={computedStats.total}
            icon={Database}
            variant="dark"
          />
          <StatCard
            title="Recorded Today"
            value={computedStats.today}
            icon={Calendar}
            variant="emerald"
          />
          <StatCard
            title="Write Actions"
            value={computedStats.writes}
            icon={Activity}
            variant="light"
          />
          <StatCard
            title="Auth Sessions"
            value={computedStats.sessions}
            icon={Shield}
            variant="light"
          />
        </section>
      )}

      {/* Search and Collapsible Filter Bar */}
      <div className="search-filter-bar flex flex-col gap-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-200/40">
        {/* Core Control Row */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="group relative w-full max-w-md flex-1">
            <Search
              className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search Entity ID or Payload detail..."
              className="w-full rounded-[22px] border border-slate-100 bg-slate-50 py-4 pr-6 pl-14 font-mono text-sm font-bold text-slate-900 italic transition-all placeholder:text-slate-400 focus:border-emerald-200 focus:bg-white focus:outline-none"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex w-full flex-wrap justify-end gap-3 md:w-auto">
            {/* Filter Toggle Button (For Mobile/Responsive) */}
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className={`flex items-center gap-2 rounded-[20px] px-6 py-4 text-[10px] font-black tracking-widest uppercase italic transition-all ${
                isFiltersExpanded
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                  : 'bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {isFiltersExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Quick Reset */}
            <button
              onClick={handleResetFilters}
              className="group flex items-center gap-2 rounded-[20px] bg-slate-50 border border-slate-100 p-4 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-900 hover:text-white"
              title="Reset Filters"
            >
              <RefreshCw
                size={14}
                className="transition-transform duration-500 group-hover:rotate-180"
              />
            </button>
          </div>
        </div>

        {/* Expandable Dropdowns Sub-panel */}
        {(isFiltersExpanded || window.innerWidth >= 768) && (
          <div
            className={`grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-3 lg:grid-cols-5 ${
              !isFiltersExpanded && 'hidden md:grid'
            }`}
          >
            {/* Action Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase ml-2">
                Action Type
              </label>
              <select
                className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
                value={filters.action || ''}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">Action: All</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            {/* User Type Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase ml-2">
                User Type
              </label>
              <select
                className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
                value={filters.user_type || ''}
                onChange={(e) => handleFilterChange('user_type', e.target.value)}
              >
                <option value="">User Type: All</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="technician">Technician</option>
                <option value="inventory">Inventory</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            {/* Entity Type Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase ml-2">
                Entity Domain
              </label>
              <select
                className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
                value={filters.entity_type || ''}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              >
                <option value="">Entity: All</option>
                <option value="screenplate">Screenplate</option>
                <option value="order">Order</option>
                <option value="product">Product</option>
                <option value="user">User</option>
                <option value="auth">Auth</option>
              </select>
            </div>

            {/* Start Date Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase ml-2">
                Start Date
              </label>
              <input
                type="date"
                className="w-full cursor-pointer rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-3.5 text-[10px] font-bold text-slate-600 focus:outline-none"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>

            {/* End Date Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase ml-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full cursor-pointer rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-3.5 text-[10px] font-bold text-slate-600 focus:outline-none"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Logs Table */}
      <div className="audit-table-card overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-6 w-12 text-center">
                  <input
                    type="checkbox"
                    className="cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={logs.length > 0 && selectedRows.length === logs.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Date / Time
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  User Node
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Action
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Entity Info
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Payload
                </th>
                <th className="px-6 py-6 text-[11px] font-black tracking-[3px] text-slate-400 uppercase text-center">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoadingLogs ? (
                <TableSkeleton />
              ) : logs.length > 0 ? (
                logs.map((log) => {
                  const badgeProps = getActionBadgeProps(log.action)
                  const isExpanded = expandedLogId === log.id

                  return (
                    <React.Fragment key={log.id}>
                      {/* Standard row */}
                      <tr
                        onClick={() => toggleRowExpand(log.id)}
                        className={`group cursor-pointer transition-all duration-300 hover:bg-slate-50/80 ${
                          isExpanded ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            checked={selectedRows.includes(log.id)}
                            onChange={(e) => toggleRowSelection(log.id, e)}
                          />
                        </td>

                        {/* Date/Time */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <p className="text-[12px] font-black text-slate-900">
                            {log.created_at_formatted}
                          </p>
                          <p className="mt-0.5 font-mono text-[9px] font-bold text-slate-400">
                            {new Date(log.created_at).toLocaleTimeString([], {
                              second: '2-digit',
                            })}
                          </p>
                        </td>

                        {/* User Node */}
                        <td className="px-6 py-5">
                          <p className="text-[12px] font-black text-slate-900">
                            {log.user_name || 'System Auto'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[9px] font-bold text-slate-400">
                              ID: {log.user_id || 'N/A'}
                            </span>
                            {log.user_type && (
                              <>
                                <span className="text-slate-300 text-[8px]">•</span>
                                <span className="bg-slate-100 text-slate-600 rounded px-1 text-[8px] font-black uppercase tracking-wider">
                                  {log.user_type}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Action Badge */}
                        <td className="px-6 py-5">
                          <span
                            className={`flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black tracking-widest uppercase italic shadow-sm ${badgeProps.bg}`}
                          >
                            <div className={`h-1.5 w-1.5 rounded-full ${badgeProps.dot}`}></div>
                            {log.action_label || log.action}
                          </span>
                        </td>

                        {/* Entity Info */}
                        <td className="px-6 py-5">
                          <p className="text-[12px] font-black text-slate-900 uppercase">
                            {log.entity_type}
                          </p>
                          <span className="font-mono text-[9px] text-slate-400 font-semibold block mt-0.5">
                            ID: {log.entity_id || 'N/A'}
                          </span>
                        </td>

                        {/* IP Address */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-[8px] px-2.5 py-1">
                            {log.ip_address}
                          </span>
                        </td>

                        {/* Details snippet */}
                        <td className="px-6 py-5 max-w-[200px] truncate">
                          <span className="font-mono text-[10px] text-slate-500 font-medium">
                            {log.details ? JSON.stringify(log.details) : 'No payload'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => startEditing(log, e)}
                              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(log.id, e)}
                              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRowExpand(log.id)
                              }}
                              className={`rounded-full p-2 transition-all ${
                                isExpanded
                                  ? 'bg-slate-900 text-white rotate-180'
                                  : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                              }`}
                            >
                              <ChevronDown size={14} className="transition-transform duration-300" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/30">
                          <td colSpan={8} className="px-8 py-6">
                            <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-inner space-y-6">
                              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4">
                                <div className="flex items-center gap-3">
                                  <Terminal size={18} className="text-emerald-500 animate-pulse" />
                                  <h4 className="text-[12px] font-black tracking-widest text-slate-800 uppercase italic">
                                    Event Log Metadata Payload
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        JSON.stringify(log.details || {}, null, 2),
                                        log.id,
                                        'details'
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[10px] font-black text-slate-600 uppercase hover:bg-slate-100"
                                  >
                                    {copiedLogId === log.id && copiedType === 'details' ? (
                                      <>
                                        <ClipboardCheck size={12} className="text-emerald-500" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copy Details</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleCopyToClipboard(
                                        JSON.stringify(log, null, 2),
                                        log.id,
                                        'full'
                                      )
                                    }
                                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[10px] font-black text-slate-600 uppercase hover:bg-slate-100"
                                  >
                                    {copiedLogId === log.id && copiedType === 'full' ? (
                                      <>
                                        <ClipboardCheck size={12} className="text-emerald-500" />
                                        <span>Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copy Full Log</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                      Event ID
                                    </span>
                                    <p className="font-mono text-xs font-bold text-slate-700">
                                      {log.id}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                      Client IP Address
                                    </span>
                                    <p className="font-mono text-xs font-bold text-slate-700">
                                      {log.ip_address}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                      Client Agent (Browser)
                                    </span>
                                    <p className="text-xs text-slate-500 font-medium max-w-md break-words">
                                      {log.user_agent || 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                      Audit Action Target
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="bg-slate-900 text-white font-mono text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                        {log.entity_type}
                                      </span>
                                      <ArrowRight size={10} className="text-slate-400" />
                                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                        {log.entity_id || 'GLOBAL_ROOT'}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                                      Timestamp
                                    </span>
                                    <p className="text-xs text-slate-700 font-bold">
                                      {log.created_at}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block mb-2">
                                  Payload State Data (`details` JSON)
                                </span>
                                {editingLogId === log.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] text-slate-700 focus:border-emerald-500 focus:outline-none"
                                      rows={10}
                                      value={editDetailsStr}
                                      onChange={(e) => setEditDetailsStr(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button
                                        onClick={() => setEditingLogId(null)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => saveEdit(log.id)}
                                        className="rounded-xl bg-emerald-500 px-4 py-2 text-[10px] font-bold text-white hover:bg-emerald-600"
                                      >
                                        Save Changes
                                      </button>
                                    </div>
                                  </div>
                                ) : log.details ? (
                                  <pre className="font-mono text-[11px] p-5 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto whitespace-pre-wrap max-h-96 shadow-inner">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                ) : (
                                  <div className="border border-dashed border-slate-200 rounded-2xl py-6 px-4 bg-slate-50 text-center text-[11px] font-bold text-slate-400">
                                    No details object associated with this operation.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="bg-slate-50/30 px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Search size={32} className="text-slate-200 animate-bounce" />
                      <p className="text-lg font-black text-slate-900 uppercase italic">
                        No Logs Found
                      </p>
                      <p className="text-xs text-slate-400 font-bold max-w-[280px]">
                        No entries match your active ledger queries. Try resetting or adjusting the
                        filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Controls */}
        {logs.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-100 p-6 md:flex-row bg-slate-50/30">
            {/* Items Per Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Per Page:
              </span>
              <select
                className="cursor-pointer rounded-xl border border-slate-100 bg-white px-3 py-2 text-[10px] font-black text-slate-600 shadow-sm focus:outline-none"
                value={filters.per_page || 25}
                onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination Component */}
            <div className="flex justify-center -mt-20">
              <Pagination
                currentPage={meta.current_page}
                totalPages={meta.last_page}
                onChange={(page) => handleFilterChange('page', page)}
              />
            </div>

            {/* Showing statistics numbers */}
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Showing {Math.min((meta.current_page - 1) * meta.per_page + 1, meta.total)} -{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} Ledger Events
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogView
