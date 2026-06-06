import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  User,
  MapPin,
  Phone,
  CreditCard,
  Camera,
  X,
  RefreshCw,
  Check,
  ChevronDown
} from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import Cropper, { type Area } from 'react-easy-crop'
import Select from 'react-select'
import axiosInstance from '../../../lib/axiosInstance'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'
import BoxFallback from '../../../components/common/BoxFallback'
import getCroppedImg from '../../../pages/Settings/AccountInfo/utils/cropImage'
import {
  getAllRegions,
  getBarangaysByMunicipality,
  getMunicipalitiesByProvince,
  getProvincesByRegion
} from '@aivangogh/ph-address'

interface CustomerForm {
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  age: number | null
  gender: string
  company_name: string
  profile_picture: string
  password?: string
  addresses: {
    id?: string
    adress_label: string
    contact_number: string
    region: string
    province: string
    city: string
    barangay: string
    street: string
    postal_code: string
    is_default: boolean
  }[]
  contacts: {
    id?: string
    number: string
    is_default: boolean
  }[]
  paymentMethods: {
    id?: string
    type: string
    bank_name: string
    provider: string
    masked_number: string
    is_default: boolean
  }[]
}

const resolveAddressCodes = (addr: {
  region: string
  province: string
  city: string
  barangay: string
}) => {
  const regions = getAllRegions()
  const region = regions.find((r) => r.name.toLowerCase() === addr.region?.toLowerCase())
  const rCode = region ? region.psgcCode : ''

  const provinces = rCode ? getProvincesByRegion(rCode) : []
  const province = provinces.find((p) => p.name.toLowerCase() === addr.province?.toLowerCase())
  const pCode = province ? province.psgcCode : ''

  const cities = pCode ? getMunicipalitiesByProvince(pCode) : []
  const city = cities.find((c) => c.name.toLowerCase() === addr.city?.toLowerCase())
  const cCode = city ? city.psgcCode : ''

  const barangays = cCode ? getBarangaysByMunicipality(cCode) : []
  const barangay = barangays.find((b) => b.name.toLowerCase() === addr.barangay?.toLowerCase())
  const bCode = barangay ? barangay.psgcCode : ''

  return {
    regionCode: rCode,
    provinceCode: pCode,
    municipalityCode: cCode,
    barangayCode: bCode
  }
}

const getChangesList = (initial: any, current: any, isEmployee: boolean) => {
  const changes: string[] = []
  if (!initial) return changes

  if (initial.first_name !== current.first_name) {
    changes.push(`First Name: "${initial.first_name}" → "${current.first_name}"`)
  }
  if (initial.last_name !== current.last_name) {
    changes.push(`Last Name: "${initial.last_name}" → "${current.last_name}"`)
  }
  if (initial.email !== current.email) {
    changes.push(`Email: "${initial.email}" → "${current.email}"`)
  }
  if (initial.role !== current.role) {
    changes.push(`Role: "${initial.role}" → "${current.role}"`)
  }
  if (initial.status !== current.status) {
    changes.push(`Status: "${initial.status}" → "${current.status}"`)
  }
  if (current.password) {
    changes.push(`Password: (Password will be updated)`)
  }

  if (isEmployee) {
    if (Number(initial.daily_rate) !== Number(current.daily_rate)) {
      changes.push(`Daily Rate: ₱${initial.daily_rate} → ₱${current.daily_rate}`)
    }
    if (Number(initial.ot_rate) !== Number(current.ot_rate)) {
      changes.push(`OT Rate: ₱${initial.ot_rate} → ₱${current.ot_rate}`)
    }
  } else {
    if (initial.company_name !== current.company_name) {
      changes.push(`Company: "${initial.company_name || 'N/A'}" → "${current.company_name || 'N/A'}"`)
    }
    if (initial.age !== current.age) {
      changes.push(`Age: "${initial.age || 'N/A'}" → "${current.age || 'N/A'}"`)
    }
    if (initial.gender !== current.gender) {
      changes.push(`Gender: "${initial.gender || 'N/A'}" → "${current.gender || 'N/A'}"`)
    }
  }

  const initialContacts = initial.contacts || []
  const currentContacts = current.contacts || []
  if (initialContacts.length !== currentContacts.length) {
    changes.push(`Contacts Count: ${initialContacts.length} → ${currentContacts.length}`)
  } else {
    let numChanged = false
    currentContacts.forEach((c: any, i: number) => {
      if (initialContacts[i] && (initialContacts[i].number !== c.number || initialContacts[i].is_default !== c.is_default)) {
        numChanged = true
      }
    })
    if (numChanged) changes.push(`Contact details or defaults updated`)
  }

  const initialAddresses = initial.addresses || []
  const currentAddresses = current.addresses || []
  if (initialAddresses.length !== currentAddresses.length) {
    changes.push(`Addresses Count: ${initialAddresses.length} → ${currentAddresses.length}`)
  } else {
    let addrChanged = false
    currentAddresses.forEach((a: any, i: number) => {
      if (initialAddresses[i] && (
        initialAddresses[i].street !== a.street ||
        initialAddresses[i].barangay !== a.barangay ||
        initialAddresses[i].city !== a.city ||
        initialAddresses[i].is_default !== a.is_default
      )) {
        addrChanged = true
      }
    })
    if (addrChanged) changes.push(`Address details or defaults updated`)
  }

  const initialPMs = initial.paymentMethods || initial.payment_methods || []
  const currentPMs = current.paymentMethods || []
  if (initialPMs.length !== currentPMs.length) {
    changes.push(`Payment Methods Count: ${initialPMs.length} → ${currentPMs.length}`)
  } else {
    let pmChanged = false
    currentPMs.forEach((p: any, i: number) => {
      if (initialPMs[i] && (
        initialPMs[i].type !== p.type ||
        initialPMs[i].masked_number !== p.masked_number ||
        initialPMs[i].is_default !== p.is_default
      )) {
        pmChanged = true
      }
    })
    if (pmChanged) changes.push(`Payment method details or defaults updated`)
  }

  return changes
}

