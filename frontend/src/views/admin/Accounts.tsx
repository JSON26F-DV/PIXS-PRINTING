import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Briefcase,
  Mail,
  Phone,
  X,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Camera,
  Plus,
  Trash,
  Star,
  MapPin,
  Lock,
  Info,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Clock,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type SubmitHandler,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import debounce from 'lodash/debounce'
import bcrypt from 'bcryptjs'
import BoxFallback from '../../components/common/BoxFallback'

// Types and Schemas
import {
  UserRole,
  type UserRoleType,
  type Status,
  type BaseUser,
  userSchema,
  type FormData,
  type Address,
  type DeletedAccountLog,
} from './account-types'

import usersData from '../../data/users.json'
import addressBookData from '../../data/address_book.json'
import AnimatedNumber from '../../components/animations/AnimatedNumber'

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SIMULATED: Admin ID for audit logs
const CURRENT_ADMIN_ID = 'EMP-001'
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('Admin123!', 10) // Simulated admin password

// --- UTILITIES ---
const generateSecureId = (role: string) => {
  const randomSuffix = Math.floor(Math.random() * 900) + 100
  return role === UserRole.CUSTOMER
    ? `CUST-${randomSuffix}`
    : `EMP-${randomSuffix}`
}

interface RawUserNode {
  id: string
  name?: string
  first_name: string
  last_name: string
  email: string
  role?: string
  status?: string
  date_created?: string
  profile_picture?: string
  contact_numbers?: { number: string; is_default: boolean }[]
  [key: string]: unknown
}

// --- SUB-COMPONENTS ---
const UserAvatar = ({
  src,
  name,
  size = 'h-14 w-14',
}: {
  src?: string | null
  name: string
  size?: string
}) => {
  const [error, setError] = useState(false)

  const displaySrc =
    src && !error
      ? src.startsWith('http') ||
        src.startsWith('blob:') ||
        src.startsWith('data:')
        ? src
        : `/src/assets/profile/${src}`
      : null

  if (!displaySrc) {
    return (
      <BoxFallback
        className={cn(size, 'rounded-[22px] bg-slate-900 overflow-hidden')}
        iconClassName="h-8 w-8 brightness-0 invert opacity-30"
      />
    )
  }

  return (
    <img
      src={displaySrc}
      alt={name}
      onError={() => setError(true)}
      className={cn(
        size,
        'rounded-[22px] border-2 border-white bg-slate-100 object-cover shadow-xl ring-1 ring-slate-100',
      )}
    />
  )
}

// --- UI COMPONENTS ---

const StatCard = ({
  title,
  value,
  prefix = '',
  icon: Icon,
  variant = 'light',
}: {
  title: string
  value: number
  prefix?: string
  icon: LucideIcon
  variant?: 'light' | 'dark' | 'emerald' | 'rose'
}) => {
  const bgClass =
    variant === 'dark'
      ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white'
      : variant === 'emerald'
        ? 'bg-gradient-to-br from-[#75EEA5] to-[#5de291] text-slate-900 border-none'
        : variant === 'rose'
          ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white border-none'
          : 'bg-white border border-slate-100 shadow-xl shadow-slate-200/40 text-slate-900'

  const textMuted = variant === 'light' ? 'text-slate-500' : 'text-slate-900/60'
  console.log(textMuted) // temporarily avoid unused warning

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[24px] p-6 shadow-2xl transition-all hover:-translate-y-1',
        bgClass,
      )}
    >
      <div
        className={cn(
          'absolute -top-4 -right-4 p-4 opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12',
        )}
      >
        <Icon className={cn('h-32 w-32')} />
      </div>
      <p
        className={cn(
          'relative z-10 mb-3 text-xs font-black tracking-[2px] uppercase opacity-70',
        )}
      >
        {title}
      </p>
      <div className="relative z-10 flex items-baseline gap-1">
        <span className="text-xl font-bold opacity-60">{prefix}</span>
        <AnimatedNumber
          value={value}
          className="text-4xl font-black tracking-tighter"
        />
      </div>
    </div>
  )
}

