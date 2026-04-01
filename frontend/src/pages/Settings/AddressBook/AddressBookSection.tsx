import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import type { SingleValue } from 'react-select';
import Select from 'react-select';
import axios from 'axios';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAccountInfo } from '../AccountInfo/hooks/useAccountInfo';
import { useCustomerAddressStore } from '../../../store/useCustomerAddressStore';

import {
  getAllProvinces,
  getAllRegions,
  getBarangaysByMunicipality,
  getMunicipalitiesByProvince,
  getProvincesByRegion,
} from '@aivangogh/ph-address';
import type { CustomerAddress } from './types';

const formSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^(\+63|0)\s?9(\s?\d){9}$/, 'Enter a valid PH phone (e.g. +63 918 111 2233 or 0918...)'),
  street: z.string().min(3, 'Address details are required'),
  postal_code: z.string().optional(),
  notes: z.string().optional(),
  mapPaste: z.string().optional(),
});

type AddressFormValues = z.infer<typeof formSchema>;

type SelectOption = { value: string; label: string };

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

function parseCoordinatesFromPaste(text: string): { lat: number; lng: number } | null {
  const trimmed = text.trim();
  const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,|$)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = trimmed.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  const dMatch = trimmed.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  const llMatch = trimmed.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  const comma = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (comma) return { lat: parseFloat(comma[1]), lng: parseFloat(comma[2]) };
  return null;
}

async function reverseGeocode(lat: number, lng: number) {
  const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: { 
      format: 'json', 
      lat, 
      lon: lng, 
      addressdetails: 1,
      extratags: 1 
    },
    headers: { 
      'Accept-Language': 'en',
      'User-Agent': 'PIXS-Printing-Shop-AddressSelector-Contact-jason-at-documents-pixs' 
    },
    timeout: 5000,
  });
  return data ?? {};
}

async function searchCenter(query: string) {
  const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'json', limit: 1, countrycodes: 'ph' },
    headers: { 'Accept-Language': 'en' },
  });
  const first = data?.[0];
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
}

function matchPhFromNominatim(addr: Record<string, string>) {
  const provinces = getAllProvinces();
  const stateStr = (addr.state || addr.province || '').toString();
  const cityHint = (addr.city || addr.town || addr.municipality || addr.city_district || '').toString();
  const sub = (addr.suburb || addr.village || addr.neighbourhood || addr.quarter || '').toString();

  let province = provinces.find(
    (p) =>
      normalize(stateStr) === normalize(p.name) ||
      normalize(stateStr).includes(normalize(p.name)) ||
      normalize(p.name).includes(normalize(stateStr)),
  );

  if (!province && cityHint) {
    for (const p of provinces) {
      const muns = getMunicipalitiesByProvince(p.psgcCode);
      const hit = muns.find(
        (m) =>
          normalize(cityHint).includes(normalize(m.name)) ||
          normalize(m.name).includes(normalize(cityHint)),
      );
      if (hit) {
        province = p;
        break;
      }
    }
  }

  if (!province) return null;

  const regions = getAllRegions();
  const region = regions.find((r) => r.psgcCode === province!.regionCode) ?? null;
  const municipalities = getMunicipalitiesByProvince(province.psgcCode);
  let municipality =
    municipalities.find(
      (m) =>
        normalize(cityHint) &&
        (normalize(cityHint).includes(normalize(m.name)) || normalize(m.name).includes(normalize(cityHint))),
    ) ?? null;

  if (!municipality && municipalities.length === 1) municipality = municipalities[0];

  let barangayCode = '';
  let barangayName = '';
  if (municipality) {
    const barangays = getBarangaysByMunicipality(municipality.psgcCode);
    const b = barangays.find(
      (br) =>
        sub &&
        (normalize(sub).includes(normalize(br.name)) || normalize(br.name).includes(normalize(sub))),
    );
    if (b) {
      barangayCode = b.psgcCode;
      barangayName = b.name;
    }
  }

  return {
    regionCode: region?.psgcCode ?? '',
    regionName: region?.name ?? '',
    provinceCode: province.psgcCode,
    provinceName: province.name,
    municipalityCode: municipality?.psgcCode ?? '',
    municipalityName: municipality?.name ?? '',
    barangayCode,
    barangayName,
    postal_code: (addr.postcode || '').toString(),
  };
}

