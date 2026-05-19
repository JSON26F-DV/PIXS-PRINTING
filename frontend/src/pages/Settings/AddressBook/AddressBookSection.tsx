import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import type { SingleValue } from 'react-select'
import Select from 'react-select'
import axiosInstance from '../../../lib/axiosInstance'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAccountInfo } from '../AccountInfo/hooks/useAccountInfo'
import { useCustomerAddressStore } from '../../../store/useCustomerAddressStore'

import {
  getAllRegions,
  getBarangaysByMunicipality,
  getMunicipalitiesByProvince,
  getProvincesByRegion,
} from '@aivangogh/ph-address'
import type { CustomerAddress } from './types'

const formSchema = z.object({
  address_name: z.string().min(2, 'Label is required (e.g. Home, Office)'),
  phone: z
    .string()
    .regex(
      /^(\+63|0)\s?9(\s?\d){9}$/,
      'Enter a valid PH phone (e.g. +63 918 111 2233 or 0918...)',
    ),
  street: z.string().min(3, 'Address details are required'),
  postal_code: z.string().optional(),
})

type AddressFormValues = z.infer<typeof formSchema>

type SelectOption = { value: string; label: string }

const MaskedPhone: React.FC<{ phone: string }> = ({ phone }) => {
  const clean = phone.replace(/\s+/g, '')
  return (
    <span>
      {clean.length < 4 ? clean : `${clean.slice(0, 4)}***${clean.slice(-3)}`}
    </span>
  )
}

const AddressBookSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { defaultAccount } = useAccountInfo()
  const {
    addresses,
    fetchAddresses,
    removeAddress,
    setDefaultAddress,
    isLoading,
  } = useCustomerAddressStore()

  useEffect(() => {
    fetchAddresses()
  }, [fetchAddresses])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null,
  )

  const [regionCode, setRegionCode] = useState('')
  const [provinceCode, setProvinceCode] = useState('')
  const [municipalityCode, setMunicipalityCode] = useState('')
  const [barangayCode, setBarangayCode] = useState('')

  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      address_name: '',
      phone: '',
      street: '',
      postal_code: '',
    },
  })

  const regionOptions = useMemo<SelectOption[]>(
    () => getAllRegions().map((r) => ({ value: r.psgcCode, label: r.name })),
    [],
  )
  const provinceOptions = useMemo<SelectOption[]>(() => {
    if (!regionCode) return []
    return getProvincesByRegion(regionCode).map((p) => ({
      value: p.psgcCode,
      label: p.name,
    }))
  }, [regionCode])
  const cityOptions = useMemo<SelectOption[]>(() => {
    if (!provinceCode) return []
    return getMunicipalitiesByProvince(provinceCode).map((m) => ({
      value: m.psgcCode,
      label: m.name,
    }))
  }, [provinceCode])
  const barangayOptions = useMemo<SelectOption[]>(() => {
    if (!municipalityCode) return []
    return getBarangaysByMunicipality(municipalityCode).map((b) => ({
      value: b.psgcCode,
      label: b.name,
    }))
  }, [municipalityCode])

  const openEditForm = useCallback(
    (address: CustomerAddress) => {
      setEditingAddress(address)
      reset({
        address_name: address.adress_label || '',
        phone: address.contact_number,
        street: address.street || '',
        postal_code: address.postal_code || '',
      })

      setRegionCode(address.regionCode || '')
      setProvinceCode(address.provinceCode || '')
      setMunicipalityCode(address.municipalityCode || '')
      setBarangayCode(address.barangayCode || '')

      setIsFormOpen(true)

      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    },
    [reset],
  )

  const openAddForm = useCallback(() => {
    setEditingAddress(null)
    reset({
      address_name: '',
      phone: '',
      street: '',
      postal_code: '',
    })
    setRegionCode('')
    setProvinceCode('')
    setMunicipalityCode('')
    setBarangayCode('')
    setIsFormOpen(true)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [reset])

  useEffect(() => {
    const editId = searchParams.get('edit')
    const action = searchParams.get('action')

    if (editId) {
      const addr = addresses.find((a) => a.id === editId)
      if (addr) {
        setTimeout(() => openEditForm(addr), 0)
      }
    } else if (action === 'new') {
      setTimeout(() => openAddForm(), 0)
    }
  }, [searchParams, addresses, openAddForm, openEditForm])

  const closeForm = () => {
    setEditingAddress(null)
    setIsFormOpen(false)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('edit')
    newParams.delete('action')
    setSearchParams(newParams)
  }

  const onDropdownRegion = (opt: SingleValue<SelectOption>) => {
    setRegionCode(opt?.value ?? '')
    setProvinceCode('')
    setMunicipalityCode('')
    setBarangayCode('')
  }
  const onDropdownProvince = (opt: SingleValue<SelectOption>) => {
    setProvinceCode(opt?.value ?? '')
    setMunicipalityCode('')
    setBarangayCode('')
  }
  const onDropdownCity = (opt: SingleValue<SelectOption>) => {
    setMunicipalityCode(opt?.value ?? '')
    setBarangayCode('')
  }
  const onDropdownBarangay = (opt: SingleValue<SelectOption>) => {
    setBarangayCode(opt?.value ?? '')
  }

  const onSave = handleSubmit(async (values) => {
    const regions = getAllRegions()
    const regionName = regionCode
      ? (regions.find((r) => r.psgcCode === regionCode)?.name ?? '')
      : ''
    const provinceDetails = provinceCode
      ? getProvincesByRegion(regionCode).find(
          (p) => p.psgcCode === provinceCode,
        )
      : null
    const cityDetails = municipalityCode
      ? getMunicipalitiesByProvince(provinceCode).find(
          (m) => m.psgcCode === municipalityCode,
        )
      : null
    const barangayDetails = barangayCode
      ? getBarangaysByMunicipality(municipalityCode).find(
          (b) => b.psgcCode === barangayCode,
        )
      : null

    const payload = {
      adress_label: values.address_name,
      contact_number: values.phone,
      street: values.street,
      region: regionName || null,
      province: provinceDetails?.name || null,
      city: cityDetails?.name || null,
      barangay: barangayDetails?.name || null,
      postal_code: values.postal_code || null,
    }

    try {
      if (editingAddress) {
        toast.loading('Updating address...', { id: 'save-address' })
        await axiosInstance.put(
          `/api/customer/addresses/${editingAddress.id}`,
          payload,
        )
        toast.success('Address updated.', { id: 'save-address' })
      } else {
        toast.loading('Saving address...', { id: 'save-address' })
        await axiosInstance.post('/api/customer/addresses', payload)
        toast.success('Address saved.', { id: 'save-address' })
      }
      fetchAddresses()
      closeForm()
    } catch (err) {
      toast.error('Failed to save address.', { id: 'save-address' })
      console.error(err)
    }
  })

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Address?',
      text: 'Are you sure you want to remove this address?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton:
          'rounded-xl font-black uppercase text-[10px] tracking-widest',
        cancelButton:
          'rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-600',
        popup: 'rounded-[32px] border-none shadow-2xl',
      },
    })

    if (result.isConfirmed) {
      try {
        await removeAddress(id)
        Swal.fire({
          title: 'Deleted!',
          text: 'Address has been removed.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: 'rounded-[32px]',
          },
        })
      } catch {
        toast.error('Failed to delete address.')
      }
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id)
      toast.success('Default address updated.')
    } catch {
      toast.error('Failed to update default address.')
    }
  }

  if (isLoading && addresses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-xs font-black tracking-widest text-slate-400 uppercase">
        Synchronizing nodes...
      </div>
    )
  }

  return (
    <section className="SettingsAddressBook space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic">
            Address Book
          </h2>
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Shipping & delivery nodes
          </p>
        </div>
        <button
          type="button"
          className="AddAddressButton rounded-3xl border border-white/10 bg-slate-900 px-5 py-3 text-[10px] font-black tracking-[4px] text-white uppercase italic shadow-2xl transition-all hover:scale-105 active:scale-95"
          onClick={openAddForm}
        >
          <FiPlus className="mr-1 inline" size={14} />
          Add Address
        </button>
      </div>

      {isFormOpen && (
        <form
          ref={formRef}
          className="AddressForm space-y-5 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm md:p-8"
          onSubmit={onSave}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Address Label (e.g. Home)
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Home, Office, etc."
                {...register('address_name')}
              />
              {errors.address_name && (
                <p className="text-xs text-rose-500">
                  {errors.address_name.message}
                </p>
              )}
            </div>
            {/*
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Recipient Name
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Full Name"
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-xs text-rose-500">
                  {errors.full_name.message}
                </p>
              )}
            </div>
            */}
            <div className="AddressContactWrapper space-y-2">
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                Select Contact Number
              </label>
              <select
                className="focus:border-pixs-mint w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none"
                {...register('phone')}
                onChange={(e) => {
                  if (e.target.value === 'ADD_NEW') {
                    navigate(
                      '/settings/account-info?scroll=contact-section&action=add-contact',
                    )
                  } else {
                    setValue('phone', e.target.value, { shouldValidate: true })
                  }
                }}
              >
                <option value="">Select a number...</option>
                {defaultAccount.contacts.map((c, i) => (
                  <option key={i} value={c.number}>
                    {c.number} {c.is_default ? '(Default)' : ''}
                  </option>
                ))}
                <option
                  value="ADD_NEW"
                  className="font-black text-blue-600 uppercase"
                >
                  + Add New Number
                </option>
              </select>
              {errors.phone && (
                <p className="px-1 text-[10px] font-black text-rose-500 uppercase italic">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50/50 p-5 shadow-inner transition-all md:p-8">
            <div className="animate-in fade-in slide-in-from-top-2 space-y-5 duration-300">
              <div className="DropdownSelector grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Region
                  </p>
                  <Select
                    options={regionOptions}
                    value={
                      regionOptions.find((o) => o.value === regionCode) ??
                      null
                    }
                    onChange={onDropdownRegion}
                    menuPosition="fixed"
                    placeholder="Select region"
                  />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Province
                  </p>
                  <Select
                    options={provinceOptions}
                    value={
                      provinceOptions.find((o) => o.value === provinceCode) ??
                      null
                    }
                    onChange={onDropdownProvince}
                    menuPosition="fixed"
                    placeholder="Select province"
                    isDisabled={!regionCode}
                  />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    City
                  </p>
                  <Select
                    options={cityOptions}
                    value={
                      cityOptions.find((o) => o.value === municipalityCode) ??
                      null
                    }
                    onChange={onDropdownCity}
                    menuPosition="fixed"
                    placeholder="Select city"
                    isDisabled={!provinceCode}
                  />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Barangay
                  </p>
                  <Select
                    options={barangayOptions}
                    value={
                      barangayOptions.find((o) => o.value === barangayCode) ??
                      null
                    }
                    onChange={onDropdownBarangay}
                    menuPosition="fixed"
                    placeholder="Select barangay"
                    isDisabled={!municipalityCode}
                  />
                </div>
              </div>
              <div className="h-px bg-slate-200/50" />
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Street / House No. / Landmark
                </label>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:border-slate-900 focus:outline-none"
                  placeholder="Enter detailed street address..."
                  {...register('street')}
                />
                {errors.street && (
                  <p className="mt-1 text-[10px] font-black text-rose-500 uppercase italic">
                    {errors.street.message}
                  </p>
                )}
              </div>
              <div className="md:w-1/3">
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                  Postal Code
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold focus:border-slate-900 focus:outline-none"
                  placeholder="e.g. 1000"
                  {...register('postal_code')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-6 py-3 text-[10px] font-black tracking-widest text-slate-600 uppercase"
              onClick={closeForm}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-xl bg-slate-900 px-8 py-3 text-[10px] font-black tracking-widest text-white uppercase disabled:opacity-50"
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`rounded-[24px] border p-6 transition-all ${address.is_default ? 'border-slate-900 bg-slate-50 shadow-inner' : 'border-slate-100 bg-white'}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                    {address.adress_label || 'Address'}
                  </p>
                  {address.is_default === true && (
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[8px] font-black tracking-widest text-white uppercase italic">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Recipient: {address.adress_label}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  <MaskedPhone phone={address.contact_number} />
                </p>
                <p className="line-clamp-2 text-xs font-medium text-slate-400">
                  {[
                    address.street,
                    address.barangay,
                    address.city,
                    address.province,
                    address.region,
                    address.postal_code,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-600 uppercase italic transition-all hover:border-slate-900"
                  onClick={() => openEditForm(address)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-black tracking-widest text-rose-600 uppercase italic transition-all hover:bg-rose-100"
                  onClick={() => handleDelete(address.id)}
                >
                  Delete
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-900 uppercase italic transition-all hover:bg-slate-50"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AddressBookSection