// Component for profile picture uploader
const ProfilePictureUploader = ({
  value,
  onChange,
}: {
  value?: string
  onChange: (val: string) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(value)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (Max 5MB)')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP allowed')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setPreview(base64String)
      onChange(base64String)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="account-profile-picture group flex flex-col items-center gap-4">
      <div className="relative h-32 w-32 overflow-hidden rounded-[32px] border-4 border-slate-50 shadow-2xl transition-transform group-hover:scale-105">
        <UserAvatar src={preview} name="Profile" size="h-full w-full" />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="account-image-upload absolute inset-0 flex cursor-pointer items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Camera className="text-white" size={24} />
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-black tracking-widest text-blue-600 uppercase transition-colors hover:text-blue-700"
        >
          Change Photo
        </button>
        {preview && (
          <>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => {
                setPreview('')
                onChange('')
              }}
              className="text-[10px] font-black tracking-widest text-rose-500 uppercase transition-colors hover:text-rose-600"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// --- MAIN PAGE ---

const Accounts: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useState<BaseUser[]>(() => {
    // Unify employees and customers into BaseUser
    const employees = (usersData.employees as RawUserNode[]).map((e) => ({
      ...(e as unknown as BaseUser),
      name: e.name || `${e.first_name} ${e.last_name}`,
      status: (e.status as Status) || 'active',
      date_created: e.date_created || new Date().toISOString(),
      contact_numbers: e.contact_numbers || [],
    }))
    const customers = (usersData.customers as RawUserNode[]).map((c) => ({
      ...(c as unknown as BaseUser),
      name: c.name || `${c.first_name} ${c.last_name}`,
      role: UserRole.CUSTOMER,
      status: (c.status as Status) || 'active',
      date_created: c.date_created || new Date().toISOString(),
      contact_numbers: c.contact_numbers || [],
    }))
    return [...employees, ...customers] as BaseUser[]
  })

  const [addressBook, setAddressBook] = useState<Address[]>(() => {
    // Map JSON entries to Address type, ensuring label exists
    return (addressBookData as unknown as Address[]).map((a) => ({
      ...a,
      label: a.label || a.full_name || 'Standard Unit',
    }))
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<BaseUser | null>(null)

  // Secure Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<{
    open: boolean
    user: BaseUser | null
    step: 1 | 2
  }>({
    open: false,
    user: null,
    step: 1,
  })
  const [deleteReason, setDeleteReason] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Address editing state (within modal)
  const [tempAddresses, setTempAddresses] = useState<Address[]>([])

  // --- FORM SETUP ---
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      status: 'active',
      role: UserRole.CUSTOMER,
      contact_numbers: [{ number: '', is_default: true }],
    },
  })

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control,
    name: 'contact_numbers',
  })

  const watchRole = useWatch({ control, name: 'role' })

  useEffect(() => {
    document.title = 'Account Infrastructure | PIXS ERP'
  }, [])

  // --- SEARCH LOGIC ---
  const handleSearchDebounce = useMemo(
    () => debounce((q: string) => setDebouncedSearch(q), 300),
    [],
  )

  useEffect(() => {
    handleSearchDebounce(searchTerm)
    return () => handleSearchDebounce.cancel()
  }, [searchTerm, handleSearchDebounce])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, debouncedSearch, roleFilter, statusFilter])

  // --- HANDLERS ---

  const openFormModal = (user?: BaseUser) => {
    if (user) {
      setEditingUser(user)
      reset({
        ...user,
        password: '', // Don't lead password
      })
      // Load addresses for this user
      const userAddrs = addressBook.filter((a) => a.user_id === user.id) || []
      // Map userAddrs flat list to the local Address interface if needed, but they match now.
      setTempAddresses([...userAddrs])
    } else {
      setEditingUser(null)
      reset({
        first_name: '',
        last_name: '',
        email: '',
        role: UserRole.CUSTOMER,
        status: 'active',
        age: 18,
        gender: 'male',
        company_name: '',
        contact_numbers: [{ number: '', is_default: true }],
        password: '',
      })
      setTempAddresses([])
    }
    setIsModalOpen(true)
  }

  const onFormSubmit: SubmitHandler<FormData> = (data) => {
    // 1. Audit Check: Cannot demote last admin
    if (editingUser?.role === UserRole.ADMIN && data.role !== UserRole.ADMIN) {
      const adminCount = users.filter((u) => u.role === UserRole.ADMIN).length
      if (adminCount <= 1) {
        toast.error('Security Halt: Cannot downgrade last remaining Admin.')
        return
      }
    }

    // 2. Audit Check: Cannot modify own role
    if (editingUser?.id === CURRENT_ADMIN_ID && data.role !== UserRole.ADMIN) {
      toast.error(
        'Logic Halt: You cannot remove your own administrative access.',
      )
      return
    }

    const fullName = `${data.first_name} ${data.last_name}`
    const timestamp = new Date().toISOString()

    if (editingUser) {
      // LOG AUDIT: Check for status/role changes
      if (editingUser.status !== data.status) {
        console.log(
          `[AUDIT] Status Change for ${editingUser.id} by ${CURRENT_ADMIN_ID}: ${editingUser.status} -> ${data.status}`,
        )
      }
      if (editingUser.role !== data.role) {
        console.log(
          `[AUDIT] Role Change for ${editingUser.id} by ${CURRENT_ADMIN_ID}: ${editingUser.role} -> ${data.role}`,
        )
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                ...data,
                name: fullName,
                last_modified: timestamp,
                modified_by: CURRENT_ADMIN_ID,
              }
            : u,
        ),
      )

      // Sync Address Book in-memory
      setAddressBook((prev) => {
        const otherUsersAddrs = prev.filter((a) => a.user_id !== editingUser.id)
        const updatedUserAddrs = tempAddresses.map((a) => ({
          ...a,
          user_id: editingUser.id,
        }))
        return [...otherUsersAddrs, ...updatedUserAddrs]
      })

      toast.success('Identity updated and synced to address book.')
    } else {
      const newId = generateSecureId(data.role)
      const newUser: BaseUser = {
        ...data,
        id: newId,
        name: fullName,
        date_created: timestamp,
        profile_picture:
          data.profile_picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      } as BaseUser

      setUsers((prev) => [newUser, ...prev])

      // Sync Address Book in-memory
      if (tempAddresses.length > 0) {
        const newAddresses = tempAddresses.map((a) => ({
          ...a,
          user_id: newId,
        }))
        setAddressBook((prev) => [...prev, ...newAddresses])
      }

      toast.success('New secure identity provisioned.')
    }
    setIsModalOpen(false)
  }

  const initiateDelete = (user: BaseUser) => {
    // Basic guards
    if (user.id === CURRENT_ADMIN_ID) {
      toast.error('Action Blocked: Self-deletion is not permitted.')
      return
    }
    if (user.role === UserRole.ADMIN) {
      const adminCount = users.filter((u) => u.role === UserRole.ADMIN).length
      if (adminCount <= 1) {
        toast.error('Action Blocked: Cannot delete the last remaining Admin.')
        return
      }
    }

    setIsDeleteModalOpen({ open: true, user, step: 1 })
    setDeleteReason('')
    setDeletePassword('')
    setDeleteConfirmed(false)
  }

  const handleSecureDelete = async () => {
    if (isDeleteModalOpen.step === 1) {
      if (!deleteConfirmed) {
        toast.error('Please confirm you understand this is irreversible.')
        return
      }
      if (!deleteReason) {
        toast.error('A reason for deletion is mandatory for audit logs.')
        return
      }
      setIsDeleteModalOpen((prev) => ({ ...prev, step: 2 }))
      return
    }

    // Step 2: Password Verification
    setIsDeleting(true)
    const isValid = await bcrypt.compare(deletePassword, ADMIN_PASSWORD_HASH)

    if (!isValid) {
      toast.error('Administrative authentication failed. Action blocked.')
      setIsDeleting(false)
      return
    }

    const user = isDeleteModalOpen.user!

    // LOG TO deleted_account.json (Simulated)
    const log: DeletedAccountLog = {
      deleted_at: new Date().toISOString(),
      deleted_by: CURRENT_ADMIN_ID,
      reason: deleteReason,
      account_snapshot: user,
    }
    console.log('[SECURITY LOG] Identity purged and archived:', log)
    toast.success('Log generated in deleted_accounts.json', { icon: '📝' })

    // Remove from active state
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    setAddressBook((prev) => prev.filter((a) => a.user_id !== user.id))

    toast.success('Entity purged successfully.')
    setIsDeleting(false)
    setIsDeleteModalOpen({ open: false, user: null, step: 1 })
  }

  // --- STATS ---
  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === UserRole.ADMIN).length
    const staff = users.filter((u) => u.role === UserRole.STAFF).length
    const customers = users.filter((u) => u.role === UserRole.CUSTOMER).length
    const totalValue = users.reduce(
      (acc, u) => acc + (u.total_orders_value || 0),
      0,
    )
    return { total: users.length, admins, staff, customers, totalValue }
  }, [users])

  return (
    <div className="account-page-container animate-in fade-in mx-auto max-w-[1440px] space-y-8 px-4 pb-16 duration-500 lg:px-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 pt-12 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-[#75EEA5] shadow-2xl shadow-slate-900/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              Account Infrastructure
            </h1>
            <p className="mt-1 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
              Enterprise Human Capital Controller
            </p>
          </div>
        </div>
        <button
          onClick={() => openFormModal()}
          className="flex items-center gap-3 rounded-3xl border border-[#5de291]/50 bg-[#75EEA5] px-8 py-4 text-[11px] font-black tracking-[3px] text-slate-900 uppercase italic shadow-xl shadow-[#75EEA5]/20 transition-all hover:-translate-y-1 hover:bg-[#5de291] active:scale-95"
        >
          <UserPlus size={18} />
          Provision Identity
        </button>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registry"
          value={stats.total}
          icon={Briefcase}
          variant="dark"
        />
        <StatCard
          title="Active Customers"
          value={stats.customers}
          icon={UserCheck}
          variant="emerald"
        />
        <StatCard
          title="Administrative Nodes"
          value={stats.admins}
          icon={ShieldCheck}
          variant="light"
        />
        <StatCard
          title="Gross Customer Value"
          value={Math.floor(stats.totalValue)}
          prefix="₱"
          icon={TrendingUp}
          variant="light"
        />
      </section>

      {/* Control Bar */}
      <div className="search-filter-bar flex flex-col items-center justify-between gap-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-200/40 md:flex-row">
        <div className="group relative w-full max-w-md flex-1">
          <Search
            className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Registry..."
            className="w-full rounded-[22px] border border-slate-100 bg-slate-50 py-4 pr-6 pl-14 font-mono text-sm font-bold text-slate-900 italic transition-all placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex w-full flex-wrap gap-3 md:w-auto">
          <select
            className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as 'all' | UserRoleType)
            }
          >
            <option value="all">Role: All</option>
            <option value={UserRole.ADMIN}>Role: Admin</option>
            <option value={UserRole.STAFF}>Role: Staff</option>
            <option value={UserRole.CUSTOMER}>Role: Customer</option>
          </select>
          <select
            className="cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 pr-10 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-colors hover:bg-slate-100 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
          >
            <option value="all">Status: All</option>
            <option value="active">Active Entry</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('')
              setRoleFilter('all')
              setStatusFilter('all')
            }}
            className="group flex items-center gap-2 rounded-[20px] bg-slate-100 p-4 text-[10px] font-black text-slate-500 uppercase transition-all hover:bg-slate-900 hover:text-white"
          >
            <RefreshCw
              size={14}
              className="transition-transform duration-500 group-hover:rotate-180"
            />
          </button>
        </div>
      </div>

      {/* Account Table */}
      <div className="account-table overflow-hidden rounded-[44px] border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-10 py-8 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  System Node
                </th>
                <th className="px-10 py-8 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Communication
                </th>
                <th className="px-10 py-8 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Identity Role
                </th>
                <th className="px-10 py-8 text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Health State
                </th>
                <th className="px-10 py-8 text-right text-[11px] font-black tracking-[3px] text-slate-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <UserAvatar src={user.profile_picture} name={user.name} />
                          <div
                            className={cn(
                              'absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-white',
                              user.status === 'active'
                                ? 'bg-emerald-500'
                                : user.status === 'suspended'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400',
                            )}
                          ></div>
                        </div>
                        <div>
                          <p className="text-lg leading-tight font-black tracking-tight text-slate-900 uppercase italic">
                            {user.name}
                          </p>
                          <p className="mt-1 font-mono text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic">
                            {user.id} <span className="mx-1 opacity-30">/</span>{' '}
                            {user.age}Y{' '}
                            <span className="mx-1 opacity-30">/</span>{' '}
                            {user.gender}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-2">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors group-hover:text-blue-600">
                          <Mail size={14} className="text-slate-300" />{' '}
                          {user.email}
                        </span>
                        <span className="flex items-center gap-2 font-mono text-[11px] font-black text-slate-400">
                          <Phone size={14} className="text-slate-300" />
                          {user.contact_numbers?.find((c) => c.is_default)
                            ?.number || 'No Default Node'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-[12px] border border-slate-100 bg-white p-2.5 shadow-sm',
                            user.role === UserRole.ADMIN
                              ? 'text-slate-900'
                              : user.role === UserRole.STAFF
                                ? 'text-blue-500'
                                : 'text-emerald-500',
                          )}
                        >
                          {user.role === UserRole.ADMIN ? (
                            <ShieldAlert size={18} />
                          ) : user.role === UserRole.STAFF ? (
                            <Briefcase size={18} />
                          ) : (
                            <UserCheck size={18} />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-black tracking-[2px] uppercase italic',
                            user.role === UserRole.ADMIN
                              ? 'text-slate-900'
                              : 'text-slate-500',
                          )}
                        >
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-2">
                        <span
                          className={cn(
                            'flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-[9px] font-black tracking-widest uppercase italic shadow-sm',
                            user.status === 'active'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                              : user.status === 'suspended'
                                ? 'border-amber-100 bg-amber-50 text-amber-600'
                                : 'border-slate-200 bg-slate-100 text-slate-500',
                          )}
                        >
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              user.status === 'active'
                                ? 'animate-pulse bg-emerald-500'
                                : user.status === 'suspended'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400',
                            )}
                          ></div>
                          {user.status}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-[2px] text-slate-400 uppercase italic">
                          <Clock size={12} className="opacity-50" />
                          {new Date(user.date_created).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex translate-x-4 items-center justify-end gap-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <button
                          onClick={() => openFormModal(user)}
                          className="rounded-[20px] p-4 text-slate-400 shadow-xl transition-all hover:bg-slate-900 hover:text-white hover:shadow-slate-900/40"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => initiateDelete(user)}
                          className="rounded-[20px] p-4 text-slate-400 shadow-xl transition-all hover:bg-rose-500 hover:text-white hover:shadow-rose-500/40"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="bg-slate-50/30 px-8 py-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-[32px] border border-slate-100 bg-white shadow-2xl duration-[2000ms]">
                        <Search size={40} className="text-slate-200" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 uppercase italic">
                          Trace Empty
                        </p>
                        <p className="mt-2 text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                          No matching identity fragments found in current node
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setRoleFilter('all')
                          setStatusFilter('all')
                        }}
                        className="rounded-full border border-slate-200 bg-white px-8 py-3 text-[10px] font-black tracking-widest text-slate-500 uppercase shadow-lg transition-all hover:bg-slate-900 hover:text-white"
                      >
                        Clear System Parameters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- EDIT ACCOUNT MODAL --- */}
      {isModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/80 p-0 backdrop-blur-3xl duration-300 md:p-8">
          <div className="animate-in slide-in-from-right-20 relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-none border-8 border-white/5 bg-slate-50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] duration-500 md:h-auto md:max-h-[85vh] md:rounded-[64px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-10">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-900">
                  {editingUser ? <ShieldCheck size={32} /> : <Plus size={32} />}
                </div>
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                    {editingUser ? 'Profile Config' : 'Terminal Provisioning'}
                  </h3>
                  <div className="mt-2 flex items-center gap-4">
                    <p className="font-black tracking-[4px] text-[10x] text-slate-400 uppercase">
                      Identity Node Management
                    </p>
                    {editingUser && (
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black tracking-widest text-white uppercase">
                        {editingUser.id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="group flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-rose-500 hover:text-white"
              >
                <X
                  size={24}
                  className="transition-transform group-hover:rotate-90"
                />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit(onFormSubmit)}
              className="account-edit-form custom-scrollbar flex-1 overflow-y-auto scroll-smooth bg-slate-50 p-10"
            >
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                {/* LEFT COLUMN: Identity Profile */}
                <div className="space-y-10 lg:col-span-4">
                  <div className="flex flex-col items-center rounded-[48px] border border-slate-100 bg-white p-10 shadow-sm">
                    <Controller
                      control={control}
                      name="profile_picture"
                      render={({ field }) => (
                        <ProfilePictureUploader
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />

                    <div className="mt-12 w-full space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                          System First Name
                        </label>
                        <input
                          {...register('first_name')}
                          className="w-full rounded-[28px] border border-slate-100 bg-slate-50 px-8 py-5 font-mono text-base font-black text-slate-900 italic shadow-inner transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                        {errors.first_name && (
                          <p className="px-4 text-[11px] font-bold text-rose-500">
                            {errors.first_name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                          System Last Name
                        </label>
                        <input
                          {...register('last_name')}
                          className="w-full rounded-[28px] border border-slate-100 bg-slate-50 px-8 py-5 font-mono text-base font-black text-slate-900 italic shadow-inner transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                        {errors.last_name && (
                          <p className="px-4 text-[11px] font-bold text-rose-500">
                            {errors.last_name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase">
                          Email Node Address
                        </label>
                        <input
                          {...register('email')}
                          className="w-full rounded-[28px] border border-slate-100 bg-slate-50 px-8 py-5 font-mono text-base font-black text-slate-900 shadow-inner transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                        />
                        {errors.email && (
                          <p className="px-4 text-[11px] font-bold text-rose-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 rounded-[40px] bg-slate-900 p-8 text-white">
                    <div className="flex items-center gap-4">
                      <Lock className="text-[#75EEA5]" size={20} />
                      <p className="text-[11px] font-black tracking-[3px] text-[#75EEA5] uppercase">
                        Security Protocol
                      </p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black tracking-[2px] text-slate-500 uppercase">
                        Admin Overwrite Password
                      </label>
                      <input
                        {...register('password')}
                        type="password"
                        placeholder={
                          editingUser
                            ? 'NO CHANGE DETECTED'
                            : 'REQUIRED FOR NEW NODE'
                        }
                        className="w-full rounded-[20px] border border-white/10 bg-white/5 px-6 py-4 font-mono text-sm font-bold text-white transition-all focus:border-[#75EEA5] focus:outline-none"
                      />
                      {errors.password && (
                        <p className="px-2 text-[11px] font-bold text-rose-400">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Parameters & Nodes */}
                <div className="space-y-12 lg:col-span-8">
                  {/* section: Parameters */}
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6 rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
                      <h4 className="mb-2 flex items-center gap-2 border-b border-slate-50 pb-4 text-[11px] font-black tracking-[4px] text-slate-400 uppercase">
                        <Shield size={14} /> System Access
                      </h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                            Core Role Assignment
                          </label>
                          <select
                            {...register('role')}
                            className="w-full cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 text-sm font-black tracking-widest text-slate-900 uppercase italic transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                          >
                            <option value={UserRole.ADMIN}>
                              ADMINISTRATOR (FULL)
                            </option>
                            <option value={UserRole.STAFF}>
                              PRODUCTION STAFF
                            </option>
                            <option value={UserRole.CUSTOMER}>
                              VERIFIED CUSTOMER
                            </option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                            Health Pulse Status
                          </label>
                          <select
                            {...register('status')}
                            className="w-full cursor-pointer appearance-none rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 text-sm font-black tracking-widest text-slate-900 uppercase italic transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                          >
                            <option value="active">ACTIVE OPERATION</option>
                            <option value="suspended">
                              SUSPENDED / LOCKED
                            </option>
                            <option value="archived">ARCHIVED RECORD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
                      <h4 className="mb-2 flex items-center gap-2 border-b border-slate-50 pb-4 text-[11px] font-black tracking-[4px] text-slate-400 uppercase">
                        <Info size={14} /> Bio Matrix
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                            Age Node
                          </label>
                          <input
                            {...register('age', { valueAsNumber: true })}
                            type="number"
                            className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 font-mono text-sm font-black text-slate-900 transition-all focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                            Gender
                          </label>
                          <select
                            {...register('gender')}
                            className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 font-mono text-sm font-black text-slate-900 uppercase italic transition-all focus:bg-white focus:outline-none"
                          >
                            <option value="male">MALE</option>
                            <option value="female">FEMALE</option>
                            <option value="other">OTHER</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black tracking-[2px] text-slate-400 uppercase">
                          Company Entity Name
                        </label>
                        <input
                          {...register('company_name')}
                          className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-4 font-mono text-sm font-black text-slate-900 italic transition-all focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* section: Contacts (Field Array) */}
                  <div className="rounded-[48px] border border-slate-100 bg-white p-10 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[11px] font-black tracking-[4px] text-slate-400 uppercase">
                        <Phone size={14} /> Contact Propagation Nodes
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          appendContact({ number: '+63 ', is_default: false })
                        }
                        className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-[9px] font-black tracking-widest text-white uppercase transition-all hover:scale-105"
                      >
                        <Plus size={12} /> Add Network Node
                      </button>
                    </div>
                    <div className="space-y-4">
                      {contactFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="group flex flex-col items-center gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-100/50 md:flex-row"
                        >
                          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="relative">
                              <input
                                {...register(`contact_numbers.${index}.number`)}
                                placeholder="+63 XXX XXX XXXX"
                                className="w-full rounded-[18px] border border-slate-200 bg-white py-4 pr-6 pl-12 font-mono text-sm font-black text-slate-900 transition-all focus:border-blue-500 focus:outline-none"
                              />
                              <Phone
                                size={14}
                                className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-300"
                              />
                            </div>
                            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white px-6 py-3">
                              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                Default Node
                              </span>
                              <input
                                type="checkbox"
                                {...register(
                                  `contact_numbers.${index}.is_default`,
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // uncheck others
                                    contactFields.forEach(
                                      (_, i) =>
                                        i !== index &&
                                        setValue(
                                          `contact_numbers.${i}.is_default`,
                                          false,
                                        ),
                                    )
                                  }
                                  setValue(
                                    `contact_numbers.${index}.is_default`,
                                    e.target.checked,
                                  )
                                }}
                                className="h-5 w-5 cursor-pointer accent-emerald-500"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeContact(index)}
                            disabled={contactFields.length === 1}
                            className="flex items-center justify-center self-stretch rounded-[18px] p-4 text-slate-300 transition-all hover:bg-white hover:text-rose-500 disabled:opacity-30"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      ))}
                      {errors.contact_numbers?.message && (
                        <p className="text-xs font-bold text-rose-500">
                          {errors.contact_numbers.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* section: Addresses */}
                  <div className="account-address-section rounded-[48px] border border-slate-100 bg-white p-10 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-[11px] font-black tracking-[4px] text-slate-400 uppercase">
                        <MapPin size={14} /> Geographical Registry
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setTempAddresses([
                            ...tempAddresses,
                            { label: 'New Label', address: '' },
                          ])
                        }
                        className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-[9px] font-black tracking-widest text-white uppercase transition-all hover:scale-105"
                      >
                        <Plus size={12} /> Add Location
                      </button>
                    </div>
                    <div className="space-y-4">
                      {tempAddresses.length === 0 ? (
                        <div className="rounded-[32px] border-2 border-dashed border-slate-100 py-12 text-center">
                          <MapPin
                            size={32}
                            className="mx-auto mb-3 text-slate-100"
                          />
                          <p className="text-[10px] font-black tracking-widest text-slate-300 uppercase italic">
                            No addresses defined for this node
                          </p>
                        </div>
                      ) : (
                        tempAddresses.map((addr, idx) => (
                          <div
                            key={idx}
                            className="account-address-item group rounded-[32px] border border-slate-100 bg-slate-50 p-6"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <input
                                value={addr.label}
                                onChange={(e) => {
                                  const next = [...tempAddresses]
                                  next[idx].label = e.target.value
                                  setTempAddresses(next)
                                }}
                                className="w-1/2 border-none bg-transparent p-0 text-[11px] font-black tracking-[3px] text-blue-600 uppercase focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setTempAddresses(
                                    tempAddresses.filter((_, i) => i !== idx),
                                  )
                                }
                                className="rounded-full p-2 text-slate-300 transition-all hover:bg-white hover:text-rose-500"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <textarea
                              value={addr.address}
                              onChange={(e) => {
                                const next = [...tempAddresses]
                                next[idx].address = e.target.value
                                setTempAddresses(next)
                              }}
                              placeholder="Full physical address path..."
                              className="h-24 w-full resize-none rounded-[22px] border border-slate-200 bg-white p-6 font-mono text-sm font-bold text-slate-800 shadow-inner transition-all focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* section: Role Specific Fields */}
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Employee Only */}
                    {(watchRole === UserRole.ADMIN ||
                      watchRole === UserRole.STAFF) && (
                      <div className="space-y-6 rounded-[40px] border border-blue-100 bg-blue-50 p-8">
                        <h4 className="flex items-center gap-2 text-[11px] font-black tracking-[4px] text-blue-400 uppercase">
                          <Briefcase size={14} /> Employment Specs
                        </h4>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black tracking-[2px] text-blue-300 uppercase">
                              Daily Rate Node (₱)
                            </label>
                            <input
                              {...register('daily_rate', {
                                valueAsNumber: true,
                              })}
                              type="number"
                              className="w-full rounded-[20px] border border-blue-200 bg-white px-6 py-4 font-mono text-sm font-black text-blue-900 italic transition-all focus:outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black tracking-[2px] text-blue-300 uppercase">
                              Overtime Rate Factor (₱)
                            </label>
                            <input
                              {...register('ot_rate', { valueAsNumber: true })}
                              type="number"
                              className="w-full rounded-[20px] border border-blue-200 bg-white px-6 py-4 font-mono text-sm font-black text-blue-900 italic transition-all focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Only */}
                    {watchRole === UserRole.CUSTOMER && (
                      <div className="space-y-6 rounded-[40px] border border-emerald-100 bg-emerald-50 p-8">
                        <h4 className="flex items-center gap-2 text-[11px] font-black tracking-[4px] text-emerald-400 uppercase">
                          <Star size={14} /> Commercial Node stats
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-emerald-900">
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                              Total Yield
                            </span>
                            <span className="font-mono text-xl font-black">
                              ₱
                              {(
                                editingUser?.total_orders_value || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-900">
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                              Payload Count
                            </span>
                            <span className="font-mono text-xl font-black">
                              {editingUser?.orders || 0}
                            </span>
                          </div>
                          <div className="mt-4 flex cursor-not-allowed items-center gap-2 border-t border-emerald-100 pt-4 text-[11px] font-black tracking-widest text-emerald-600 uppercase italic opacity-50">
                            <ExternalLink size={14} /> View Order History
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Placeholder for symmetry if only one column shown */}
                    {!(
                      watchRole === UserRole.ADMIN ||
                      watchRole === UserRole.STAFF ||
                      watchRole === UserRole.CUSTOMER
                    ) && <div className="hidden md:block"></div>}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-16 flex flex-col gap-6 border-t border-slate-100 pt-12 md:flex-row">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-[32px] border-2 border-slate-100 bg-white px-10 py-6 text-[12px] font-black tracking-[4px] text-slate-400 uppercase italic transition-all hover:scale-105 hover:bg-slate-50 active:scale-95"
                >
                  Terminate Process
                </button>
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-4 rounded-[32px] border-4 border-white bg-[#75EEA5] px-10 py-6 text-[12px] font-black tracking-[5px] text-slate-900 uppercase italic shadow-[0_20px_50px_rgba(117,238,165,0.3)] transition-all hover:-translate-y-2 hover:bg-[#5de291] active:scale-95"
                >
                  <CheckCircle2 size={24} />
                  {editingUser ? 'Commit Node Update' : 'Initialize Identity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SECURE DELETE MODAL (2-STEP) --- */}
      {isDeleteModalOpen.open && (
        <div className="animate-in zoom-in fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-3xl duration-300">
          <div className="flex w-full max-w-xl flex-col items-center overflow-hidden rounded-[64px] border-8 border-rose-50 bg-white p-12 text-center shadow-[0_0_150px_rgba(244,63,94,0.3)]">
            <div
              className={cn(
                'mb-10 flex h-32 w-32 items-center justify-center rounded-[44px] transition-all duration-500',
                isDeleteModalOpen.step === 1
                  ? 'animate-pulse bg-rose-50'
                  : 'rotate-12 bg-slate-900',
              )}
            >
              {isDeleteModalOpen.step === 1 ? (
                <Trash2 size={54} className="text-rose-500" />
              ) : (
                <ShieldAlert size={54} className="text-[#FBBF24]" />
              )}
            </div>

            {isDeleteModalOpen.step === 1 ? (
              <div className="animate-in slide-in-from-bottom-10 w-full space-y-6">
                <h3 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                  Identity Purge Protocol
                </h3>
                <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-6 text-left">
                  <p className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Trace Summary
                  </p>
                  <p className="text-lg font-black text-slate-900 uppercase italic underline decoration-[#FBBF24] decoration-4">
                    {isDeleteModalOpen.user?.name}
                  </p>
                  <p className="mt-1 font-mono text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                    {isDeleteModalOpen.user?.id} /{' '}
                    {isDeleteModalOpen.user?.email}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[11px] font-black tracking-widest text-slate-900 uppercase italic">
                      Reason for Identity Purge
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Must specify the operational reason for deletion..."
                      className="h-32 w-full resize-none rounded-[28px] border border-slate-200 bg-slate-50 p-5 font-mono text-sm font-bold focus:border-rose-300 focus:outline-none"
                    />
                  </div>

                  <label className="group flex cursor-pointer items-center gap-4 rounded-[32px] border border-rose-100 bg-rose-50 p-6 transition-all hover:bg-rose-100">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(e) => setDeleteConfirmed(e.target.checked)}
                      className="h-6 w-6 accent-rose-500"
                    />
                    <span className="text-left text-[11px] leading-relaxed font-black tracking-widest text-rose-800 uppercase">
                      I understand that this action is irreversible and will
                      purge this identity from all active registries.
                    </span>
                  </label>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    onClick={() =>
                      setIsDeleteModalOpen({ open: false, user: null, step: 1 })
                    }
                    className="flex-1 rounded-full py-5 text-[11px] font-black tracking-widest text-slate-400 uppercase italic transition-all hover:bg-slate-50"
                  >
                    Abort
                  </button>
                  <button
                    onClick={handleSecureDelete}
                    className="flex-[2] rounded-[28px] bg-slate-900 py-5 text-[11px] font-black tracking-[3px] text-white uppercase italic shadow-xl shadow-slate-900/40 transition-all hover:scale-105"
                  >
                    Proceed to Verification{' '}
                    <ArrowRight size={16} className="ml-2 inline" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in zoom-in-95 w-full space-y-8">
                <div>
                  <h3 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
                    Admin Credentials
                  </h3>
                  <p className="mt-2 text-[10px] font-black tracking-[4px] text-amber-500 uppercase">
                    Security Verification Required
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Lock
                      className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-300"
                      size={20}
                    />
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="ADMIN_ACCESS_KEY"
                      className="w-full rounded-[32px] border-4 border-slate-800 bg-slate-900 py-6 pr-8 pl-16 font-mono text-lg font-black tracking-[10px] text-white transition-all focus:border-[#75EEA5] focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                    Verify identity to confirm registry modification
                  </p>
                </div>

                <div className="flex flex-col gap-4 pt-6">
                  <button
                    onClick={handleSecureDelete}
                    disabled={isDeleting}
                    className="group w-full rounded-[32px] bg-rose-500 py-6 text-sm font-black tracking-[5px] text-white uppercase italic shadow-[0_20px_60px_rgba(244,63,94,0.4)] transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? (
                      'PURGING...'
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <Trash2
                          size={20}
                          className="group-hover:animate-bounce"
                        />
                        Finalize Purge
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setIsDeleteModalOpen((prev) => ({ ...prev, step: 1 }))
                    }
                    className="text-[10px] font-black tracking-widest text-slate-500 uppercase transition-all hover:text-slate-900"
                  >
                    Back to parameters
                  </button>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-center gap-3">
              <div
                className={cn(
                  'h-1.5 w-16 rounded-full transition-all duration-500',
                  isDeleteModalOpen.step === 1
                    ? 'w-24 bg-rose-500'
                    : 'bg-slate-100',
                )}
              ></div>
              <div
                className={cn(
                  'h-1.5 w-16 rounded-full transition-all duration-500',
                  isDeleteModalOpen.step === 2
                    ? 'w-24 bg-rose-500'
                    : 'bg-slate-100',
                )}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
