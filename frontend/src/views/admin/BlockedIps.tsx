import React, { useState, useEffect } from 'react'
import {
  ShieldOff,
  ShieldAlert,
  Clock,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

import {
  getBlockedIps,
  unblockIp,
  unblockAllIps,
  blockIp,
  type BlockedIp,
} from '../../api/blocked-ip.api'

const BlockedIps: React.FC = () => {
  const [temporaryIps, setTemporaryIps] = useState<BlockedIp[]>([])
  const [permanentIps, setPermanentIps] = useState<BlockedIp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUnblockingAll, setIsUnblockingAll] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0 })

  const fetchBlockedIps = async () => {
    try {
      setIsLoading(true)
      const data = await getBlockedIps()
      setTemporaryIps(data.temporary)
      setPermanentIps(data.permanent)
      setStats({ total: data.total, active: data.active_count })
    } catch (error) {
      console.error('Error fetching blocked IPs:', error)
      toast.error('Failed to load blocked IP records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBlockedIps()
    document.title = 'Blocked IP Registry | PIXS ERP'
  }, [])

  const handleUnblock = async (id: number) => {
    if (!window.confirm('Are you sure you want to unblock this IP address?')) return
    try {
      await unblockIp(id)
      toast.success('IP address unblocked successfully.')
      fetchBlockedIps()
    } catch (error) {
      console.error(error)
      toast.error('Failed to unblock IP address.')
    }
  }

  const handleUnblockAll = async () => {
    if (
      !window.confirm(
        'CRITICAL ACTION: Are you sure you want to UNBLOCK ALL IP addresses? This will restore access to all previously blocked users.'
      )
    ) {
      return
    }

    try {
      setIsUnblockingAll(true)
      await unblockAllIps()
      toast.success('All IP addresses have been unblocked.')
      fetchBlockedIps()
    } catch (error) {
      console.error(error)
      toast.error('Failed to unblock all IPs.')
    } finally {
      setIsUnblockingAll(false)
    }
  }

  const handleAddBlock = async () => {
    const ip_address = window.prompt('Enter IP Address to block:')
    if (!ip_address) return

    const reason = window.prompt('Reason for blocking:', 'Manual block by admin')
    if (reason === null) return

    const duration = window.prompt('Duration (1h, 24h, 7d, or permanent):', 'permanent')
    if (duration === null) return

    try {
      await blockIp({ ip_address, reason, duration })
      toast.success(`IP ${ip_address} has been blocked.`)
      fetchBlockedIps()
    } catch (error) {
      console.error(error)
      toast.error('Failed to block IP address.')
    }
  }

  return (
    <div className="BlockedIpsPage animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="flex flex-col justify-between gap-4 pt-12 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-rose-400 shadow-2xl shadow-slate-900/20">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              Access Restriction Registry
            </h1>
            <p className="mt-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Manage Blocked IP Addresses & Network Security
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAddBlock}
            className="flex items-center gap-2 rounded-3xl border border-slate-100 bg-white px-6 py-3 text-[11px] font-black tracking-[3px] text-slate-900 uppercase italic transition-all hover:-translate-y-1 hover:bg-slate-50"
          >
            <Plus size={14} />
            Block New IP
          </button>
          <button
            onClick={handleUnblockAll}
            disabled={isUnblockingAll || stats.total === 0}
            className="flex items-center gap-2 rounded-3xl border border-rose-100 bg-rose-50 px-6 py-3 text-[11px] font-black tracking-[3px] text-rose-700 uppercase italic transition-all hover:-translate-y-1 hover:bg-rose-100 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {isUnblockingAll ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Unblocking...
              </>
            ) : (
              <>
                <ShieldOff size={14} />
                Unblock All IPs
              </>
            )}
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Total Blocked
              </p>
              <h3 className="text-4xl font-black text-slate-900 italic mt-1">{stats.total}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
              <ShieldAlert size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Currently Active
              </p>
              <h3 className="text-4xl font-black text-emerald-500 italic mt-1">{stats.active}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <RefreshCw size={24} />
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-200/40 hidden lg:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Temporary Blocks
              </p>
              <h3 className="text-4xl font-black text-blue-500 italic mt-1">{temporaryIps.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        {/* Temporary Blocks */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <Clock size={18} className="text-blue-500" />
            <h2 className="text-[14px] font-black tracking-widest text-slate-800 uppercase italic">
              Temporary Restrictions ({temporaryIps.length})
            </h2>
          </div>
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">IP Address</th>
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">Reason</th>
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">Expires In</th>
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                     <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold animate-pulse">Synchronizing Data...</td></tr>
                  ) : temporaryIps.length > 0 ? (
                    temporaryIps.map((ip) => (
                      <tr key={ip.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                            {ip.ip_address}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[12px] font-bold text-slate-600">{ip.reason || 'No reason provided'}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                            <Clock size={12} className="text-blue-400" />
                            <span className="text-[11px] font-black text-blue-600 uppercase">
                              {ip.expires_at ? new Date(ip.expires_at).toLocaleString() : 'N/A'}
                            </span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleUnblock(ip.id)}
                            className="rounded-full p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Unblock"
                          >
                            <ShieldOff size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-300 italic font-bold">No temporary restrictions active.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Permanent Blocks */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2">
            <ShieldAlert size={18} className="text-rose-500" />
            <h2 className="text-[14px] font-black tracking-widest text-slate-800 uppercase italic">
              Permanent Restrictions ({permanentIps.length})
            </h2>
          </div>
          <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">IP Address</th>
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">Reason</th>
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase">Blocked Since</th>
                    <th className="px-6 py-5 text-[10px] font-black tracking-widest text-slate-400 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {isLoading ? (
                     <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold animate-pulse">Synchronizing Data...</td></tr>
                  ) : permanentIps.length > 0 ? (
                    permanentIps.map((ip) => (
                      <tr key={ip.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                            {ip.ip_address}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[12px] font-bold text-slate-600">{ip.reason || 'No reason provided'}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[11px] font-black text-slate-500 uppercase">
                             {new Date(ip.blocked_at).toLocaleDateString()}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleUnblock(ip.id)}
                            className="rounded-full p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Unblock"
                          >
                            <ShieldOff size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-300 italic font-bold">No permanent restrictions active.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockedIps
