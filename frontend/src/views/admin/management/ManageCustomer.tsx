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
  Check
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

  const onSubmit = async (data: CustomerForm) => {
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
    <div className="mx-auto max-w-[1000px] animate-in fade-in space-y-8 px-4 pb-16 pt-8 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/account"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              {isEditing ? 'Manage Customer' : 'Provision Customer'}
            </h1>
            <p className="text-xs font-bold tracking-[2px] text-slate-400 uppercase">
              {isEditing ? `ID: ${id}` : 'New Registration'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          className="flex items-center gap-2 rounded-[20px] bg-[#75EEA5] px-8 py-4 text-xs font-black tracking-widest text-slate-900 shadow-xl shadow-[#75EEA5]/20 transition-all hover:-translate-y-1 hover:bg-[#5de291]"
        >
          <Save size={16} />
          SAVE CHANGES
        </button>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Information */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <User size={20} />
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Basic Information</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Picture Upload Section */}
            <div className="md:col-span-2 flex flex-col items-center gap-4 border border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
              <label className="block text-[10px] font-black tracking-[2px] text-slate-400 uppercase self-start">Profile Picture</label>
              <div className="relative group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-32 w-32 overflow-hidden rounded-[40px] border-4 border-white bg-slate-900 shadow-xl transition-transform duration-300 hover:scale-105 cursor-pointer"
                >
                  <BoxFallback
                    className={`flex h-full w-full items-center justify-center bg-slate-900 transition-opacity duration-300 ${
                      profilePreview && !hasImageError ? 'absolute inset-0 z-0' : 'relative z-10'
                    }`}
                    iconClassName="h-12 w-12 opacity-30 brightness-0 invert"
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
                    <Camera className="text-white" size={24} />
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
              <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Click to change profile picture</p>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">First Name</label>
              <input {...register('first_name', { required: true })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Last Name</label>
              <input {...register('last_name', { required: true })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Email</label>
              <input type="email" {...register('email', { required: true })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Password (Leave empty to keep)</label>
              <input type="password" {...register('password')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Role</label>
              <select {...register('role')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none">
                <option value="customer">Customer</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Status</label>
              <select {...register('status')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Age</label>
              <input type="number" {...register('age')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Gender</label>
              <select {...register('gender')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-black tracking-[2px] text-slate-400 uppercase">Company Name</label>
              <input {...register('company_name')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
        </section>

        {/* Contact Numbers */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <Phone size={20} />
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Contact Numbers</h2>
            </div>
            <button
              type="button"
              onClick={() => appendContact({ number: '', is_default: contactFields.length === 0 })}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Plus size={16} /> Add Contact
            </button>
          </div>

          <div className="space-y-4">
            {contactFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex-1">
                  <input placeholder="Phone Number" {...register(`contacts.${index}.number`)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-900 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="contacts_default_radio"
                    checked={watchContacts[index]?.is_default === true}
                    onChange={() => {
                      contactFields.forEach((_, idx) => {
                        setValue(`contacts.${idx}.is_default`, idx === index)
                      })
                    }}
                    className="h-5 w-5 border-slate-300 accent-slate-900 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500">Default</span>
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
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <CreditCard size={20} />
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Payment Methods</h2>
            </div>
            <button
              type="button"
              onClick={() => appendPM({ type: '', bank_name: '', provider: '', masked_number: '', is_default: false })}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Plus size={16} /> Add Payment Method
            </button>
          </div>

          <div className="space-y-4">
            {pmFields.map((field, index) => (
              <div key={field.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2 relative">
                <button type="button" onClick={() => removePM(index)} className="absolute right-4 top-4 rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                  <Trash2 size={18} />
                </button>
                <div className="md:col-span-2 flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="payment_methods_default_radio"
                    checked={watchPaymentMethods[index]?.is_default === true}
                    onChange={() => {
                      pmFields.forEach((_, idx) => {
                        setValue(`paymentMethods.${idx}.is_default`, idx === index)
                      })
                    }}
                    className="h-5 w-5 border-slate-300 accent-slate-900 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500">Set as Default Payment</span>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Type</label>
                  <select {...register(`paymentMethods.${index}.type`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none">
                    <option value="">Select Type</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cod">Cash on Delivery (COD)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Provider (e.g., Visa)</label>
                  <input {...register(`paymentMethods.${index}.provider`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Bank Name</label>
                  <input {...register(`paymentMethods.${index}.bank_name`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Masked Number (e.g., **** 1234)</label>
                  <input {...register(`paymentMethods.${index}.masked_number`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Addresses */}
        <section className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
                <MapPin size={20} />
              </div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase italic">Addresses</h2>
            </div>
            <button
              type="button"
              onClick={() => appendAddress({ adress_label: '', contact_number: '', region: '', province: '', city: '', barangay: '', street: '', postal_code: '', is_default: false })}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
            >
              <Plus size={16} /> Add Address
            </button>
          </div>

          <div className="space-y-6">
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
                <div key={field.id} className="relative grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2">
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
                    className="absolute right-4 top-4 rounded-lg p-2 text-rose-500 hover:bg-rose-50 z-10"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="md:col-span-2 flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="addresses_default_radio"
                      checked={watchAddresses[index]?.is_default === true}
                      onChange={() => {
                        addressFields.forEach((_, idx) => {
                          setValue(`addresses.${idx}.is_default`, idx === index)
                        })
                      }}
                      className="h-5 w-5 border-slate-300 accent-slate-900 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-500">Set as Default Address</span>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Address Label (e.g. Home/Work)</label>
                    <input {...register(`addresses.${index}.adress_label`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Contact Number</label>
                    <input {...register(`addresses.${index}.contact_number`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Street / Bldg / Unit</label>
                    <input {...register(`addresses.${index}.street`)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none" />
                  </div>

                  {/* Dropdowns */}
                  <div>
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Region</label>
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
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Province</label>
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
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">City</label>
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
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Barangay</label>
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
                    <label className="mb-1 block text-[10px] font-black tracking-[1px] text-slate-400 uppercase">Postal Code</label>
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
    </div>
  )
}

export default ManageCustomer
