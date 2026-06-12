import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiPhone,
  FiPlus,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiCamera,
  FiUser,
  FiEdit,
  FiTrendingUp,
  FiAward,
  FiLock,
} from 'react-icons/fi'
import { clsx } from 'clsx'
import { m, AnimatePresence } from 'framer-motion'
import Cropper, { type Area } from 'react-easy-crop'
import getCroppedImg from './utils/cropImage'
import PhoneInputGroup from './components/PhoneInputGroup'
import BoxFallback from '../../../components/common/BoxFallback'
import { useAccountInfo } from './hooks/useAccountInfo'
import { validateContact } from '../../../utils/contactValidation'
import { useAuth } from '../../../context/AuthContext'

const AccountInfoPage: React.FC = () => {
  const {
    defaultAccount,
    uploadProfilePicture,
    storeContact,
    setDefaultContact,
    updateProfile,
    isLoading,
  } = useAccountInfo()
  const { user, isLoading: authLoading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !user?.isLoggedIn) {
      navigate('/')
    }
  }, [authLoading, user, navigate])

  // ─── Profile Picture States ──────────────────────────────────────────────
  const [profilePreview, setProfilePreview] = useState(
    defaultAccount.profilePicture,
  )
  const [hasImageError, setHasImageError] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Contact States ──────────────────────────────────────────────────────
  const [contacts, setContacts] = useState(defaultAccount.contacts)
  const [isAddingContact, setIsAddingContact] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('action') === 'add-contact'
  })
  const [newContact, setNewContact] = useState('')
  const [contactError, setContactError] = useState('')

  // ─── Profile Details Edit States ─────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: '',
    company_name: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // ─── Security States ─────────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('scroll') === 'contact-section') {
      const element = document.getElementById('contact-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [location])

  // ─── Sync contacts & preview & editForm ─────────────────────────────────
  useEffect(() => {
    if (!isLoading) {
      setProfilePreview(defaultAccount.profilePicture)
      setHasImageError(false)
      setContacts(defaultAccount.contacts)
      setEditForm({
        first_name: defaultAccount.first_name || '',
        last_name: defaultAccount.last_name || '',
        age: defaultAccount.age !== undefined && defaultAccount.age !== null ? String(defaultAccount.age) : '',
        gender: defaultAccount.gender || '',
        company_name: defaultAccount.company_name || '',
      })
    }
  }, [isLoading, defaultAccount])

  // ─── Profile Picture Handlers ────────────────────────────────────────────
  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleApplyCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return
    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels)
      const file = new File([croppedBlob], 'profile.jpg', {
        type: 'image/jpeg',
      })
      const result = await uploadProfilePicture(file)
      if (result.success && result.url) {
        setProfilePreview(result.url)
        toast.success('Profile picture updated')
      } else {
        toast.error(result.error || 'Failed to upload profile picture')
      }
    } catch {
      toast.error('Error processing image')
    } finally {
      setIsUploading(false)
      setIsCropping(false)
      setTempImage(null)
    }
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 3 * 1024 * 1024

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG & WEBP files are allowed')
      e.target.value = ''
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be 3MB or less')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setTempImage(reader.result as string)
      setIsCropping(true)
    }
    reader.readAsDataURL(file)
  }

  // ─── Contact Handlers ────────────────────────────────────────────────────
  const handleSetDefaultContact = async (number: string) => {
    const backup = [...contacts]
    const updated = contacts.map((c) => ({
      ...c,
      is_default: c.number === number,
    }))
    setContacts(updated)
    const result = await setDefaultContact(number)
    if (result.success) {
      toast.success(`Primary contact updated: ${number}`)
    } else {
      setContacts(backup)
      toast.error('Failed to update primary contact.')
    }
  }

  const handleAddContact = () => {
    const validation = validateContact(newContact)
    if (!validation.valid) {
      setContactError(validation.error || 'Invalid number')
      return
    }
    if (contacts.find((c) => c.number === newContact)) {
      setContactError('This number is already registered.')
      return
    }
    setIsAddingContact(false)
    const backup = [...contacts]
    setContacts([...contacts, { number: newContact, is_default: false }])
    storeContact(newContact).then((res: { success: boolean }) => {
      if (res.success) {
        setNewContact('')
        setContactError('')
        toast.success('New contact number added.')
      } else {
        setContacts(backup)
        toast.error('Failed to save contact.')
      }
    })
  }

  // ─── Profile details Handlers ───────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.first_name.trim()) {
      toast.error('First name is required')
      return
    }
    if (!editForm.last_name.trim()) {
      toast.error('Last name is required')
      return
    }

    setIsSaving(true)
    const result = await updateProfile({
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      email: defaultAccount.email,
      company_name: editForm.company_name.trim(),
      age: editForm.age ? parseInt(editForm.age) : null,
      gender: editForm.gender || null,
    })

    if (result.success) {
      toast.success('Profile details updated successfully')
      setIsEditing(false)
    } else {
      toast.error('Failed to update profile details')
    }
    setIsSaving(false)
  }

  // ─── Change Password Handlers ────────────────────────────────────────────
  const handleConfirmChangePassword = async () => {
    const email = defaultAccount.email
    setShowPasswordModal(false)

    // Use proper logout from AuthContext
    await logout()

    // CRITICAL: Use setTimeout to override logout's internal navigate('/login')
    setTimeout(() => {
      navigate(`/forgot-password?email=${encodeURIComponent(email)}`)
    }, 100)
  }

  if (
    isLoading ||
    authLoading ||
    !user?.isLoggedIn
  ) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
          Synchronizing Identity Node...
        </div>
      </div>
    )
  }

  const formattedTotalValue = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(defaultAccount.total_orders_value || 0)

  return (
    <div className="AccountInfoPage animate-in fade-in slide-in-from-bottom-4 min-h-screen pb-20 duration-700 space-y-6">
      {/* ─── Page Header / Company Title ──────────────────────────────────────── */}
      {defaultAccount.company_name && (
        <div className="mb-4 stagger-item pl-2">
          <span className="text-pixs-mint text-[10px] font-black tracking-[4px] uppercase italic">
            Enterprise Profile -------
          </span>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic md:text-5xl mt-1">
            {defaultAccount.company_name}
          </h1>
        </div>
      )}

      {/* ─── Business Analytics Stats (Responsive Grid) ───────────────────────── */}
      {user.role === 'customer' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 rounded-[20px] border border-slate-100 bg-white p-3.5 sm:p-5 shadow-sm transition-all hover:border-slate-200">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-900 text-pixs-mint">
              <FiTrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-slate-400 uppercase">
                Total Spend Value
              </p>
              <p className="text-sm sm:text-lg font-black tracking-tight text-slate-800 italic">
                {formattedTotalValue}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 rounded-[20px] border border-slate-100 bg-white p-3.5 sm:p-5 shadow-sm transition-all hover:border-slate-200">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-900 text-pixs-mint">
              <FiAward className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-slate-400 uppercase">
                Total Orders Completed
              </p>
              <p className="text-sm sm:text-lg font-black tracking-tight text-slate-800 italic">
                {defaultAccount.orders || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Profile Details Card ───────────────────────────────────────────── */}
      <div className="space-y-6 rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
        {/* Card Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-pixs-mint">
              <FiUser size={16} />
            </div>
            <div>
              <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                Profile Credentials
              </p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Personal identity configurations
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-50 my-2" />

        {/* Avatar Section & Fields Form */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-2 shrink-0 self-center md:self-start">
            <div className="relative">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative h-24 w-24 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50 transition-transform duration-500 hover:scale-105 cursor-pointer"
              >
                <BoxFallback
                  className={clsx(
                    'flex h-full w-full items-center justify-center bg-slate-50 transition-opacity duration-300',
                    profilePreview && !hasImageError
                      ? 'absolute inset-0 z-0'
                      : 'relative z-10',
                  )}
                  iconClassName="h-10 w-10 opacity-30 brightness-0"
                />
                {profilePreview && !hasImageError && (
                  <img
                    src={
                      profilePreview.startsWith('http') ||
                      profilePreview.startsWith('blob:') ||
                      profilePreview.startsWith('data:')
                        ? profilePreview
                        : `/src/assets/profile/${profilePreview}`
                    }
                    alt="Profile"
                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                    onError={() => setHasImageError(true)}
                    className="relative z-10 h-full w-full object-cover opacity-0 transition-opacity duration-500"
                  />
                )}
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-sm transition-all hover:opacity-100">
                  <FiCamera className="text-white" size={18} />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectFile}
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp"
              />
            </div>
            <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              Avatar Node
            </p>
          </div>

          {/* Form details */}
          <form onSubmit={handleUpdateProfile} className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
            {/* First Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                First Name
              </label>
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editForm.first_name}
                    disabled
                    className="cursor-not-allowed w-full rounded-xl border border-slate-100 bg-slate-100/50 px-4 py-3 text-sm font-bold text-slate-400 italic focus:outline-none"
                  />
                  <p className="text-[9px] font-medium text-slate-400">
                    Ask admin to change name
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 italic">
                  {defaultAccount.first_name || '—'}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Last Name
              </label>
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editForm.last_name}
                    disabled
                    className="cursor-not-allowed w-full rounded-xl border border-slate-100 bg-slate-100/50 px-4 py-3 text-sm font-bold text-slate-400 italic focus:outline-none"
                  />
                  <p className="text-[9px] font-medium text-slate-400">
                    Ask admin to change name
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 italic">
                  {defaultAccount.last_name || '—'}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Email Address
              </label>
              <div className="rounded-xl border border-slate-100 bg-slate-50/20 px-4 py-3 text-sm font-bold text-slate-400 italic">
                {defaultAccount.email}
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-1 hidden">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Account Status
              </label>
              <div className="flex items-center min-h-[46px]">
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase italic border',
                    defaultAccount.status === 'active'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200',
                  )}
                >
                  {defaultAccount.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Age
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  placeholder="Age"
                  min="1"
                  max="120"
                  className="focus:border-pixs-mint w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 italic placeholder-slate-300 transition-colors focus:outline-none"
                />
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 italic">
                  {defaultAccount.age || 'Not Specified'}
                </div>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="focus:border-pixs-mint w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 italic transition-colors focus:outline-none cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 italic capitalize">
                  {defaultAccount.gender || 'Not Specified'}
                </div>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-1 sm:col-span-2 hidden">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Company Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.company_name}
                  onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                  placeholder="Company name"
                  className="focus:border-pixs-mint w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 italic placeholder-slate-300 transition-colors focus:outline-none"
                />
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 italic">
                  {defaultAccount.company_name || 'Individual Profile'}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Action Buttons Section at the bottom of inputs */}
        <div className="flex justify-end gap-2 border-t border-slate-50 pt-4 mt-4">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <FiEdit size={12} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle size={12} />}
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditForm({
                    first_name: defaultAccount.first_name || '',
                    last_name: defaultAccount.last_name || '',
                    age: defaultAccount.age !== undefined && defaultAccount.age !== null ? String(defaultAccount.age) : '',
                    gender: defaultAccount.gender || '',
                    company_name: defaultAccount.company_name || '',
                  })
                }}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:scale-105 active:scale-95"
              >
                <FiX size={12} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Security Credentials Card ───────────────────────────────────────── */}
      <div className="space-y-4 rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-pixs-mint">
              <FiLock size={16} />
            </div>
            <div>
              <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                Security Credentials
              </p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Manage your password access configurations
              </p>
            </div>
          </div>
          <div className="flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Contact Management Section ───────────────────────────────────────── */}
      <div className="space-y-4 rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-pixs-mint">
              <FiPhone size={16} />
            </div>
            <div>
              <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                Contact Numbers
              </p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Manage your verified phone sequences
              </p>
            </div>
          </div>
          <div className="flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsAddingContact(!isAddingContact)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <FiPlus size={14} />
              <span>Add Number</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-50 my-2" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contacts.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSetDefaultContact(c.number)}
              className={clsx(
                'flex w-full items-center gap-4 rounded-[16px] border px-4 py-3.5 text-left transition-all hover:scale-[1.01]',
                c.is_default
                  ? 'border-pixs-mint bg-pixs-mint/5 shadow-pixs-mint/5 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200',
              )}
            >
              <div
                className={clsx(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                  c.is_default
                    ? 'bg-pixs-mint text-slate-900'
                    : 'bg-slate-50 text-slate-300',
                )}
              >
                {c.is_default ? (
                  <FiCheckCircle size={18} />
                ) : (
                  <FiPhone size={16} />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={clsx(
                    'text-sm font-black truncate',
                    c.is_default ? 'text-slate-900' : 'text-slate-600',
                  )}
                >
                  {c.number}
                </p>
                {c.is_default && (
                  <span className="text-pixs-mint text-[8px] font-black tracking-widest uppercase">
                    Active Primary
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {isAddingContact && (
          <div className="animate-in zoom-in rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-5 duration-300">
            <PhoneInputGroup
              label="Mobile Number"
              value={newContact}
              onChange={(v) => setNewContact(v || '')}
              error={contactError}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleAddContact}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-[10px] font-black tracking-widest text-white uppercase italic shadow-md transition-all hover:scale-105 active:scale-95"
              >
                Add Number
              </button>
              <button
                type="button"
                onClick={() => setIsAddingContact(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCropping && tempImage && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[20px] bg-white p-6 md:p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">
                    Edit Profile Picture
                  </h3>
                  <p className="text-[10px] font-bold tracking-[4px] text-slate-400 uppercase">
                    Crop and align your identity node
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCropping(false)}
                  className="text-slate-400 hover:text-slate-900"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="relative h-[300px] w-full overflow-hidden rounded-xl bg-slate-100">
                <Cropper
                  image={tempImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>Zoom Level</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-slate-900"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCropping(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3.5 text-[10px] font-black uppercase tracking-[4px] text-slate-400 italic transition-all hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCrop}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-3 rounded-xl bg-slate-900 py-3.5 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <FiRefreshCw className="animate-spin" />
                    ) : (
                      <FiCheckCircle />
                    )}
                    Apply & Save
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Change Password Confirmation Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md overflow-hidden rounded-[20px] bg-white p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-pixs-mint">
                  <FiLock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                    Change Password
                  </h3>
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Security Session Alignment
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-50 my-2" />

              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Are you sure you want to change your password? This will terminate your current active session and redirect you to the password reset terminal.
              </p>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-[10px] font-black uppercase tracking-[2px] text-slate-400 italic transition-all hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChangePassword}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-[10px] font-black tracking-[2px] text-white uppercase italic shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                >
                  Yes, Change
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccountInfoPage
