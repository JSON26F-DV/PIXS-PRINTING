import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiCamera,
  FiCheckCircle,
  FiPhone,
  FiPlus,
  FiShield,
  FiAlertCircle,
  FiRefreshCw,
  FiX,
  // FiBriefcase,
} from 'react-icons/fi'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import Cropper, { type Area } from 'react-easy-crop'
import getCroppedImg from './utils/cropImage'
import AccountInputField from './components/AccountInputField'
import PhoneInputGroup from './components/PhoneInputGroup'
import BoxFallback from '../../../components/common/BoxFallback'
import { useAccountInfo } from './hooks/useAccountInfo'
import { useOTPVerification } from '../../../hooks/useOTPVerification'
import {
  calculatePasswordStrength,
  getStrengthLabel,
} from '../../../utils/passwordValidation'
import { validateContact } from '../../../utils/contactValidation'
import {
  profileSchema,
  passwordFormSchema,
  type ProfileFormValues,
  type PasswordFormValues,
} from './utils/validation'

import { useAuth } from '../../../context/AuthContext'

const AccountInfoPage: React.FC = () => {
  const {
    defaultAccount,
    updateProfile,
    updatePassword,
    uploadProfilePicture,
    storeContact,
    setDefaultContact,
    isLoading,
  } = useAccountInfo()
  const { user, isLoading: authLoading } = useAuth()
  const otp = useOTPVerification()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && (!user?.isLoggedIn || user?.role !== 'customer')) {
      navigate('/')
    }
  }, [authLoading, user, navigate])

  // ─── States ──────────────────────────────────────────────────────────────
  const [profilePreview, setProfilePreview] = useState(
    defaultAccount.profilePicture,
  )
  const [hasImageError, setHasImageError] = useState(false)
  
  // ─── Cropping States ───────────────────────────────────────────────────
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [contacts, setContacts] = useState(defaultAccount.contacts)
  const [isAddingContact, setIsAddingContact] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('action') === 'add-contact'
  })
  const [newContact, setNewContact] = useState('')
  const [contactError, setContactError] = useState('')

  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [otpInput, setOtpInput] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Navigation Logic ───────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('scroll') === 'contact-section') {
      const element = document.getElementById('contact-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [location])

  // ─── Form Logic ──────────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: defaultAccount.first_name,
      last_name: defaultAccount.last_name,
      email: defaultAccount.email,
      company_name: defaultAccount.company_name || '',
    },
  })

  // Sync form with loaded data
  useEffect(() => {
    if (!isLoading) {
      resetProfile({
        first_name: defaultAccount.first_name,
        last_name: defaultAccount.last_name,
        email: defaultAccount.email,
        company_name: defaultAccount.company_name || '',
      })
      setTimeout(() => {
        setProfilePreview(defaultAccount.profilePicture)
        setHasImageError(false)
        setContacts(defaultAccount.contacts)
      }, 0)
    }
  }, [isLoading, defaultAccount, resetProfile])

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    control: controlPass,
    formState: { errors: passErrors, isSubmitting: isSubmittingPass },
    reset: resetPass,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const newPassValue =
    useWatch({ control: controlPass, name: 'newPassword' }) || ''
  const strength = calculatePasswordStrength(newPassValue)
  const strengthInfo = getStrengthLabel(strength)

  // ─── Handlers ────────────────────────────────────────────────────────────
  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleApplyCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return

    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels)
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' })
      
      const result = await uploadProfilePicture(file)
      if (result.success && result.url) {
        setProfilePreview(result.url)
        toast.success('Profile picture updated')
      } else {
        toast.error(result.error || 'Failed to upload profile picture')
      }
    } catch (e) {
      console.error(e)
      toast.error('Error processing image')
    } finally {
      setIsUploading(false)
      setIsCropping(false)
      setTempImage(null)
    }
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB

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

  const onProfileUpdate = async (values: ProfileFormValues) => {
    const result = await updateProfile(values)
    if (result.success) toast.success('Profile updated successfully.')
  }

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

    // API Call
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

  const handlePasswordResetComplete = async (values: PasswordFormValues) => {
    const result = await updatePassword(values)
    if (result.success) {
      toast.success('Password changed successfully.')
      resetPass()
      otp.resetVerification()
      setOtpInput('')
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
    <div className="AccountInfoPage animate-in fade-in slide-in-from-bottom-4 min-h-screen space-y-12 pb-20 duration-700">
      {/* ─── Profile Information ────────────────────────────────────────────── */}
      <section className="ProfileSection group relative overflow-hidden rounded-[44px] border border-slate-50 bg-white p-10 shadow-2xl shadow-slate-100">
        <div className="mb-5 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
            {defaultAccount.company_name || 'Individual Profile'}
          </h1>
          <p className="mt-2 text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
            Registered Company / Shop
          </p>
        </div>
        <div className="flex flex-col items-center gap-10 md:flex-row">
          <div className="relative">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative h-40 w-40 overflow-hidden rounded-[56px] border-4 border-white bg-slate-900 shadow-2xl transition-transform duration-700 group-hover:scale-105 cursor-pointer"
            >
              <BoxFallback 
                className={clsx(
                  "flex h-full w-full items-center justify-center bg-slate-900 transition-opacity duration-300",
                  profilePreview && !hasImageError ? "absolute inset-0 z-0" : "relative z-10"
                )} 
                iconClassName="h-16 w-16 opacity-30 brightness-0 invert" 
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
              <div
                className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100"
              >
                <FiCamera className="text-white" size={32} />
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

          {/* ── Cropping Modal ── */}
          <AnimatePresence>
            {isCropping && tempImage && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative w-full max-w-2xl overflow-hidden rounded-[48px] bg-white p-10 shadow-2xl"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">Edit Profile Picture</h3>
                      <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">Crop and align your identity node</p>
                    </div>
                    <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-slate-900">
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
                        {isUploading ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                        Apply & Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleProfileSubmit(onProfileUpdate)}
            className="flex-1 space-y-8"
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <AccountInputField
                label="First Name"
                icon={FiUser}
                registration={regProfile('first_name')}
                error={profileErrors.first_name}
              />
              <AccountInputField
                label="Last Name"
                icon={FiUser}
                registration={regProfile('last_name')}
                error={profileErrors.last_name}
              />
              <AccountInputField
                label="Email Address"
                icon={FiMail}
                registration={regProfile('email')}
                error={profileErrors.email}
              />
            </div>
            <div className="flex justify-end">
              <button
                disabled={isSubmittingProfile}
                className="flex items-center gap-3 rounded-[24px] bg-slate-900 px-12 py-5 text-[10px] font-black tracking-[4px] text-white uppercase italic transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                {isSubmittingProfile ? (
                  <FiRefreshCw className="animate-spin" />
                ) : (
                  <FiCheckCircle />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── Contact Management ──────────────────────────────────────────────── */}
      <section
        id="contact-section"
        className="ContactNumbersSection space-y-10 rounded-[44px] border border-slate-50 bg-white p-10 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-50 pb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-800 uppercase italic">
              Contact Numbers
            </h2>
            <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">
              Manage your verified phone sequences
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingContact(!isAddingContact)}
            className="bg-pixs-mint flex items-center gap-2 rounded-2xl px-6 py-3 text-[10px] font-black tracking-widest text-slate-900 uppercase transition-all hover:shadow-lg active:scale-95"
          >
            <FiPlus size={16} /> Add Contact Number
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">
              Primary Contact Number
            </label>

            <div className="flex flex-wrap gap-4">
              {contacts.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSetDefaultContact(c.number)}
                  className={clsx(
                    'group flex items-center gap-4 rounded-[24px] border-2 px-6 py-4 text-left transition-all',
                    c.is_default
                      ? 'border-pixs-mint bg-pixs-mint/5 shadow-pixs-mint/10 shadow-lg'
                      : c.number.startsWith('0')
                        ? 'border-transparent bg-white hover:border-slate-200'
                        : 'border-slate-100 bg-white hover:border-slate-200',
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                      c.is_default
                        ? 'bg-pixs-mint text-slate-900'
                        : 'bg-slate-50 text-slate-300 group-hover:text-slate-400',
                    )}
                  >
                    {c.is_default ? (
                      <FiCheckCircle size={20} />
                    ) : (
                      <FiPhone size={18} />
                    )}
                  </div>
                  <div>
                    <p
                      className={clsx(
                        'text-sm font-black',
                        c.is_default ? 'text-slate-900' : 'text-slate-600',
                      )}
                    >
                      {c.number}
                    </p>
                    {c.is_default === true && (
                      <span className="text-pixs-mint text-[8px] font-black tracking-widest uppercase">
                        Active Primary
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isAddingContact && (
            <div className="AddContactForm animate-in zoom-in rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-8 duration-300">
              <PhoneInputGroup
                label="Mobile Number"
                value={newContact}
                onChange={(v) => setNewContact(v || '')}
                error={contactError}
              />
              <div className="mt-6 flex gap-4">
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
        </div>
      </section>

      {/* ─── Password Security ───────────────────────────────────────────────── */}
      <section className="PasswordSection relative overflow-hidden rounded-[44px] bg-slate-900 p-10 shadow-2xl shadow-slate-900/40">
        <div className="mb-12 flex items-center gap-6 border-b border-white/5 pb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-[28px] border border-white/10 bg-white/5">
            <FiShield className="text-rose-500" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
              Security & Password
            </h2>
            <p className="text-[10px] font-black tracking-[4px] text-slate-500 uppercase">
              Update your account credentials
            </p>
          </div>
        </div>

        {/* Verification Flow */}
        {otp.step === 'method' && (
          <div className="VerificationMethodSection animate-in slide-in-from-left space-y-8 duration-500">
            <p className="text-[10px] font-black tracking-[2px] text-slate-300 uppercase italic">
              Verify your identity to change password
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                onClick={() => otp.sendCode('email')}
                className="VerificationOption group hover:border-pixs-mint/40 rounded-[32px] border border-white/10 bg-white/5 p-8 text-left transition-all"
              >
                <FiMail className="text-pixs-mint mb-4" size={24} />
                <h4 className="text-sm font-black tracking-widest text-white uppercase italic">
                  Via Email
                </h4>
                <p className="mt-1 text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                  To {defaultAccount.email}
                </p>
              </button>

              <div className="group relative">
                <div className="hover:border-pixs-mint/40 rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all">
                  <FiPhone className="mb-4 text-amber-500" size={24} />
                  <h4 className="text-sm font-black tracking-widest text-white uppercase italic">
                    Via SMS
                  </h4>
                  <select
                    className="mt-2 w-full cursor-pointer border-b border-white/10 bg-transparent pb-2 text-[10px] font-black tracking-widest text-slate-300 uppercase outline-none"
                    onChange={() => otp.sendCode('sms')}
                  >
                    <option className="bg-slate-900" value="">
                      Select phone number...
                    </option>
                    {contacts.map((c, i) => (
                      <option className="bg-slate-900" key={i} value={c.number}>
                        {c.number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {otp.step === 'otp' && (
          <div className="OTPInputSection animate-in zoom-in space-y-10 text-center duration-500">
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                Enter Verification Code
              </h3>
              <p className="text-pixs-mint text-[10px] font-black tracking-[3px] uppercase">
                Sent to your {otp.method?.toUpperCase()}
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="focus-within:border-pixs-mint rounded-[32px] border-2 border-white/10 bg-white/5 p-2 transition-all">
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) =>
                    setOtpInput(e.target.value.replace(/\D/g, ''))
                  }
                  className="caret-pixs-mint w-64 bg-transparent text-center text-5xl font-black tracking-[12px] text-white outline-none"
                  disabled={otp.isLocked}
                  placeholder="000000"
                />
              </div>

              {otp.isLocked ? (
                <div className="flex items-center gap-3 text-rose-500 italic">
                  <FiAlertCircle size={18} />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    Try again in 30 seconds
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => otp.verifyOTP(otpInput)}
                  className="bg-pixs-mint rounded-[24px] px-12 py-5 text-[10px] font-black tracking-[4px] text-slate-900 uppercase italic transition-all hover:scale-105 active:scale-95"
                >
                  Verify Identity
                </button>
              )}
            </div>
          </div>
        )}

        {otp.step === 'verified' && (
          <form
            onSubmit={handlePassSubmit(handlePasswordResetComplete)}
            className="animate-in slide-in-from-bottom-8 space-y-10 duration-700"
          >
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="space-y-6">
                <div className="relative">
                  <FiLock
                    size={16}
                    className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-600"
                  />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    {...regPass('newPassword')}
                    placeholder="New Password"
                    className="focus:border-pixs-mint w-full rounded-[28px] border border-white/10 bg-white/5 py-6 pr-16 pl-16 text-sm font-bold text-white italic transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute top-1/2 right-6 -translate-y-1/2 text-slate-600 hover:text-white"
                  >
                    {showNewPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                {passErrors.newPassword && (
                  <p className="px-4 text-[9px] font-black text-rose-500 uppercase italic">
                    {passErrors.newPassword.message}
                  </p>
                )}

                <div className="space-y-3 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">
                      Security Strength
                    </span>
                    <span
                      className={clsx(
                        'text-[8px] font-black tracking-widest uppercase italic',
                        strengthInfo.color,
                      )}
                    >
                      {strengthInfo.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={clsx(
                        'h-full transition-all duration-700',
                        strengthInfo.bar,
                      )}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <FiLock
                    size={16}
                    className="absolute top-1/2 left-6 -translate-y-1/2 text-slate-600"
                  />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    {...regPass('confirmPassword')}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Confirm Password"
                    className="focus:border-pixs-mint w-full rounded-[28px] border border-white/10 bg-white/5 py-6 pr-16 pl-16 text-sm font-bold text-white italic transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute top-1/2 right-6 -translate-y-1/2 text-slate-600 hover:text-white"
                  >
                    {showConfirmPass ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
                {passErrors.confirmPassword && (
                  <p className="px-4 text-[9px] font-black text-rose-500 uppercase italic">
                    {passErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-white/5 pt-6">
              <button
                type="submit"
                disabled={isSubmittingPass}
                className="rounded-[32px] bg-rose-500 px-16 py-6 text-sm font-black tracking-[6px] text-white uppercase italic shadow-2xl shadow-rose-900/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                {isSubmittingPass ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default AccountInfoPage
