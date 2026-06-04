import React, { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Eye, X, Check, 
  CreditCard,
  ChevronDown, Copy, User as UserIcon
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import axiosInstance from '../../lib/axiosInstance'
import { toast } from 'react-hot-toast'

interface ICustomer {
  id: string
  first_name: string
  last_name: string
  email: string
  company_name?: string
}

interface Refund {
  id: string
  customer_id: string
  order_id: string | null
  payment_id: string | null
  amount: number
  message: string | null
  status: 'pending' | 'completed' | 'cancelled'
  processed_at: string | null
  created_at: string
  customer_first_name?: string
  customer_last_name?: string
  payment_method_type?: string
  payment_method_masked_number?: string
  payment_method_bank_name?: string | null
  payment_method_provider?: string | null
}

interface PaymentMethod {
  id: string
  type: string
  masked_number: string
  bank_name?: string | null
  provider?: string | null
  is_default: boolean
}

interface PaymentCode {
  id: string
  code: string
  amount: number
  status: string
  created_at: string
}

interface IOrder {
  id: string
  total_amount: number
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
    payment_id: '',
  })
  const [customerPaymentMethods, setCustomerPaymentMethods] = useState<PaymentMethod[]>([])
  const [customerPaycodes, setCustomerPaycodes] = useState<PaymentCode[]>([])
  const [customerOrders, setCustomerOrders] = useState<IOrder[]>([])
  const [showPaycodes, setShowPaycodes] = useState(false)

  // Customer search autocomplete
  const [allCustomers, setAllCustomers] = useState<ICustomer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)

  useEffect(() => {
    fetchRefunds()
  }, [])

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerPaymentData(formData.customer_id)
      fetchCustomerOrders(formData.customer_id)
    } else {
      setCustomerPaymentMethods([])
      setCustomerPaycodes([])
      setCustomerOrders([])
    }
  }, [formData.customer_id])

  const fetchCustomers = async () => {
    try {
      const res = await axiosInstance.get('/api/admin/customers')
      setAllCustomers(res.data.data || res.data || [])
    } catch (error) {
      console.error('Failed to fetch customers', error)
    }
  }

  useEffect(() => {
    if (showCreateModal) {
      fetchCustomers()
    }
  }, [showCreateModal])

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

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const res = await axiosInstance.get(`/api/admin/customers/${customerId}/orders`)
      setCustomerOrders(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch customer orders', error)
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
        payment_id: formData.payment_id || null,
        amount: parseFloat(formData.amount),
        message: formData.message || null,
      })
      
      toast.success('Refund created successfully')
      setShowCreateModal(false)
      setFormData({ customer_id: '', order_id: '', amount: '', message: '', payment_id: '' })
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
                <div className="relative">
                  <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Customer *
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setIsCustomerDropdownOpen(true)
                        if (!e.target.value) {
                          setFormData({ ...formData, customer_id: '', payment_id: '' })
                          setCustomerPaymentMethods([])
                          setCustomerPaycodes([])
                        }
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm"
                      placeholder="Search by name, email, or company..."
                    />
                  </div>
                  {isCustomerDropdownOpen && customerSearch && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                      {allCustomers.filter(c =>
                        (`${c.first_name} ${c.last_name} ${c.email} ${c.company_name || ''}`)
                          .toLowerCase()
                          .includes(customerSearch.toLowerCase())
                      ).map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormData({ ...formData, customer_id: c.id, payment_id: '' })
                            setCustomerSearch(`${c.first_name} ${c.last_name}`)
                            setIsCustomerDropdownOpen(false)
                            setCustomerPaymentMethods([])
                            setCustomerPaycodes([])
                          }}
                          className="flex cursor-pointer items-center gap-3 border-b border-slate-100 p-4 text-sm transition-colors hover:bg-rose-50 last:border-0"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
                            <UserIcon size={16} className="text-rose-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {c.first_name} {c.last_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {c.company_name ? `${c.company_name} · ` : ''}{c.email}
                            </p>
                          </div>
                        </div>
                      ))}
                      {allCustomers.filter(c =>
                        (`${c.first_name} ${c.last_name} ${c.email} ${c.company_name || ''}`)
                          .toLowerCase()
                          .includes(customerSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-400">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
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
                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-450 uppercase">
                          Select Refund Payment Method *
                        </p>
                        <div className="space-y-2">
                          {customerPaymentMethods.map((pm) => {
                            const isSelected = formData.payment_id === pm.id
                            return (
                              <div
                                key={pm.id}
                                onClick={() => setFormData({ ...formData, payment_id: pm.id })}
                                className={clsx(
                                  "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all",
                                  isSelected
                                    ? "border-rose-500 bg-rose-50/50 shadow-sm"
                                    : "border-slate-200 bg-white hover:border-rose-250"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <CreditCard size={16} className={isSelected ? "text-rose-600" : "text-slate-400"} />
                                  <span className="text-sm font-medium">
                                    {pm.type.toUpperCase()} {pm.bank_name ? `(${pm.bank_name})` : pm.provider ? `(${pm.provider})` : ''} — {pm.masked_number}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {pm.is_default && (
                                    <span className="text-[10px] font-bold text-emerald-600">DEFAULT</span>
                                  )}
                                  <div
                                    className={clsx(
                                      "h-4 w-4 rounded-full border flex items-center justify-center",
                                      isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-slate-300"
                                    )}
                                  >
                                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {showPaycodes && customerPaycodes.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          Payment Codes (Reference)
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
                    <div className="relative">
                      <select
                        value={formData.order_id}
                        onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm"
                      >
                        <option value="">-- No order --</option>
                        {customerOrders.map(o => (
                          <option key={o.id} value={o.id}>
                            {o.id} — ₱{o.total_amount.toLocaleString()} ({o.status})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {!formData.customer_id && (
                      <p className="mt-1 text-xs text-slate-400">Select a customer first to see their orders</p>
                    )}
                    {formData.customer_id && customerOrders.length === 0 && (
                      <p className="mt-1 text-xs text-slate-400">No orders found for this customer</p>
                    )}
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
                {selectedRefund.payment_id && (
                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
                    <span className="text-xs text-slate-500 font-bold">Payment Method</span>
                    <span className="text-xs font-semibold text-slate-800 mt-1">
                      {selectedRefund.payment_method_type?.toUpperCase()}{' '}
                      {selectedRefund.payment_method_bank_name ? `(${selectedRefund.payment_method_bank_name})` : selectedRefund.payment_method_provider ? `(${selectedRefund.payment_method_provider})` : ''}
                      {' — '}{selectedRefund.payment_method_masked_number}
                    </span>
                  </div>
                )}
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
