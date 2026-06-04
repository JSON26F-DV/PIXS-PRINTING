import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Eye, X, Check, 
  CreditCard,
  ChevronDown, Copy, User as UserIcon,
  CheckCircle2, Landmark, Wallet, Ticket
} from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import axiosInstance from '../../lib/axiosInstance'
import { toast } from 'react-hot-toast'
import { useDebounce } from '../../hooks/useDebounce'

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
  payment_code_id?: string | null
  payment_code?: string | null
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
  product_names: string[]
}

const RefundPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  // Create form state
  const [formData, setFormData] = useState({
    customer_id: '',
    order_id: '',
    amount: '',
    message: '',
    payment_id: '',
    generate_payment_code: false,
  })
  const [customerPaymentMethods, setCustomerPaymentMethods] = useState<PaymentMethod[]>([])
  const [customerPaycodes, setCustomerPaycodes] = useState<PaymentCode[]>([])
  const [customerOrders, setCustomerOrders] = useState<IOrder[]>([])
  const [showPaycodes, setShowPaycodes] = useState(false)
  // Customer search autocomplete
  const [allCustomers, setAllCustomers] = useState<ICustomer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const debouncedCustomerSearch = useDebounce(customerSearch, 300)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)

  // Order search autocomplete
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const debouncedOrderSearchQuery = useDebounce(orderSearchQuery, 300)
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false)

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
      const list = res.data.data || res.data || []
      setAllCustomers(list)
      return list
    } catch (error) {
      console.error('Failed to fetch customers', error)
      return []
    }
  }

  useEffect(() => {
    if (showCreateModal) {
      fetchCustomers()
    }
  }, [showCreateModal])

  useEffect(() => {
    const handleQueryParams = async () => {
      const customerId = searchParams.get('customer_id')
      const orderId = searchParams.get('order_id')

      if (customerId) {
        // Fetch customers list to find the customer's name
        const customersList = await fetchCustomers()
        const customer = customersList.find((c: ICustomer) => c.id === customerId)
        
        if (customer) {
          setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            order_id: orderId || '',
            generate_payment_code: false,
            payment_id: ''
          }))
          setCustomerSearch(`${customer.first_name} ${customer.last_name}`)
          
          if (orderId) {
            setOrderSearchQuery(orderId)
          }
          
          setShowCreateModal(true)
        }
      }
    }
    
    handleQueryParams()
  }, [searchParams])

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

    if (!formData.payment_id && !formData.generate_payment_code) {
      toast.error('Please select a payment method or select Payment Code')
      return
    }

    try {
      await axiosInstance.post('/api/admin/refunds', {
        customer_id: formData.customer_id,
        order_id: formData.order_id || null,
        payment_id: formData.payment_id || null,
        generate_payment_code: formData.generate_payment_code,
        amount: parseFloat(formData.amount),
        message: formData.message || null,
      })
      
      toast.success('Refund created successfully')
      setShowCreateModal(false)
      setFormData({ customer_id: '', order_id: '', amount: '', message: '', payment_id: '', generate_payment_code: false })
      setOrderSearchQuery('')
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
      `${refund.customer_first_name} ${refund.customer_last_name}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      refund.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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
                          setFormData({ ...formData, customer_id: '', payment_id: '', order_id: '', generate_payment_code: false })
                          setCustomerPaymentMethods([])
                          setCustomerPaycodes([])
                          setCustomerOrders([])
                          setOrderSearchQuery('')
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
                          .includes(debouncedCustomerSearch.toLowerCase())
                      ).map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setFormData({ ...formData, customer_id: c.id, payment_id: '', order_id: '', generate_payment_code: false })
                            setCustomerSearch(`${c.first_name} ${c.last_name}`)
                            setOrderSearchQuery('')
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
                          .includes(debouncedCustomerSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-400">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                 {formData.customer_id && (
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                        Payment Data
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowPaycodes(!showPaycodes)}
                        className="flex items-center gap-1 text-xs font-bold text-rose-600"
                      >
                        {showPaycodes ? 'Hide' : 'Show'} Paycodes
                        <ChevronDown size={14} className={showPaycodes ? 'rotate-180' : ''} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                        Select Refund Method *
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {customerPaymentMethods.map((pay) => {
                          const isSelected = formData.payment_id === pay.id && !formData.generate_payment_code
                          return (
                            <div
                              key={pay.id}
                              onClick={() => setFormData({ ...formData, payment_id: pay.id, generate_payment_code: false })}
                              className={`PaymentCard group relative cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                                isSelected
                                  ? 'border-[#75EEA5] bg-white shadow-lg'
                                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`PaymentRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                                    isSelected
                                      ? 'border-[#75EEA5]'
                                      : 'border-slate-200'
                                  }`}
                                >
                                  {isSelected && (
                                    <CheckCircle2 size={16} className="text-[#75EEA5]" />
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {pay.type === 'bank' ? (
                                      <Landmark size={20} className="text-[#75EEA5]" />
                                    ) : pay.type === 'ewallet' ? (
                                      <Wallet size={20} className="text-[#75EEA5]" />
                                    ) : (
                                      <CreditCard size={20} className="text-[#75EEA5]" />
                                    )}
                                    <span className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                                      {pay.bank_name || pay.provider}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[10px] font-black tracking-[2.5px] text-slate-400 uppercase italic">
                                    {pay.masked_number}
                                  </p>
                                </div>
                              </div>

                              {pay.is_default && (
                                <span className="text-[#75EEA5] absolute top-4 right-4 rounded-full bg-slate-900 px-1.5 py-0.5 text-[7px] font-black tracking-widest uppercase">
                                  Primary
                                </span>
                              )}
                            </div>
                          )
                        })}

                        {/* Payment Code Option Card */}
                        <div
                          onClick={() => setFormData({ ...formData, payment_id: '', generate_payment_code: true })}
                          className={`PaymentCard group relative cursor-pointer rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                            formData.generate_payment_code
                              ? 'border-[#75EEA5] bg-white shadow-lg'
                              : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`PaymentRadio flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                                formData.generate_payment_code
                                  ? 'border-[#75EEA5]'
                                  : 'border-slate-200'
                              }`}
                            >
                              {formData.generate_payment_code && (
                                <CheckCircle2 size={16} className="text-[#75EEA5]" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Ticket size={20} className="text-[#75EEA5]" />
                                <span className="text-sm font-black tracking-tight text-slate-900 uppercase italic">
                                  Payment Code
                                </span>
                              </div>
                              <p className="mt-1 text-[10px] font-black tracking-[2.5px] text-slate-400 uppercase italic">
                                Auto-generate code
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {customerPaymentMethods.length === 0 && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
                          ⚠️ This customer has no registered payment methods. You can select "Payment Code" to generate a refund code.
                        </div>
                      )}
                    </div>

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
                  <div className="relative">
                    <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase">
                      Order
                    </label>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => {
                          setOrderSearchQuery(e.target.value)
                          setIsOrderDropdownOpen(true)
                          if (!e.target.value) {
                            setFormData({ ...formData, order_id: '' })
                          }
                        }}
                        onFocus={() => setIsOrderDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsOrderDropdownOpen(false), 200)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 pr-10 text-sm outline-none focus:border-rose-500 focus:bg-white transition-colors"
                        placeholder={formData.customer_id ? "Search delivered orders..." : "Select customer first"}
                        disabled={!formData.customer_id}
                      />
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {isOrderDropdownOpen && formData.customer_id && (
                      <div className="absolute left-0 right-0 z-50 mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {customerOrders.filter(o => {
                          const q = debouncedOrderSearchQuery.toLowerCase().trim()
                          if (!q) return true
                          return o.id.toLowerCase().includes(q) ||
                            o.product_names.some(name => name.toLowerCase().includes(q))
                        }).map(o => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setFormData({ ...formData, order_id: o.id })
                              setOrderSearchQuery(o.id)
                              setIsOrderDropdownOpen(false)
                            }}
                            className="cursor-pointer border-b border-slate-100 p-3 text-xs transition-colors hover:bg-rose-50 last:border-0"
                          >
                            <p className="font-bold text-slate-900">{o.id}</p>
                            <p className="text-[10px] text-slate-550 mt-1">
                              ₱{o.total_amount.toLocaleString()} · Items: {o.product_names.join(', ')}
                            </p>
                          </div>
                        ))}
                        {customerOrders.filter(o => {
                          const q = debouncedOrderSearchQuery.toLowerCase().trim()
                          if (!q) return true
                          return o.id.toLowerCase().includes(q) ||
                            o.product_names.some(name => name.toLowerCase().includes(q))
                        }).length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No matching delivered orders found
                          </div>
                        )}
                      </div>
                    )}
                    {!formData.customer_id && (
                      <p className="mt-1 text-xs text-slate-405">Select a customer first to see their orders</p>
                    )}
                    {formData.customer_id && customerOrders.length === 0 && (
                      <p className="mt-1 text-xs text-slate-405">No delivered orders found for this customer</p>
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
                {selectedRefund.payment_code && (
                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 p-4">
                    <span className="text-xs text-slate-500 font-bold">Generated Payment Code</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {selectedRefund.payment_code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedRefund.payment_code || '')
                          toast.success('Code copied!')
                        }}
                        className="rounded-lg p-2 hover:bg-slate-200"
                        title="Copy Code"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
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