const MaskedPhone: React.FC<{ phone: string }> = ({ phone }) => {
  const clean = phone.replace(/\s+/g, '');
  return <span>{clean.length < 4 ? clean : `${clean.slice(0, 4)}***${clean.slice(-3)}`}</span>;
};

const MapSelectorLazy = React.lazy(async () => {
  const { MapContainer, Marker, TileLayer, useMap, useMapEvents } = await import('react-leaflet');
  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');

  const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconAnchor: [12, 41],
  });

  const MapCenterUpdater: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([latitude, longitude], map.getZoom(), { animate: true });
    }, [latitude, longitude, map]);
    return null;
  };

  const MapMarker: React.FC<{
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
  }> = ({ latitude, longitude, onChange }) => {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return (
      <Marker
        position={[latitude, longitude]}
        icon={markerIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const ll = e.target.getLatLng();
            onChange(ll.lat, ll.lng);
          },
        }}
      />
    );
  };

  const MapSelector: React.FC<{
    latitude: number;
    longitude: number;
    onChange: (lat: number, lng: number) => void;
  }> = ({ latitude, longitude, onChange }) => (
    <div className="MapSelector relative z-0 overflow-hidden rounded-[24px] border border-slate-200">
      <MapContainer center={[latitude, longitude]} zoom={13} className="h-[320px] w-full md:h-[380px] z-0">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapCenterUpdater latitude={latitude} longitude={longitude} />
        <MapMarker latitude={latitude} longitude={longitude} onChange={onChange} />
      </MapContainer>
    </div>
  );

  return { default: MapSelector };
});

const AddressBookSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { defaultAccount } = useAccountInfo();
  const { addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } = useCustomerAddressStore();

  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const [mapLat, setMapLat] = useState(14.5995);
  const [mapLng, setMapLng] = useState(120.9842);
  const [regionCode, setRegionCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [municipalityCode, setMunicipalityCode] = useState('');
  const [barangayCode, setBarangayCode] = useState('');
  const [selectionMode, setSelectionMode] = useState<'map' | 'manual'>('map');
  const [, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      phone: '',
      street: '',
      postal_code: '',
      notes: '',
      mapPaste: '',
    },
  });

  const regionOptions = useMemo<SelectOption[]>(
    () => getAllRegions().map((r) => ({ value: r.psgcCode, label: r.name })),
    [],
  );
  const provinceOptions = useMemo<SelectOption[]>(() => {
    if (!regionCode) return [];
    return getProvincesByRegion(regionCode).map((p) => ({ value: p.psgcCode, label: p.name }));
  }, [regionCode]);
  const cityOptions = useMemo<SelectOption[]>(() => {
    if (!provinceCode) return [];
    return getMunicipalitiesByProvince(provinceCode).map((m) => ({ value: m.psgcCode, label: m.name }));
  }, [provinceCode]);
  const barangayOptions = useMemo<SelectOption[]>(() => {
    if (!municipalityCode) return [];
    return getBarangaysByMunicipality(municipalityCode).map((b) => ({ value: b.psgcCode, label: b.name }));
  }, [municipalityCode]);

  const applyMarkerAndGeocode = useCallback(
    (lat: number, lng: number) => {
      setMapLat(lat);
      setMapLng(lng);
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
      
      setGeocodingStatus('loading');
      setValue('street', `Pin dropped at ${lat.toFixed(6)}, ${lng.toFixed(6)}`, { shouldValidate: true });

      reverseTimer.current = setTimeout(async () => {
        try {
          const res = await reverseGeocode(lat, lng);
          const addr = res.address ?? {};
          const display = res.display_name ?? '';
          
          if (display) {
            setValue('street', display, { shouldValidate: true });
            setGeocodingStatus('success');
          } else {
            setGeocodingStatus('error');
          }

          const matched = matchPhFromNominatim(addr as Record<string, string>);
          if (matched) {
            setRegionCode(matched.regionCode);
            setProvinceCode(matched.provinceCode);
            setMunicipalityCode(matched.municipalityCode);
            setBarangayCode(matched.barangayCode);
            if (matched.postal_code) setValue('postal_code', matched.postal_code);
          }
        } catch (error) {
          console.error('Geocode Fallback Strategy:', error);
          setGeocodingStatus('error');
          setValue('street', `${lat.toFixed(6)}, ${lng.toFixed(6)}`, { shouldValidate: true });
        }
      }, 800);
    },
    [setValue],
  );

  const handleMapChange = useCallback(
    (lat: number, lng: number) => {
      applyMarkerAndGeocode(lat, lng);
    },
    [applyMarkerAndGeocode],
  );

  const openEditForm = useCallback((address: CustomerAddress) => {
    setEditingAddress(address);
    reset({
      full_name: address.full_name,
      phone: address.phone,
      street: address.street_local || address.street || address.address,
      postal_code: address.postal_code || '',
      notes: address.notes ?? '',
      mapPaste: '',
    });
    setMapLat(address.latitude);
    setMapLng(address.longitude);
    setSelectionMode(address.regionCode ? 'manual' : 'map');
    
    setRegionCode(address.regionCode || '');
    setProvinceCode(address.provinceCode || '');
    setMunicipalityCode(address.municipalityCode || '');
    setBarangayCode(address.barangayCode || '');
    
    setIsFormOpen(true);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [reset]);

  const openAddForm = useCallback(() => {
    setEditingAddress(null);
    reset({
      full_name: '',
      phone: '',
      street: '',
      postal_code: '',
      notes: '',
      mapPaste: '',
    });
    setRegionCode('');
    setProvinceCode('');
    setMunicipalityCode('');
    setBarangayCode('');
    setMapLat(14.5995);
    setMapLng(120.9842);
    setSelectionMode('map');
    setIsFormOpen(true);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [reset]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    const action = searchParams.get('action');

    if (editId) {
      const addr = addresses.find(a => a.id === editId);
      if (addr) {
        // Use timeout to avoid synchronous setState inside effect warning
        setTimeout(() => openEditForm(addr), 0);
      }
    } else if (action === 'new') {
      setTimeout(() => openAddForm(), 0);
    }
  }, [searchParams, addresses, openAddForm, openEditForm]);

  const closeForm = () => {
    setEditingAddress(null);
    setIsFormOpen(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('edit');
    newParams.delete('action');
    setSearchParams(newParams);
  };

  const onDropdownRegion = async (opt: SingleValue<SelectOption>) => {
    const v = opt?.value ?? '';
    setRegionCode(v);
    setProvinceCode('');
    setMunicipalityCode('');
    setBarangayCode('');
    const region = getAllRegions().find((r) => r.psgcCode === v);
    if (!region) return;
    const center = await searchCenter(`${region.name}, Philippines`);
    if (center) {
      setMapLat(center.lat);
      setMapLng(center.lng);
    }
  };

  const onDropdownProvince = async (opt: SingleValue<SelectOption>) => {
    const v = opt?.value ?? '';
    setProvinceCode(v);
    setMunicipalityCode('');
    setBarangayCode('');
    const provinces = getProvincesByRegion(regionCode);
    const p = provinces.find((x) => x.psgcCode === v);
    if (!p) return;
    const center = await searchCenter(`${p.name}, Philippines`);
    if (center) {
      setMapLat(center.lat);
      setMapLng(center.lng);
    }
  };

  const onDropdownCity = async (opt: SingleValue<SelectOption>) => {
    const v = opt?.value ?? '';
    setMunicipalityCode(v);
    setBarangayCode('');
    const cities = getMunicipalitiesByProvince(provinceCode);
    const c = cities.find((x) => x.psgcCode === v);
    if (!c) return;
    const center = await searchCenter(`${c.name}, Philippines`);
    if (center) {
      setMapLat(center.lat);
      setMapLng(center.lng);
    }
  };

  const onDropdownBarangay = async (opt: SingleValue<SelectOption>) => {
    const v = opt?.value ?? '';
    setBarangayCode(v);
    const bars = getBarangaysByMunicipality(municipalityCode);
    const b = bars.find((x) => x.psgcCode === v);
    if (!b) return;
    const prov = getProvincesByRegion(regionCode).find((p) => p.psgcCode === provinceCode);
    const city = getMunicipalitiesByProvince(provinceCode).find((m) => m.psgcCode === municipalityCode);
    const center = await searchCenter(`${b.name}, ${city?.name ?? ''}, ${prov?.name ?? ''}, Philippines`);
    if (center) {
      setMapLat(center.lat);
      setMapLng(center.lng);
    }
  };

  const applyPaste = () => {
    const raw = getValues('mapPaste') ?? '';
    const coords = parseCoordinatesFromPaste(raw);
    if (!coords) {
      toast.error('Paste a Google Maps link or lat,lng coordinates.');
      return;
    }
    setValue('mapPaste', '');
    handleMapChange(coords.lat, coords.lng);
    toast.success('Location applied from paste.');
  };

  const onSave = handleSubmit((values) => {
    const regions = getAllRegions();
    const regionName = regions.find((r) => r.psgcCode === regionCode)?.name ?? '';
    const provinceDetails = getProvincesByRegion(regionCode).find((p) => p.psgcCode === provinceCode);
    const cityDetails = getMunicipalitiesByProvince(provinceCode).find((m) => m.psgcCode === municipalityCode);
    const barangayDetails = barangayCode
      ? getBarangaysByMunicipality(municipalityCode).find((b) => b.psgcCode === barangayCode)
      : null;

    let combinedAddress = '';
    if (selectionMode === 'map') {
      combinedAddress = values.street;
    } else {
      const parts = [
        values.street,
        barangayDetails?.name,
        cityDetails?.name,
        provinceDetails?.name,
        regionName,
        values.postal_code,
      ].filter((p): p is string => Boolean(p) && typeof p === 'string');
      combinedAddress = parts.join(', ');
    }

    const payload: Omit<CustomerAddress, 'id' | 'is_default'> = {
      full_name: values.full_name,
      phone: values.phone,
      latitude: mapLat,
      longitude: mapLng,
      address: combinedAddress,
      notes: values.notes,
      street: values.street,
      region: regionName,
      province: provinceDetails?.name || '',
      city: cityDetails?.name || '',
      barangay: barangayDetails?.name || '',
      regionCode: selectionMode === 'manual' ? regionCode : '',
      provinceCode: selectionMode === 'manual' ? provinceCode : '',
      municipalityCode: selectionMode === 'manual' ? municipalityCode : '',
      barangayCode: selectionMode === 'manual' ? barangayCode : '',
      postal_code: values.postal_code || '',
    };

    if (editingAddress) {
      updateAddress(editingAddress.id, payload);
      toast.success('Address updated.');
    } else {
      const next: CustomerAddress = {
        id: `addr_${crypto.randomUUID()}`,
        ...payload,
        is_default: addresses.length === 0,
      };
      addAddress(next);
      toast.success('Address saved.');
    }
    closeForm();
  });

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
        confirmButton: 'rounded-xl font-black uppercase text-[10px] tracking-widest',
        cancelButton: 'rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-600',
        popup: 'rounded-[32px] border-none shadow-2xl',
      }
    });

    if (result.isConfirmed) {
      removeAddress(id);
      Swal.fire({
        title: 'Deleted!',
        text: 'Address has been removed.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          popup: 'rounded-[32px]',
        }
      });
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultAddress(id);
    toast.success('Default address updated.');
  };

  return (
    <section className="SettingsAddressBook space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Address Book</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipping & delivery nodes</p>
        </div>
        <button
          type="button"
          className="AddAddressButton bg-slate-900 text-white text-[10px] font-black rounded-3xl px-5 py-3 uppercase tracking-[4px] border border-white/10 italic shadow-2xl transition-all hover:scale-105 active:scale-95"
          onClick={openAddForm}
        >
          <FiPlus className="inline mr-1" size={14} />
          Add Address
        </button>
      </div>

      {isFormOpen && (
        <form ref={formRef} className="AddressForm space-y-5 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm md:p-8" onSubmit={onSave}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Address Name</label>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" {...register('full_name')} />
              {errors.full_name && <p className="text-xs text-rose-500">{errors.full_name.message}</p>}
            </div>
            <div className="AddressContactWrapper space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Contact Number</label>
              <select 
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 focus:border-pixs-mint outline-none"
                {...register('phone')}
                onChange={(e) => {
                   if (e.target.value === 'ADD_NEW') {
                     navigate('/settings/account-info?scroll=contact-section&action=add-contact');
                   } else {
                     setValue('phone', e.target.value, { shouldValidate: true });
                   }
                }}
              >
                 <option value="">Select a number...</option>
                 {defaultAccount.contacts.map((c, i) => (
                   <option key={i} value={c.number}>
                     {c.number} {c.is_default ? '(Default)' : ''}
                   </option>
                 ))}
                
              </select>
              {errors.phone && <p className="text-[10px] font-black uppercase text-rose-500 italic px-1">{errors.phone.message}</p>}
            </div>

          </div>
          
          <div className={`space-y-4 rounded-3xl border p-5 transition-all md:p-8 ${selectionMode === 'map' ? 'border-slate-900 bg-slate-50/50 shadow-inner' : 'border-slate-100 opacity-40 bg-white'}`}>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="selectionMode" checked={selectionMode === 'map'} onChange={() => setSelectionMode('map')} className="h-5 w-5 accent-slate-900" />
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-900">Pin Map / Google Link</span>
            </label>

            {selectionMode === 'map' && (
              <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Paste Google Maps link</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="https://maps.google.com/..." {...register('mapPaste')} />
                    <button type="button" className="whitespace-nowrap rounded-xl bg-slate-900 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white" onClick={applyPaste}>Apply location</button>
                  </div>
                </div>

                <div className="MapWrapper overflow-hidden rounded-2xl border border-slate-200">
                  <Suspense fallback={<div className="flex h-[320px] items-center justify-center bg-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">Loading Map…</div>}>
                    <MapSelectorLazy latitude={mapLat} longitude={mapLng} onChange={handleMapChange} />
                  </Suspense>
                </div>

                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Address Info / Coordinates</label>
                  <textarea className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm min-h-[100px] border-dashed" placeholder="Auto-filled from map..." {...register('street')} />
                  {errors.street && <p className="text-xs text-rose-500">{errors.street.message}</p>}
                </div>
              </div>
            )}
          </div>

          <div className={`space-y-4 rounded-3xl border p-5 transition-all md:p-8 ${selectionMode === 'manual' ? 'border-slate-900 bg-slate-50/50 shadow-inner' : 'border-slate-100 opacity-40 bg-white'}`}>
             <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name="selectionMode" checked={selectionMode === 'manual'} onChange={() => setSelectionMode('manual')} className="h-5 w-5 accent-slate-900" />
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-900">Manual Dropdowns</span>
            </label>

            {selectionMode === 'manual' && (
              <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="DropdownSelector grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Region</p>
                    <Select options={regionOptions} value={regionOptions.find((o) => o.value === regionCode) ?? null} onChange={onDropdownRegion} placeholder="Select region" />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Province</p>
                    <Select options={provinceOptions} value={provinceOptions.find((o) => o.value === provinceCode) ?? null} onChange={onDropdownProvince} placeholder="Select province" isDisabled={!regionCode} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">City</p>
                    <Select options={cityOptions} value={cityOptions.find((o) => o.value === municipalityCode) ?? null} onChange={onDropdownCity} placeholder="Select city" isDisabled={!provinceCode} />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Barangay</p>
                    <Select options={barangayOptions} value={barangayOptions.find((o) => o.value === barangayCode) ?? null} onChange={onDropdownBarangay} placeholder="Select barangay" isDisabled={!municipalityCode} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Street / House No.</label>
                  <textarea className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm min-h-[80px]" {...register('street')} />
                  {errors.street && <p className="text-xs text-rose-500">{errors.street.message}</p>}
                </div>
                <div className="md:w-1/2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Postal Code</label>
                  <input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" {...register('postal_code')} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-2">
            <button type="button" className="rounded-xl border border-slate-200 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600" onClick={closeForm}>Cancel</button>
            <button type="submit" disabled={!isValid} className="rounded-xl bg-slate-900 px-8 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">Save Address</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {addresses.map((address) => (
          <div key={address.id} className={`rounded-[24px] border p-6 transition-all ${address.is_default ? 'border-slate-900 bg-slate-50 shadow-inner' : 'border-slate-100 bg-white'}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black uppercase italic tracking-tighter text-slate-900">{address.full_name}</p>
                  {address.is_default && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white italic">Default</span>}
                </div>
                <p className="text-xs font-bold text-slate-500"><MaskedPhone phone={address.phone} /></p>
                <p className="text-xs text-slate-400 font-medium line-clamp-2">{address.address}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-900 transition-all italic" onClick={() => openEditForm(address)}>Edit</button>
                <button type="button" className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all italic" onClick={() => handleDelete(address.id)}>Delete</button>
                {!address.is_default && <button type="button" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all italic" onClick={() => handleSetDefault(address.id)}>Set Default</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AddressBookSection;
