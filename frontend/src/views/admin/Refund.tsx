import React, { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Eye, X, Check, 
  CreditCard,
  ChevronDown, Copy
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import axiosInstance from '../../lib/axiosInstance'
import { toast } from 'react-hot-toast'
interface Refund {
  id: string
  customer_id: string
  order_id: string | null
  payment_code_id: string | null
  amount: number
  message: string | null
  status: 'pending' | 'completed' | 'cancelled'
  processed_at: string | null
  created_at: string
  customer_first_name?: string
  customer_last_name?: string
  payment_code?: string
}

interface PaymentMethod {
  id: string
  type: string
  last_four: string
  is_default: boolean
}

interface PaymentCode {
  id: string
  code: string
  amount: number
  status: string
  created_at: string
}

const RefundPage: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  
  // Create form state
  const [formData, setFormData] = useState({
    customer_id: '',
    order_id: '',
    amount: '',
    message: '',
    payment_code_id: '',
  })
  const [customerPaymentMethods, setCustomerPaymentMethods] = useState<PaymentMethod[]>([])
  const [customerPaycodes, setCustomerPaycodes] = useState<PaymentCode[]>([])
  const [showPaycodes, setShowPaycodes] = useState(false)

  useEffect(() => {
    fetchRefunds()
  }, [])

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerPaymentData(formData.customer_id)
    } else {
      setCustomerPaymentMethods([])
      setCustomerPaycodes([])
    }
  }, [formData.customer_id])

  const fetchRefunds = async () => {
    try {
      const res = await axiosInstance.get('/api/admin/refunds')
      setRefunds(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch refunds', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCustomerPaymentData = async (customerId: string) => {
    try {
      const res = await axiosInstance.get(`/api/admin/customers/${customerId}/payment-methods`)
      setCustomerPaymentMethods(res.data.data?.payment_methods || [])
      setCustomerPaycodes(res.data.data?.payment_codes || [])
    } catch (error) {
      console.error('Failed to fetch payment data', error)
    }
  }

  const handleCreateRefund = async () => {
    if (!formData.customer_id || !formData.amount) {
      toast.error('Customer and amount are required')
      return
    }

    try {
      await axiosInstance.post('/api/admin/refunds', {
        customer_id: formData.customer_id,
        order_id: formData.order_id || null,
        payment_code_id: formData.payment_code_id || null,
        amount: parseFloat(formData.amount),
        message: formData.message || null,
      })
      
      toast.success('Refund created successfully')
      setShowCreateModal(false)
      setFormData({ customer_id: '', order_id: '', amount: '', message: '', payment_code_id: '' })
      fetchRefunds()
    } catch (error) {
      console.error('Failed to create refund', error)
      toast.error('Failed to create refund')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axiosInstance.patch(`/api/admin/refunds/${id}`, { status })
      toast.success(`Refund ${status}`)
      fetchRefunds()
      if (selectedRefund?.id === id) {
        setSelectedRefund({ ...selectedRefund, status: status as 'pending' | 'completed' | 'cancelled' })
      }
    } catch (error) {
      console.error('Failed to update refund', error)
      toast.error('Failed to update refund')
    }
  }

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = 
      `${refund.customer_first_name} ${refund.customer_last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 lg:px-8">
      <header className="flex items-center justify-between py-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            Refund Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Process customer refunds and track expenditure
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          Create Refund
        </button>
      </header>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search refunds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Refunds Table */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-lg">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase">ID</th>
              <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-black tracking-widest text-slate-500 uppercase">Date</th>
              <th className="px-6 py-4 text-right text-xs font-black tracking-widest text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-600" />
                </td>
              </tr>
            ) : filteredRefunds.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No refunds found
                </td>
              </tr>
            ) : (
              filteredRefunds.map((refund) => (
                <tr key={refund.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                    {refund.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">
                      {refund.customer_first_name} {refund.customer_last_name}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {refund.order_id || '-'}
                  </td>
                  <td className="px-6 py-4 font-black text-rose-600">
                    ₱{refund.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'rounded-lg border px-3 py-1 text-[11px] font-bold uppercase',
                      refund.status === 'completed' && 'border-emerald-100 bg-emerald-50 text-emerald-600',
                      refund.status === 'pending' && 'border-amber-100 bg-amber-50 text-amber-600',
                      refund.status === 'cancelled' && 'border-slate-200 bg-slate-100 text-slate-500',
                    )}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {format(new Date(refund.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund)
                          setShowViewModal(true)
                        }}
                        className="rounded-lg p-2 hover:bg-slate-100"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {refund.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(refund.id, 'completed')}
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                            title="Mark Complete"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(refund.id, 'cancelled')}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <m.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-[24px] bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Create Refund</h2>
                <button onClick={() => setShowCreateModal(false)} className="rounded-full p-2 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    placeholder="Enter customer ID"
                  />
                </div>

                {/* Payment Methods & Paycodes Section */}
                {(customerPaymentMethods.length > 0 || customerPaycodes.length > 0) && (
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Payment Data
                      </h3>
                      <button
                        onClick={() => setShowPaycodes(!showPaycodes)}
                        className="flex items-center gap-1 text-xs font-bold text-rose-600"
                      >
                        {showPaycodes ? 'Hide' : 'Show'} Paycodes
                        <ChevronDown size={14} className={showPaycodes ? 'rotate-180' : ''} />
                      </button>
                    </div>

                    {customerPaymentMethods.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          Saved Payment Methods
                        </p>
                        <div className="space-y-2">
                          {customerPaymentMethods.map((pm) => (
                            <div key={pm.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                              <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-slate-400" />
                                <span className="text-sm font-medium">{pm.type} ****{pm.last_four}</span>
                              </div>
                              {pm.is_default && (
                                <span className="text-[10px] font-bold text-emerald-600">DEFAULT</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showPaycodes && customerPaycodes.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          Payment Codes
                        </p>
                        <div className="space-y-2">
                          {customerPaycodes.map((pc) => (
                            <div key={pc.id} className="flex items-center justify-between rounded-lg bg-white p-3">
                              <div>
                                <p className="font-mono text-sm font-bold">{pc.code}</p>
                                <p className="text-xs text-slate-500">₱{pc.amount.toLocaleString()}</p>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(pc.code)
                                  toast.success('Code copied!')
                                }}
                                className="rounded-lg p-2 hover:bg-slate-100"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                      placeholder="Order ID"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Message / Reason
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3"
                    rows={3}
                    placeholder="Enter reason for refund..."
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRefund}
                  className="flex-1 rounded-xl bg-rose-600 py-3 font-bold text-white"
                >
                  Create Refund
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedRefund && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setShowViewModal(false)}
          >
            <m.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-[24px] bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">Refund Details</h2>
                <button onClick={() => setShowViewModal(false)} className="rounded-full p-2 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">Refund ID</span>
                  <span className="font-mono text-sm font-bold">{selectedRefund.id}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">Customer</span>
                  <span className="font-bold">{selectedRefund.customer_first_name} {selectedRefund.customer_last_name}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">Amount</span>
                  <span className="font-black text-rose-600">₱{selectedRefund.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">Status</span>
                  <span className={clsx(
                    'rounded-lg border px-3 py-1 text-[11px] font-bold uppercase',
                    selectedRefund.status === 'completed' && 'border-emerald-100 bg-emerald-50 text-emerald-600',
                    selectedRefund.status === 'pending' && 'border-amber-100 bg-amber-50 text-amber-600',
                    selectedRefund.status === 'cancelled' && 'border-slate-200 bg-slate-100 text-slate-500',
                  )}>
                    {selectedRefund.status}
                  </span>
                </div>
                {selectedRefund.message && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-xs font-bold tracking-widest text-slate-500 uppercase">Message</p>
                    <p className="text-sm">{selectedRefund.message}</p>
                  </div>
                )}
              </div>

              {selectedRefund.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedRefund.id, 'cancelled')}
                    className="flex-1 rounded-xl border border-slate-200 py-3 font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRefund.id, 'completed')}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RefundPage
