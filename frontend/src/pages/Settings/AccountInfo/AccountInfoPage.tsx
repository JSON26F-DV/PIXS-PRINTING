import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FiPhone,
  FiPlus,
  FiLock,
  FiMail,
  FiSend,
  FiMessageCircle,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiCamera,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
} from 'react-icons/fi'
import { clsx } from 'clsx'
import { m, AnimatePresence } from 'framer-motion'
import Cropper, { type Area } from 'react-easy-crop'
import getCroppedImg from './utils/cropImage'
import PhoneInputGroup from './components/PhoneInputGroup'
import BoxFallback from '../../../components/common/BoxFallback'
import { useAccountInfo } from './hooks/useAccountInfo'
import { validateContact } from '../../../utils/contactValidation'
import Authenticator from '../../../components/Authenticator'
import { useAuth } from '../../../context/AuthContext'
import axiosInstance from '../../../lib/axiosInstance'

const AccountInfoPage: React.FC = () => {
  const {
    defaultAccount,
    uploadProfilePicture,
    storeContact,
    setDefaultContact,
    isLoading,
  } = useAccountInfo()
  const { user, isLoading: authLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && (!user?.isLoggedIn || user?.role !== 'customer')) {
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

  // ─── Email Change States ─────────────────────────────────────────────────
  const [emailChangeStep, setEmailChangeStep] = useState<
    'idle' | 'options' | 'verify' | 'new-email'
  >('idle')
  const [newEmail, setNewEmail] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  // ─── Password Change States ───────────────────────────────────────────────
  const [passwordChangeStep, setPasswordChangeStep] = useState<
    'idle' | 'confirm' | 'verify' | 'reset' | 'success'
  >('idle')
  const [passwordChangeCooldown, setPasswordChangeCooldown] = useState(0)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [verifiedPasswordCode, setVerifiedPasswordCode] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('scroll') === 'contact-section') {
      const element = document.getElementById('contact-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [location])

  // ─── Sync contacts & preview ─────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) {
      setProfilePreview(defaultAccount.profilePicture)
      setHasImageError(false)
      setContacts(defaultAccount.contacts)
    }
  }, [isLoading, defaultAccount])

  // ─── Password Change Cooldown ────────────────────────────────────────────
  useEffect(() => {
    if (passwordChangeCooldown <= 0) return
    const timer = setInterval(() => setPasswordChangeCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [passwordChangeCooldown])


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

  // ─── Email Change Handlers ───────────────────────────────────────────────
  const handleEmailVerifySuccess = () => {
    setEmailChangeStep('new-email')
  }

  const handleUpdateEmail = async () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      toast.error('Please enter a valid email address')
      return
    }
    setIsUpdatingEmail(true)
    try {
      await axiosInstance.patch('/api/customer/profile', { email: newEmail })
      toast.success('Email updated successfully')
      setEmailChangeStep('idle')
      setNewEmail('')
    } catch {
      toast.error('Failed to update email')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  // ─── Password Change Handlers ────────────────────────────────────────────
  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[@$!%*?&#^()_\-+=.,]/.test(newPassword),
  }
  const passedCount = Object.values(passwordChecks).filter(Boolean).length
  const passwordStrength =
    passedCount <= 1 ? 'weak' : passedCount <= 3 ? 'medium' : 'strong'
  const strengthColor =
    passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
  const strengthWidth = `${(passedCount / 4) * 100}%`

  const handleSendPasswordCode = async () => {
    try {
      await axiosInstance.post('/api/settings/change-password/send-code')
      setPasswordChangeStep('verify')
      toast.success('Verification code sent to your email')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } }
      if (axiosErr?.response?.status === 429) {
        const remaining = (axiosErr?.response?.data as { cooldown_remaining?: number })?.cooldown_remaining || 60
        setPasswordChangeCooldown(remaining)
        toast.error(`Please wait ${remaining} seconds before requesting a new code`)
      } else {
        toast.error((axiosErr?.response?.data as { message?: string })?.message || 'Failed to send code')
      }
    }
  }

  const handlePasswordVerifySuccess = (code: string) => {
    setVerifiedPasswordCode(code)
    setPasswordChangeStep('reset')
  }

  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordChangeError(null)

    if (newPassword.length < 8) {
      setPasswordChangeError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      await axiosInstance.post('/api/settings/change-password/confirm', {
        code: verifiedPasswordCode,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      })
      setPasswordChangeStep('success')
      setTimeout(() => {
        setPasswordChangeStep('idle')
        setNewPassword('')
        setConfirmNewPassword('')
        setVerifiedPasswordCode('')
        toast.success('Password changed successfully')
      }, 2000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const message = axiosErr?.response?.data?.message || 'Failed to change password'
      setPasswordChangeError(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (
    isLoading ||
    authLoading ||
    !user?.isLoggedIn ||
    user?.role !== 'customer'
  ) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
          Synchronizing Identity Node...
        </div>
      </div>
    )
  }

  return (
    <div className="AccountInfoPage animate-in fade-in slide-in-from-bottom-4 min-h-screen pb-20 duration-700">
      {/* ─── Profile Information (read-only) ──────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="relative shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-[28px] border-4 border-white bg-slate-900 shadow-xl transition-transform duration-700 hover:scale-105 cursor-pointer md:h-32 md:w-32"
            >
              <BoxFallback
                className={clsx(
                  'flex h-full w-full items-center justify-center bg-slate-900 transition-opacity duration-300',
                  profilePreview && !hasImageError
                    ? 'absolute inset-0 z-0'
                    : 'relative z-10',
                )}
                iconClassName="h-12 w-12 opacity-30 brightness-0 invert md:h-16 md:w-16"
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
                <FiCamera className="text-white" size={20} />
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

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic md:text-3xl">
              {defaultAccount.first_name} {defaultAccount.last_name}
            </h1>
            <p className="mt-1 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
              {defaultAccount.company_name || 'Individual Profile'}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────────── */}
      <div className="my-8 border-t border-slate-100" />

      {/* ─── Contact Management ───────────────────────────────────────────── */}
      <section id="contact-section" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tighter text-slate-800 uppercase italic">
              Contact Numbers
            </h2>
            <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
              Manage your verified phone sequences
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingContact(!isAddingContact)}
            className="bg-pixs-mint flex items-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black tracking-widest text-slate-900 uppercase transition-all hover:shadow-lg active:scale-95 md:px-6"
          >
            <FiPlus size={16} />
            <span className="hidden md:inline">Add Contact Number</span>
          </button>
        </div>

        <div className="space-y-4">
          {contacts.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSetDefaultContact(c.number)}
              className={clsx(
                'flex w-full items-center gap-4 rounded-[24px] border-2 px-5 py-4 text-left transition-all',
                c.is_default
                  ? 'border-pixs-mint bg-pixs-mint/5 shadow-pixs-mint/10 shadow-lg'
                  : 'border-transparent bg-white hover:border-slate-200',
              )}
            >
              <div
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                  c.is_default
                    ? 'bg-pixs-mint text-slate-900'
                    : 'bg-slate-50 text-slate-300',
                )}
              >
                {c.is_default ? (
                  <FiCheckCircle size={20} />
                ) : (
                  <FiPhone size={18} />
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
          <div className="animate-in zoom-in rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-6 duration-300">
            <PhoneInputGroup
              label="Mobile Number"
              value={newContact}
              onChange={(v) => setNewContact(v || '')}
              error={contactError}
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAddContact}
                className="flex-1 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase italic"
              >
                Add Number
              </button>
              <button
                onClick={() => setIsAddingContact(false)}
                className="rounded-2xl border border-slate-200 bg-white px-6 text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ─── Divider ──────────────────────────────────────────────────────── */}
      <div className="my-8 border-t border-slate-100" />

      {/* ─── Security Section ─────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-black tracking-tighter text-slate-800 uppercase italic">
            Security & Credentials
          </h2>
          <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Manage your password and email address
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* ── Change Password ── */}
          <button
            onClick={() => setPasswordChangeStep('confirm')}
            className="flex items-center gap-4 rounded-[28px] border-2 border-transparent bg-slate-900 p-5 text-left text-white transition-all hover:scale-[1.02] active:scale-95 md:p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <FiLock size={22} />
            </div>
            <div>
              <p className="text-sm font-black tracking-wider uppercase italic">
                Change Password
              </p>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                Verify via email code
              </p>
            </div>
          </button>

          {/* ── Change Email ── */}
          <button
            onClick={() =>
              setEmailChangeStep(
                emailChangeStep === 'idle' ? 'options' : 'idle',
              )
            }
            className="flex items-center gap-4 rounded-[28px] border-2 border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-900 active:scale-95 md:p-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
              <FiMail size={22} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-black tracking-wider text-slate-900 uppercase italic">
                Change Email
              </p>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase truncate">
                {defaultAccount.email}
              </p>
            </div>
          </button>
        </div>

        {/* ── Email Change Options ── */}
        <AnimatePresence>
          {emailChangeStep === 'options' && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 space-y-4">
                <p className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic">
                  Choose how to change your email
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-900 active:scale-95"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                      <FiMessageCircle size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-wider text-slate-900 uppercase italic">
                        Chat with Admin
                      </p>
                      <p className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                        No email access? Talk to support
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setEmailChangeStep('verify')}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-900 active:scale-95"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <FiSend size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-wider text-slate-900 uppercase italic">
                        Verify via Email
                      </p>
                      <p className="text-[8px] font-bold tracking-widest text-slate-400 uppercase">
                        Send code to current email
                      </p>
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => setEmailChangeStep('idle')}
                  className="w-full text-center text-[10px] font-black tracking-widest text-slate-400 uppercase italic hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Authenticator ── */}
        <AnimatePresence>
          {emailChangeStep === 'verify' && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Authenticator
                email={defaultAccount.email}
                codeType="change_email"
                onSuccess={handleEmailVerifySuccess}
                onCancel={() => setEmailChangeStep('options')}
                autoSend
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* ── New Email Input ── */}
        <AnimatePresence>
          {emailChangeStep === 'new-email' && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 space-y-4"
            >
              <p className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic">
                Enter your new email address
              </p>
              <div className="relative">
                <FiMail
                  size={16}
                  className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new@email.com"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pr-4 pl-11 text-sm font-bold text-slate-800 italic outline-none transition-all focus:border-slate-900"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingEmail}
                  className="flex-1 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase italic transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                >
                  {isUpdatingEmail ? (
                    <FiRefreshCw className="mx-auto animate-spin" />
                  ) : (
                    'Update Email'
                  )}
                </button>
                <button
                  onClick={() => {
                    setEmailChangeStep('idle')
                    setNewEmail('')
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-6 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                >
                  Cancel
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Password Change: Confirmation ── */}
        <AnimatePresence>
          {passwordChangeStep === 'confirm' && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 space-y-4"
            >
              <div>
                <p className="text-[10px] font-black tracking-[3px] text-slate-500 uppercase italic">
                  Confirm Password Change
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  We'll send a verification code to:
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">{defaultAccount.email}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendPasswordCode}
                  disabled={passwordChangeCooldown > 0}
                  className="flex-1 rounded-2xl bg-slate-900 py-4 text-[10px] font-black tracking-widest text-white uppercase italic transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {passwordChangeCooldown > 0 ? (
                    `Wait ${passwordChangeCooldown}s`
                  ) : (
                    <>
                      <FiSend size={14} />
                      Send Code
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPasswordChangeStep('idle')}
                  className="rounded-2xl border border-slate-200 bg-white px-6 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                >
                  Cancel
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Password Change: Authenticator ── */}
        <AnimatePresence>
          {passwordChangeStep === 'verify' && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Authenticator
                email={defaultAccount.email}
                codeType="change_password"
                onSuccess={handlePasswordVerifySuccess}
                onCancel={() => setPasswordChangeStep('confirm')}
                autoSend
              />
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Password Change: Reset ── */}
        <AnimatePresence>
          {passwordChangeStep === 'reset' && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 space-y-4"
            >
              <div>
                <h3 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic">
                  Set New Password
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-12 text-sm font-semibold text-slate-800 italic outline-none focus:border-slate-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>

                {newPassword && (
                  <>
                    <div className="space-y-2">
                      <div className="flex gap-4 text-[11px] font-bold flex-wrap">
                        {[
                          { label: '8+ characters', check: passwordChecks.minLength },
                          { label: 'Uppercase letter', check: passwordChecks.hasUpper },
                          { label: 'Number', check: passwordChecks.hasNumber },
                          { label: 'Special character', check: passwordChecks.hasSpecial },
                        ].map(({ label, check }) => (
                          <span
                            key={label}
                            className={`flex items-center gap-1 ${check ? 'text-emerald-600' : 'text-slate-400'}`}
                          >
                            {check ? <FiCheckCircle size={12} /> : <FiX size={12} />}
                            {label}
                          </span>
                        ))}
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <m.div
                          layout
                          className={`h-full rounded-full ${strengthColor}`}
                          style={{ width: strengthWidth }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className={`text-[10px] font-black uppercase italic tracking-wider ${
                        passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className={`w-full rounded-2xl border bg-white px-5 py-4 pr-12 text-sm font-semibold italic outline-none transition-all focus:bg-white ${
                          confirmNewPassword && newPassword !== confirmNewPassword
                            ? 'border-rose-500'
                            : confirmNewPassword
                              ? 'border-emerald-500'
                              : 'border-slate-200 focus:border-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-[10px] font-black text-rose-500 uppercase italic flex items-center gap-1">
                        <FiAlertTriangle size={12} />
                        Passwords do not match
                      </p>
                    )}
                  </>
                )}

                {passwordChangeError && (
                  <p className="text-center text-xs font-black text-rose-500 uppercase italic flex items-center justify-center gap-2">
                    <FiAlertTriangle size={14} />
                    {passwordChangeError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !newPassword || newPassword !== confirmNewPassword}
                    className="flex-1 rounded-2xl bg-emerald-600 py-4 text-[10px] font-black tracking-widest text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? (
                      <>
                        <FiRefreshCw size={14} className="animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={14} />
                        Change Password
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordChangeStep('confirm')
                      setNewPassword('')
                      setConfirmNewPassword('')
                      setPasswordChangeError(null)
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-6 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── Password Change: Success ── */}
        <AnimatePresence>
          {passwordChangeStep === 'success' && (
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 text-center"
            >
              <div className="mb-4 flex justify-center">
                <FiCheckCircle size={64} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-black tracking-tighter text-slate-900 uppercase italic mb-2">
                Password Changed Successfully
              </h2>
              <p className="text-sm text-slate-500">
                Your password has been updated and you are still logged in
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </section>
      <AnimatePresence>
        {isCropping && tempImage && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[48px] bg-white p-10 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
                    Edit Profile Picture
                  </h3>
                  <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
                    Crop and align your identity node
                  </p>
                </div>
                <button
                  onClick={() => setIsCropping(false)}
                  className="text-slate-400 hover:text-slate-900"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="relative h-[400px] w-full overflow-hidden rounded-[32px] bg-slate-100">
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

              <div className="mt-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                    onClick={() => setIsCropping(false)}
                    className="flex-1 rounded-2xl border border-slate-100 py-5 text-[10px] font-black uppercase tracking-[4px] text-slate-400 italic transition-all hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCrop}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
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
    </div>
  )
}

export default AccountInfoPage