const ManageCustomer = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [loading, setLoading] = useState(isEditing)

  // Profile Picture States
  const [profilePreview, setProfilePreview] = useState('')
  const [hasImageError, setHasImageError] = useState(false)
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initial and confirmation modal states
  const [initialData, setInitialData] = useState<CustomerForm | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [formDataToSubmit, setFormDataToSubmit] = useState<CustomerForm | null>(null)

  // Local state for address dropdown codes, keyed by index
  const [addressCodes, setAddressCodes] = useState<
    Record<
      number,
      {
        regionCode: string
        provinceCode: string
        municipalityCode: string
        barangayCode: string
      }
    >
  >({})

  const { register, control, handleSubmit, reset, setValue, watch } = useForm<CustomerForm>({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      role: 'customer',
      status: 'active',
      age: null,
      gender: '',
      company_name: '',
      profile_picture: '',
      addresses: [],
      contacts: [],
      paymentMethods: []
    }
  })

  // Watch fields to reactively render single defaults
  const watchContacts = watch('contacts') || []
  const watchAddresses = watch('addresses') || []
  const watchPaymentMethods = watch('paymentMethods') || []

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control,
    name: 'addresses'
  })

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: 'contacts'
  })

  const { fields: pmFields, append: appendPM, remove: removePM } = useFieldArray({
    control,
    name: 'paymentMethods'
  })

  // Region options are static and memoized
  const regionOptions = useMemo(
    () => getAllRegions().map((r) => ({ value: r.psgcCode, label: r.name })),
    []
  )

  useEffect(() => {
    if (isEditing) {
      fetchCustomer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const { data } = await axiosInstance.get(`/api/admin/accounts/customer/${id}`)
      if (data.status === 'success') {
        const customerData = data.data

        // Fix payment methods naming mismatch
        if (customerData.payment_methods) {
          customerData.paymentMethods = customerData.payment_methods
          delete customerData.payment_methods
        }

        // Save clone of original API data for comparison diff
        setInitialData(JSON.parse(JSON.stringify(customerData)))
        reset(customerData)

        if (customerData.profile_picture) {
          setProfilePreview(customerData.profile_picture)
          setHasImageError(false)
        }

        // Initialize address dropdown codes
        const initialCodes: Record<
          number,
          {
            regionCode: string
            provinceCode: string
            municipalityCode: string
            barangayCode: string
          }
        > = {}
        customerData.addresses?.forEach((addr: CustomerForm['addresses'][number], idx: number) => {
          initialCodes[idx] = resolveAddressCodes(addr)
        })
        setAddressCodes(initialCodes)
      }
    } catch {
      toast.error('Failed to fetch customer details')
      navigate('/admin/account')
    } finally {
      setLoading(false)
    }
  }

  const executeSubmit = async (data: CustomerForm) => {
    try {
      const url = isEditing
        ? `/api/admin/accounts/customer/${id}`
        : `/api/admin/accounts/customer/${new Date().getTime().toString()}`

      const payload = { ...data }
      if (!payload.password) delete payload.password

      await axiosInstance.put(url, payload)
      toast.success(isEditing ? 'Customer updated successfully' : 'Customer created successfully')
      navigate('/admin/account')
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Error saving customer data')
      } else {
        toast.error('Error saving customer data')
      }
    }
  }

  const onSubmit = (data: CustomerForm) => {
    setFormDataToSubmit(data)
    setShowConfirmModal(true)
  }

  // Profile Picture Crop & Upload handlers
  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const handleApplyCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return

    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels)
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('profile_picture', file)
      if (id) {
        formData.append('id', id)
      }

      const response = await axiosInstance.post(
        '/api/admin/accounts/upload-profile-picture',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      if (response.data.status === 'success' && response.data.url) {
        const filename = response.data.url
        setValue('profile_picture', filename)
        setProfilePreview(filename)
        setHasImageError(false)
        toast.success('Profile picture uploaded')
      } else {
        toast.error('Failed to upload profile picture')
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

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading customer data...</div>
  }

  return (
    <div className="mx-auto max-w-[1000px] animate-in fade-in space-y-4 md:space-y-8 p-4 md:p-8 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4">
          <Link
            to="/admin/account"
            className="flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg md:text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              {isEditing ? 'Manage Customer' : 'Provision Customer'}
            </h1>
            <p className="text-[9px] md:text-xs font-bold tracking-[2px] text-slate-400 uppercase">
              {isEditing ? `ID: ${id}` : 'New Registration'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          className="flex items-center justify-center gap-2 rounded-[20px] bg-[#75EEA5] px-4 py-3 md:px-8 md:py-4 text-xs font-black tracking-widest text-slate-900 shadow-xl shadow-[#75EEA5]/20 transition-all hover:-translate-y-1 hover:bg-[#5de291]"
        >
          <Save size={16} />
          <span className="hidden md:inline">SAVE CHANGES</span>
        </button>
      </div>

      <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-4 md:p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-4 md:mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <User size={20} />
            </div>
            <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase italic">Basic Information</h2>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Profile Picture Upload Section */}
            <div className="md:col-span-2 flex flex-col items-center gap-3 md:gap-4 border border-dashed border-slate-200 rounded-2xl p-4 md:p-6 bg-slate-50/50">
              <label className="block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase self-start">Profile Picture</label>
              <div className="relative group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-20 w-20 md:h-32 md:w-32 overflow-hidden rounded-[16px] md:rounded-[40px] border-4 border-white bg-slate-900 shadow-xl transition-transform duration-300 hover:scale-105 cursor-pointer"
                >
                  <BoxFallback
                    className={`flex h-full w-full items-center justify-center bg-slate-900 transition-opacity duration-300 ${
                      profilePreview && !hasImageError ? 'absolute inset-0 z-0' : 'relative z-10'
                    }`}
                    iconClassName="h-8 w-8 md:h-12 md:w-12 opacity-30 brightness-0 invert"
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
                      className="relative z-10 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                    />
                  )}
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100">
                    <Camera className="text-white" size={20} />
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
              <p className="text-[8px] md:text-[9px] font-black tracking-widest text-slate-400 uppercase">Click to change profile picture</p>
            </div>

            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">First Name</label>
              <input {...register('first_name', { required: true })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Last Name</label>
              <input {...register('last_name', { required: true })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Email</label>
              <input type="email" {...register('email', { required: true })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Password (Leave empty to keep)</label>
              <input type="password" {...register('password')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Role</label>
              <div className="relative">
                <select {...register('role')} className="appearance-none w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 pr-8 md:pr-10 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none">
                  <option value="customer">Customer</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Status</label>
              <div className="relative">
                <select {...register('status')} className="appearance-none w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 pr-8 md:pr-10 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Age</label>
              <input type="number" {...register('age')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Gender</label>
              <div className="relative">
                <select {...register('gender')} className="appearance-none w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 pr-8 md:pr-10 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 md:mb-2 block text-[9px] md:text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Company Name</label>
              <input {...register('company_name')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3 text-sm md:text-base font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
        </section>

        {/* Contact Numbers */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-4 md:p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <Phone size={20} />
              </div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase italic">Contact Numbers</h2>
            </div>
            <button
              type="button"
              onClick={() => appendContact({ number: '', is_default: contactFields.length === 0 })}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 md:px-4 md:py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Add Contact</span>
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            {contactFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3 md:gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:p-4">
                <div className="flex-1 min-w-0">
                  <input placeholder="Phone Number" {...register(`contacts.${index}.number`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base font-bold text-slate-900 focus:outline-none" />
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <input
                    type="radio"
                    name="contacts_default_radio"
                    checked={watchContacts[index]?.is_default === true}
                    onChange={() => {
                      contactFields.forEach((_, idx) => {
                        setValue(`contacts.${idx}.is_default`, idx === index)
                      })
                    }}
                    className="h-4 w-4 md:h-5 md:w-5 border-slate-300 accent-slate-900 cursor-pointer"
                  />
                  <span className="text-[9px] md:text-xs font-bold text-slate-500">Default</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const wasDefault = watchContacts[index]?.is_default
                    removeContact(index)
                    if (wasDefault && contactFields.length > 1) {
                      // fallback next index to default
                      const nextIdx = index === 0 ? 0 : index - 1
                      setTimeout(() => {
                        setValue(`contacts.${nextIdx}.is_default`, true)
                      }, 0)
                    }
                  }}
                  className="rounded-lg p-1.5 md:p-2 text-rose-500 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-4 md:p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <CreditCard size={20} />
              </div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase italic">Payment Methods</h2>
            </div>
            <button
              type="button"
              onClick={() => appendPM({ type: '', bank_name: '', provider: '', masked_number: '', is_default: false })}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 md:px-4 md:py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Add Payment Method</span>
            </button>
          </div>

          <div className="space-y-3 md:space-y-4">
            {pmFields.map((field, index) => (
              <div key={field.id} className="relative grid gap-3 md:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6 md:grid-cols-2">
                <button type="button" onClick={() => removePM(index)} className="absolute right-3 top-3 md:right-4 md:top-4 rounded-lg p-1.5 md:p-2 text-rose-500 hover:bg-rose-50 z-10">
                  <Trash2 size={16} />
                </button>
                <div className="md:col-span-2 flex items-center gap-2 mb-1 md:mb-2">
                  <input
                    type="radio"
                    name="payment_methods_default_radio"
                    checked={watchPaymentMethods[index]?.is_default === true}
                    onChange={() => {
                      pmFields.forEach((_, idx) => {
                        setValue(`paymentMethods.${idx}.is_default`, idx === index)
                      })
                    }}
                    className="h-4 w-4 md:h-5 md:w-5 border-slate-300 accent-slate-900 cursor-pointer"
                  />
                  <span className="text-[9px] md:text-xs font-bold text-slate-500">Set as Default Payment</span>
                </div>
                <div>
                  <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Type</label>
                  <div className="relative">
                    <select {...register(`paymentMethods.${index}.type`)} className="appearance-none w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-bold text-slate-900 focus:outline-none">
                      <option value="">Select Type</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="ewallet">E-Wallet</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="cod">Cash on Delivery (COD)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Provider (e.g., Visa)</label>
                  <input {...register(`paymentMethods.${index}.provider`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Bank Name</label>
                  <input {...register(`paymentMethods.${index}.bank_name`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Masked Number (e.g., **** 1234)</label>
                  <input {...register(`paymentMethods.${index}.masked_number`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Addresses */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-4 md:p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                <MapPin size={20} />
              </div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900 uppercase italic">Addresses</h2>
            </div>
            <button
              type="button"
              onClick={() => appendAddress({ adress_label: '', contact_number: '', region: '', province: '', city: '', barangay: '', street: '', postal_code: '', is_default: false })}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 md:px-4 md:py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Add Address</span>
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            {addressFields.map((field, index) => {
              const codes = addressCodes[index] || {
                regionCode: '',
                provinceCode: '',
                municipalityCode: '',
                barangayCode: ''
              }

              const provinceOptions = codes.regionCode
                ? getProvincesByRegion(codes.regionCode).map((p) => ({ value: p.psgcCode, label: p.name }))
                : []

              const cityOptions = codes.provinceCode
                ? getMunicipalitiesByProvince(codes.provinceCode).map((m) => ({ value: m.psgcCode, label: m.name }))
                : []

              const barangayOptions = codes.municipalityCode
                ? getBarangaysByMunicipality(codes.municipalityCode).map((b) => ({ value: b.psgcCode, label: b.name }))
                : []

              return (
                <div key={field.id} className="relative grid gap-3 md:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      removeAddress(index)
                      setAddressCodes((prev) => {
                        const next = { ...prev }
                        delete next[index]
                        return next
                      })
                    }}
                    className="absolute right-3 top-3 md:right-4 md:top-4 rounded-lg p-1.5 md:p-2 text-rose-500 hover:bg-rose-50 z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="md:col-span-2 flex items-center gap-2 mb-1 md:mb-2">
                    <input
                      type="radio"
                      name="addresses_default_radio"
                      checked={watchAddresses[index]?.is_default === true}
                      onChange={() => {
                        addressFields.forEach((_, idx) => {
                          setValue(`addresses.${idx}.is_default`, idx === index)
                        })
                      }}
                      className="h-4 w-4 md:h-5 md:w-5 border-slate-300 accent-slate-900 cursor-pointer"
                    />
                    <span className="text-[9px] md:text-xs font-bold text-slate-500">Set as Default Address</span>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Address Label (e.g. Home/Work)</label>
                    <input {...register(`addresses.${index}.adress_label`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Contact Number</label>
                    <input {...register(`addresses.${index}.contact_number`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Street / Bldg / Unit</label>
                    <input {...register(`addresses.${index}.street`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>

                  {/* Dropdowns */}
                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Region</label>
                    <Select
                      options={regionOptions}
                      value={regionOptions.find((o) => o.value === codes.regionCode) || null}
                      onChange={(opt) => {
                        const rCode = opt?.value ?? ''
                        setAddressCodes((prev) => ({
                          ...prev,
                          [index]: {
                            regionCode: rCode,
                            provinceCode: '',
                            municipalityCode: '',
                            barangayCode: ''
                          }
                        }))
                        setValue(`addresses.${index}.region`, opt?.label ?? '')
                        setValue(`addresses.${index}.province`, '')
                        setValue(`addresses.${index}.city`, '')
                        setValue(`addresses.${index}.barangay`, '')
                      }}
                      placeholder="Select Region"
                      className="text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Province</label>
                    <Select
                      options={provinceOptions}
                      value={provinceOptions.find((o) => o.value === codes.provinceCode) || null}
                      onChange={(opt) => {
                        const pCode = opt?.value ?? ''
                        setAddressCodes((prev) => ({
                          ...prev,
                          [index]: {
                            ...prev[index],
                            provinceCode: pCode,
                            municipalityCode: '',
                            barangayCode: ''
                          }
                        }))
                        setValue(`addresses.${index}.province`, opt?.label ?? '')
                        setValue(`addresses.${index}.city`, '')
                        setValue(`addresses.${index}.barangay`, '')
                      }}
                      placeholder="Select Province"
                      isDisabled={!codes.regionCode}
                      className="text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">City</label>
                    <Select
                      options={cityOptions}
                      value={cityOptions.find((o) => o.value === codes.municipalityCode) || null}
                      onChange={(opt) => {
                        const cCode = opt?.value ?? ''
                        setAddressCodes((prev) => ({
                          ...prev,
                          [index]: {
                            ...prev[index],
                            municipalityCode: cCode,
                            barangayCode: ''
                          }
                        }))
                        setValue(`addresses.${index}.city`, opt?.label ?? '')
                        setValue(`addresses.${index}.barangay`, '')
                      }}
                      placeholder="Select City"
                      isDisabled={!codes.provinceCode}
                      className="text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Barangay</label>
                    <Select
                      options={barangayOptions}
                      value={barangayOptions.find((o) => o.value === codes.barangayCode) || null}
                      onChange={(opt) => {
                        const bCode = opt?.value ?? ''
                        setAddressCodes((prev) => ({
                          ...prev,
                          [index]: {
                            ...prev[index],
                            barangayCode: bCode
                          }
                        }))
                        setValue(`addresses.${index}.barangay`, opt?.label ?? '')
                      }}
                      placeholder="Select Barangay"
                      isDisabled={!codes.municipalityCode}
                      className="text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] md:text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Postal Code</label>
                    <input {...register(`addresses.${index}.postal_code`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </form>

      {/* Cropping Modal */}
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
                  <h3 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">Edit Profile Picture</h3>
                  <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase">Crop and align image</p>
                </div>
                <button onClick={() => setIsCropping(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={24} />
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
                    {isUploading ? <RefreshCw className="animate-spin" /> : <Check />}
                    Apply & Save
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmModal && formDataToSubmit && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[28px] bg-white p-8 shadow-2xl overflow-hidden"
            >
              <h3 className="mb-4 text-xl font-black text-slate-900 uppercase italic">
                Confirm Account Action
              </h3>
              
              <div className="mb-6 rounded-2xl bg-slate-50 p-6 max-h-[300px] overflow-y-auto">
                {isEditing ? (
                  <div>
                    <p className="mb-3 font-mono text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Modified Properties
                    </p>
                    {getChangesList(initialData, formDataToSubmit, false).length > 0 ? (
                      <ul className="space-y-2 text-xs font-bold text-slate-700">
                        {getChangesList(initialData, formDataToSubmit, false).map((change, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs font-bold text-slate-500 italic">No changes detected in fields.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 font-mono text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Account Registration Details
                    </p>
                    <ul className="space-y-2 text-xs font-bold text-slate-700">
                      <li>Name: {formDataToSubmit.first_name} {formDataToSubmit.last_name}</li>
                      <li>Email: {formDataToSubmit.email}</li>
                      <li>Role: {formDataToSubmit.role}</li>
                      <li>Status: {formDataToSubmit.status}</li>
                      <li>Company: {formDataToSubmit.company_name || 'N/A'}</li>
                      <li>Age: {formDataToSubmit.age || 'N/A'}</li>
                      <li>Gender: {formDataToSubmit.gender || 'N/A'}</li>
                      <li>Contacts: {formDataToSubmit.contacts?.length || 0} registered</li>
                      <li>Addresses: {formDataToSubmit.addresses?.length || 0} registered</li>
                      <li>Payment Methods: {formDataToSubmit.paymentMethods?.length || 0} registered</li>
                    </ul>
                  </div>
                )}
              </div>

              <p className="mb-6 text-sm font-bold text-slate-600">
                Are you sure you want to {isEditing ? 'update' : 'create'} this customer account?
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-xs font-black tracking-widest text-slate-600 uppercase hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowConfirmModal(false)
                    await executeSubmit(formDataToSubmit)
                  }}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-black tracking-widest text-[#75EEA5] uppercase hover:bg-slate-800 transition-colors"
                >
                  Yes, Confirm
                </button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManageCustomer
