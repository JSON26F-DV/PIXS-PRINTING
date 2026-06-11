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
