import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react'
import axiosInstance from '../../../lib/axiosInstance'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'

const DeleteAccountPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmIdInput, setConfirmIdInput] = useState('')

  const accountType = id?.startsWith('EMP') ? 'employee' : 'customer'

  const handlePreDelete = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return toast.error('Administrator password is required')
    if (!reason) return toast.error('A reason for deletion must be provided for audit logs')
    if (!confirmDelete) return toast.error('Please confirm you understand this action is irreversible')

    setShowConfirmModal(true)
  }

  const executeDelete = async () => {
    try {
      setLoading(true)
      await axiosInstance.delete(`/api/admin/accounts/delete/${id}`, {
        data: {
          password,
          reason,
          type: accountType
        }
      })
      toast.success('Account purged and moved to archive successfully')
      navigate('/admin/account')
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Failed to delete account')
      } else {
        toast.error('Failed to delete account')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[800px] animate-in fade-in space-y-8 px-4 pb-16 pt-12 duration-500">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/account"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
            Purge Identity
          </h1>
          <p className="text-xs font-bold tracking-[2px] text-slate-400 uppercase">
            ID: {id} | Type: {accountType}
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-rose-100 bg-white p-8 shadow-2xl shadow-rose-200/20">
        <div className="mb-6 flex items-start gap-4 rounded-2xl bg-rose-50 p-6">
          <AlertTriangle className="shrink-0 text-rose-500" size={24} />
          <div>
            <h2 className="mb-1 text-sm font-black tracking-widest text-rose-600 uppercase italic">
              Critical Warning
            </h2>
            <p className="text-xs font-bold leading-relaxed text-rose-500/80">
              You are about to permanently purge this account from the active registry.
              The identity's core credentials will be moved to the <span className="text-rose-700">immutable archive</span>.
              This action requires explicit Administrator authorization and cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handlePreDelete} className="space-y-6">
          <div>
            <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
              Reason for Deletion
            </label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Provide a mandatory reason for the audit logs..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold text-slate-900 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
              Administrator Password
            </label>
            <div className="relative">
              <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Verify your authority..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-900 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <input 
              type="checkbox" 
              id="confirm" 
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500" 
            />
            <label htmlFor="confirm" className="text-xs font-bold text-slate-600 cursor-pointer">
              I understand that this action is irreversible and will delete all associated data (addresses, contacts, etc).
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !confirmDelete || !password || !reason}
            className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-rose-500 py-4 text-xs font-black tracking-widest text-white shadow-xl shadow-rose-500/30 transition-all hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-rose-500"
          >
            <Trash2 size={18} />
            {loading ? 'PURGING IDENTITY...' : 'AUTHORIZE PURGE'}
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl overflow-hidden border border-rose-100">
            <h3 className="mb-4 text-xl font-black text-rose-600 uppercase italic flex items-center gap-2">
              <AlertTriangle className="text-rose-500" size={24} />
              Critical Purge Action
            </h3>
            
            <div className="mb-6 rounded-2xl bg-rose-50 p-6 text-xs font-bold text-rose-700 leading-relaxed">
              <p className="mb-2">
                This action is <strong>irreversible</strong>. By confirming, you will permanently purge the identity <strong>{id}</strong> and all associated database records:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {accountType === 'employee' ? (
                  <>
                    <li>Core Employee Profile & Authentication Credentials</li>
                    <li>Associated Contact Numbers & Addresses</li>
                    <li>Registered Payment Methods</li>
                    <li>All Attendance & Production Activity logs</li>
                    <li>Order execution queues & inventory logs</li>
                  </>
                ) : (
                  <>
                    <li>Core Customer Profile & Credentials</li>
                    <li>All Client Placed Orders & Purchases</li>
                    <li>Associated Addresses & Contact Details</li>
                    <li>Saved Payment Methods & Cart Items</li>
                    <li>Product reviews & Screenplate Requests</li>
                  </>
                )}
              </ul>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">
                Type Account ID <span className="text-rose-600 font-mono">({id})</span> to Confirm:
              </label>
              <input 
                type="text" 
                value={confirmIdInput}
                onChange={(e) => setConfirmIdInput(e.target.value)}
                placeholder="Verify account ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-bold text-slate-900 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false)
                  setConfirmIdInput('')
                }}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-black tracking-widest text-slate-600 uppercase hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmIdInput !== id}
                onClick={async () => {
                  setShowConfirmModal(false)
                  await executeDelete()
                }}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-black tracking-widest text-white uppercase hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:hover:bg-rose-600"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeleteAccountPage
