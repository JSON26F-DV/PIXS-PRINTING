import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, 
  Shield, Briefcase, Mail, Phone, X,
  RefreshCw, CheckCircle2, ShieldCheck, UserCheck, 
  Camera, Plus, Trash, Star, MapPin, Lock, Info, ExternalLink,
  ArrowRight, ShieldAlert, Clock, TrendingUp,
  type LucideIcon
} from 'lucide-react';
import { useForm, useFieldArray, useWatch, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import debounce from 'lodash/debounce';
import bcrypt from 'bcryptjs';

// Types and Schemas
import { 
  UserRole, 
  type UserRoleType, 
  type Status, 
  type BaseUser, 
  userSchema, 
  type FormData,
  type Address,
  type DeletedAccountLog
} from './account-types';

import usersData from '../../data/users.json';
import addressBookData from '../../data/address_book.json';
import AnimatedNumber from '../../components/animations/AnimatedNumber';

// Utility for class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// SIMULATED: Admin ID for audit logs
const CURRENT_ADMIN_ID = "EMP-001";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("Admin123!", 10); // Simulated admin password

// --- UTILITIES ---
const generateSecureId = (role: string) => {
  const randomSuffix = Math.floor(Math.random() * 900) + 100;
  return role === UserRole.CUSTOMER ? `CUST-${randomSuffix}` : `EMP-${randomSuffix}`;
};

interface RawUserNode {
  id: string;
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  status?: string;
  date_created?: string;
  profile_picture?: string;
  contact_numbers?: { number: string; is_default: boolean }[];
  [key: string]: unknown;
}

// --- UI COMPONENTS ---

const StatCard = ({ title, value, prefix = "", icon: Icon, variant = 'light' }: { 
  title: string, value: number, prefix?: string, icon: LucideIcon, variant?: 'light'|'dark'|'emerald'|'rose' 
}) => {
  const bgClass =
    variant === 'dark' ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white' :
    variant === 'emerald' ? 'bg-gradient-to-br from-[#75EEA5] to-[#5de291] text-slate-900 border-none' :
    variant === 'rose' ? 'bg-gradient-to-br from-rose-400 to-rose-500 text-white border-none' :
    'bg-white border border-slate-100 shadow-xl shadow-slate-200/40 text-slate-900';

  const textMuted = variant === 'light' ? 'text-slate-500' : 'text-slate-900/60';
  console.log(textMuted); // temporarily avoid unused warning

  return (
    <div className={cn("p-6 relative group overflow-hidden rounded-[24px] transition-all hover:-translate-y-1 shadow-2xl", bgClass)}>
      <div className={cn("absolute -top-4 -right-4 p-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12 opacity-10")}>
        <Icon className={cn("w-32 h-32")} />
      </div>
      <p className={cn("text-xs font-black uppercase tracking-[2px] mb-3 relative z-10 opacity-70")}>{title}</p>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-xl font-bold opacity-60">{prefix}</span>
        <AnimatedNumber value={value} className="text-4xl font-black tracking-tighter" />
      </div>
    </div>
  );
};

// Component for profile picture uploader
const ProfilePictureUploader = ({ value, onChange }: { value?: string, onChange: (val: string) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (Max 5MB)");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="account-profile-picture flex flex-col items-center gap-4 group">
      <div className="relative w-32 h-32 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-2xl transition-transform group-hover:scale-105">
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
            <Users size={48} />
          </div>
        )}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="account-image-upload absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
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
          className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
        >
          Change Photo
        </button>
        {preview && (
          <>
            <span className="text-slate-300">|</span>
            <button 
              type="button"
              onClick={() => { setPreview(''); onChange(''); }}
              className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

const Accounts: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useState<BaseUser[]>(() => {
    // Unify employees and customers into BaseUser
    const employees = (usersData.employees as RawUserNode[]).map(e => ({
      ...(e as unknown as BaseUser), 
      name: e.name || `${e.first_name} ${e.last_name}`,
      status: (e.status as Status) || 'active',
      date_created: e.date_created || new Date().toISOString(),
      contact_numbers: e.contact_numbers || []
    }));
    const customers = (usersData.customers as RawUserNode[]).map(c => ({
      ...(c as unknown as BaseUser),
      name: c.name || `${c.first_name} ${c.last_name}`,
      role: UserRole.CUSTOMER,
      status: (c.status as Status) || 'active',
      date_created: c.date_created || new Date().toISOString(),
      contact_numbers: c.contact_numbers || []
    }));
    return [...employees, ...customers] as BaseUser[];
  });

  const [addressBook, setAddressBook] = useState<Address[]>(() => {
    // Map JSON entries to Address type, ensuring label exists
    return (addressBookData as unknown as Address[]).map(a => ({
      ...a,
      label: a.label || a.full_name || 'Standard Unit'
    }));
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRoleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BaseUser | null>(null);
  
  // Secure Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<{open: boolean, user: BaseUser | null, step: 1 | 2}>({
    open: false, user: null, step: 1
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Address editing state (within modal)
  const [tempAddresses, setTempAddresses] = useState<Address[]>([]);

  // --- FORM SETUP ---
  const { register, handleSubmit, control, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      status: 'active',
      role: UserRole.CUSTOMER,
      contact_numbers: [{ number: '', is_default: true }]
    }
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control,
    name: "contact_numbers"
  });

  const watchRole = useWatch({ control, name: 'role' });

  useEffect(() => {
    document.title = "Account Infrastructure | PIXS ERP";
  }, []);

  // --- SEARCH LOGIC ---
  const handleSearchDebounce = useMemo(
    () => debounce((q: string) => setDebouncedSearch(q), 300),
    []
  );

  useEffect(() => {
    handleSearchDebounce(searchTerm);
    return () => handleSearchDebounce.cancel();
  }, [searchTerm, handleSearchDebounce]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  // --- HANDLERS ---

  const openFormModal = (user?: BaseUser) => {
    if (user) {
      setEditingUser(user);
      reset({
        ...user,
        password: '' // Don't lead password
      });
      // Load addresses for this user
      const userAddrs = addressBook.filter(a => a.user_id === user.id) || [];
      // Map userAddrs flat list to the local Address interface if needed, but they match now.
      setTempAddresses([...userAddrs]);
    } else {
      setEditingUser(null);
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
        password: ''
      });
      setTempAddresses([]);
    }
    setIsModalOpen(true);
  };

  const onFormSubmit: SubmitHandler<FormData> = (data) => {
    // 1. Audit Check: Cannot demote last admin
    if (editingUser?.role === UserRole.ADMIN && data.role !== UserRole.ADMIN) {
      const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
      if (adminCount <= 1) {
        toast.error("Security Halt: Cannot downgrade last remaining Admin.");
        return;
      }
    }

    // 2. Audit Check: Cannot modify own role
    if (editingUser?.id === CURRENT_ADMIN_ID && data.role !== UserRole.ADMIN) {
        toast.error("Logic Halt: You cannot remove your own administrative access.");
        return;
    }

    const fullName = `${data.first_name} ${data.last_name}`;
    const timestamp = new Date().toISOString();

    if (editingUser) {
      // LOG AUDIT: Check for status/role changes
      if (editingUser.status !== data.status) {
          console.log(`[AUDIT] Status Change for ${editingUser.id} by ${CURRENT_ADMIN_ID}: ${editingUser.status} -> ${data.status}`);
      }
      if (editingUser.role !== data.role) {
          console.log(`[AUDIT] Role Change for ${editingUser.id} by ${CURRENT_ADMIN_ID}: ${editingUser.role} -> ${data.role}`);
      }

      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { 
          ...u, 
          ...data, 
          name: fullName,
          last_modified: timestamp,
          modified_by: CURRENT_ADMIN_ID
        } : u
      ));

      // Sync Address Book in-memory
      setAddressBook(prev => {
        const otherUsersAddrs = prev.filter(a => a.user_id !== editingUser.id);
        const updatedUserAddrs = tempAddresses.map(a => ({ ...a, user_id: editingUser.id }));
        return [...otherUsersAddrs, ...updatedUserAddrs];
      });

      toast.success("Identity updated and synced to address book.");
    } else {
      const newId = generateSecureId(data.role);
      const newUser: BaseUser = {
        ...data,
        id: newId,
        name: fullName,
        date_created: timestamp,
        profile_picture: data.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
      } as BaseUser;
      
      setUsers(prev => [newUser, ...prev]);
      
      // Sync Address Book in-memory
      if (tempAddresses.length > 0) {
          const newAddresses = tempAddresses.map(a => ({ ...a, user_id: newId }));
          setAddressBook(prev => [...prev, ...newAddresses]);
      }

      toast.success("New secure identity provisioned.");
    }
    setIsModalOpen(false);
  };

  const initiateDelete = (user: BaseUser) => {
    // Basic guards
    if (user.id === CURRENT_ADMIN_ID) {
      toast.error("Action Blocked: Self-deletion is not permitted.");
      return;
    }
    if (user.role === UserRole.ADMIN) {
      const adminCount = users.filter(u => u.role === UserRole.ADMIN).length;
      if (adminCount <= 1) {
        toast.error("Action Blocked: Cannot delete the last remaining Admin.");
        return;
      }
    }

    setIsDeleteModalOpen({ open: true, user, step: 1 });
    setDeleteReason('');
    setDeletePassword('');
    setDeleteConfirmed(false);
  };

  const handleSecureDelete = async () => {
    if (isDeleteModalOpen.step === 1) {
      if (!deleteConfirmed) {
        toast.error("Please confirm you understand this is irreversible.");
        return;
      }
      if (!deleteReason) {
        toast.error("A reason for deletion is mandatory for audit logs.");
        return;
      }
      setIsDeleteModalOpen(prev => ({ ...prev, step: 2 }));
      return;
    }

    // Step 2: Password Verification
    setIsDeleting(true);
    const isValid = await bcrypt.compare(deletePassword, ADMIN_PASSWORD_HASH);
    
    if (!isValid) {
      toast.error("Administrative authentication failed. Action blocked.");
      setIsDeleting(false);
      return;
    }

    const user = isDeleteModalOpen.user!;
    
    // LOG TO deleted_account.json (Simulated)
    const log: DeletedAccountLog = {
      deleted_at: new Date().toISOString(),
      deleted_by: CURRENT_ADMIN_ID,
      reason: deleteReason,
      account_snapshot: user
    };
    console.log("[SECURITY LOG] Identity purged and archived:", log);
    toast.success("Log generated in deleted_accounts.json", { icon: '📝' });

    // Remove from active state
    setUsers(prev => prev.filter(u => u.id !== user.id));
    setAddressBook(prev => prev.filter(a => a.user_id !== user.id));

    toast.success("Entity purged successfully.");
    setIsDeleting(false);
    setIsDeleteModalOpen({ open: false, user: null, step: 1 });
  };

  // --- STATS ---
  const stats = useMemo(() => {
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const staff = users.filter(u => u.role === UserRole.STAFF).length;
    const customers = users.filter(u => u.role === UserRole.CUSTOMER).length;
    const totalValue = users.reduce((acc, u) => acc + (u.total_orders_value || 0), 0);
    return { total: users.length, admins, staff, customers, totalValue };
  }, [users]);

  return (
    <div className="account-page-container space-y-8 animate-in fade-in duration-500 max-w-[1440px] mx-auto px-4 lg:px-8 pb-16">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-[18px] flex items-center justify-center text-[#75EEA5] shadow-2xl shadow-slate-900/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Account Infrastructure</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mt-1">Enterprise Human Capital Controller</p>
          </div>
        </div>
        <button 
          onClick={() => openFormModal()}
          className="flex items-center gap-3 px-8 py-4 text-[11px] font-black text-slate-900 bg-[#75EEA5] rounded-3xl hover:bg-[#5de291] transition-all shadow-xl shadow-[#75EEA5]/20 hover:-translate-y-1 active:scale-95 uppercase tracking-[3px] italic border border-[#5de291]/50"
        >
          <UserPlus size={18} />
          Provision Identity
        </button>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registry" value={stats.total} icon={Briefcase} variant="dark" />
        <StatCard title="Active Customers" value={stats.customers} icon={UserCheck} variant="emerald" />
        <StatCard title="Administrative Nodes" value={stats.admins} icon={ShieldCheck} variant="light" />
        <StatCard title="Gross Customer Value" value={Math.floor(stats.totalValue)} prefix="₱" icon={TrendingUp} variant="light" />
      </section>

      {/* Control Bar */}
      <div className="search-filter-bar p-4 bg-white border border-slate-100 rounded-[32px] flex flex-col md:flex-row gap-4 shadow-2xl shadow-slate-200/40 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search Registry..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[22px] text-sm font-bold focus:outline-none focus:border-blue-200 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-mono italic"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors italic appearance-none pr-10"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRoleType)}
          >
            <option value="all">Role: All</option>
            <option value={UserRole.ADMIN}>Role: Admin</option>
            <option value={UserRole.STAFF}>Role: Staff</option>
            <option value={UserRole.CUSTOMER}>Role: Customer</option>
          </select>
          <select
            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors italic appearance-none pr-10"
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
              setSearchTerm('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            className="p-4 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white rounded-[20px] transition-all font-black text-[10px] uppercase flex items-center gap-2 group"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* Account Table */}
      <div className="account-table bg-white border border-slate-100 rounded-[44px] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[3px]">System Node</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Communication</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Identity Role</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[3px]">Health State</th>
                <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[3px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} alt="Avatar" className="w-14 h-14 rounded-[22px] bg-slate-100 shadow-xl object-cover border-2 border-white ring-1 ring-slate-100" />
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white",
                          user.status === 'active' ? "bg-emerald-500" : user.status === 'suspended' ? "bg-amber-500" : "bg-slate-400"
                        )}></div>
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 leading-tight tracking-tight italic uppercase">{user.name}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[2px] font-mono italic">
                          {user.id} <span className="opacity-30 mx-1">/</span> {user.age}Y <span className="opacity-30 mx-1">/</span> {user.gender}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-bold text-slate-600 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        <Mail size={14} className="text-slate-300" /> {user.email}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 flex items-center gap-2 font-mono">
                        <Phone size={14} className="text-slate-300" /> 
                        {user.contact_numbers?.find(c => c.is_default)?.number || 'No Default Node'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-2.5 rounded-[12px] bg-white border border-slate-100 shadow-sm",
                         user.role === UserRole.ADMIN ? "text-slate-900" : user.role === UserRole.STAFF ? "text-blue-500" : "text-emerald-500"
                       )}>
                         {user.role === UserRole.ADMIN ? <ShieldAlert size={18} /> : user.role === UserRole.STAFF ? <Briefcase size={18} /> : <UserCheck size={18} />}
                       </div>
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-[2px] italic",
                         user.role === UserRole.ADMIN ? "text-slate-900" : "text-slate-500"
                       )}>
                         {user.role}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <span className={cn(
                        "w-fit px-4 py-1.5 text-[9px] items-center gap-2 font-black uppercase tracking-widest rounded-full border flex italic shadow-sm",
                        user.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                        user.status === 'suspended' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                        "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        <div className={cn("w-2 h-2 rounded-full", 
                          user.status === 'active' ? 'bg-emerald-500 animate-pulse' : 
                          user.status === 'suspended' ? 'bg-amber-500' : 'bg-slate-400'
                        )}></div>
                        {user.status}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[2px] mt-1 italic">
                        <Clock size={12} className="opacity-50" />
                        {new Date(user.date_created).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <button 
                        onClick={() => openFormModal(user)}
                        className="p-4 text-slate-400 hover:text-white hover:bg-slate-900 rounded-[20px] transition-all shadow-xl hover:shadow-slate-900/40"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => initiateDelete(user)}
                        className="p-4 text-slate-400 hover:text-white hover:bg-rose-500 rounded-[20px] transition-all shadow-xl hover:shadow-rose-500/40"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center bg-slate-50/30">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center border border-slate-100 shadow-2xl animate-bounce duration-[2000ms]">
                        <Search size={40} className="text-slate-200" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-900 italic uppercase">Trace Empty</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mt-2">No matching identity fragments found in current node</p>
                      </div>
                      <button 
                        onClick={() => { setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all'); }}
                        className="px-8 py-3 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-lg"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-8 bg-slate-900/80 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-6xl h-full md:h-auto md:max-h-[85vh] rounded-none md:rounded-[64px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative border-8 border-white/5 animate-in slide-in-from-right-20 duration-500">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-10 bg-white border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-100 rounded-[24px] flex items-center justify-center text-slate-900">
                  {editingUser ? <ShieldCheck size={32} /> : <Plus size={32} />}
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                    {editingUser ? 'Profile Config' : 'Terminal Provisioning'}
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[10x] font-black text-slate-400 uppercase tracking-[4px]">Identity Node Management</p>
                    {editingUser && <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">{editingUser.id}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-16 h-16 bg-slate-50 text-slate-400 hover:text-white hover:bg-rose-500 rounded-full transition-all flex items-center justify-center group"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="account-edit-form flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-10 scroll-smooth">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* LEFT COLUMN: Identity Profile */}
                <div className="lg:col-span-4 space-y-10">
                  <div className="p-10 bg-white border border-slate-100 rounded-[48px] shadow-sm flex flex-col items-center">
                    <Controller
                      control={control}
                      name="profile_picture"
                      render={({ field }) => (
                        <ProfilePictureUploader value={field.value} onChange={field.onChange} />
                      )}
                    />
                    
                    <div className="mt-12 w-full space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">System First Name</label>
                        <input
                          {...register('first_name')}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[28px] text-base font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner font-mono italic"
                        />
                        {errors.first_name && <p className="text-[11px] text-rose-500 font-bold px-4">{errors.first_name.message}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">System Last Name</label>
                        <input
                          {...register('last_name')}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[28px] text-base font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner font-mono italic"
                        />
                        {errors.last_name && <p className="text-[11px] text-rose-500 font-bold px-4">{errors.last_name.message}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Email Node Address</label>
                        <input
                          {...register('email')}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[28px] text-base font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner font-mono"
                        />
                        {errors.email && <p className="text-[11px] text-rose-500 font-bold px-4">{errors.email.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-900 rounded-[40px] text-white space-y-6">
                    <div className="flex items-center gap-4">
                      <Lock className="text-[#75EEA5]" size={20} />
                      <p className="text-[11px] font-black uppercase tracking-[3px] text-[#75EEA5]">Security Protocol</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-[2px]">Admin Overwrite Password</label>
                      <input
                        {...register('password')}
                        type="password"
                        placeholder={editingUser ? "NO CHANGE DETECTED" : "REQUIRED FOR NEW NODE"}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-sm font-bold text-white focus:outline-none focus:border-[#75EEA5] transition-all font-mono"
                      />
                      {errors.password && <p className="text-[11px] text-rose-400 font-bold px-2">{errors.password.message}</p>}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Parameters & Nodes */}
                <div className="lg:col-span-8 space-y-12">
                  
                  {/* section: Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm space-y-6">
                      <h4 className="text-[11px] font-black uppercase tracking-[4px] text-slate-400 border-b border-slate-50 pb-4 mb-2 flex items-center gap-2">
                        <Shield size={14} /> System Access
                      </h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Core Role Assignment</label>
                          <select
                            {...register('role')}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer appearance-none italic"
                          >
                            <option value={UserRole.ADMIN}>ADMINISTRATOR (FULL)</option>
                            <option value={UserRole.STAFF}>PRODUCTION STAFF</option>
                            <option value={UserRole.CUSTOMER}>VERIFIED CUSTOMER</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Health Pulse Status</label>
                          <select
                            {...register('status')}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer appearance-none italic"
                          >
                            <option value="active">ACTIVE OPERATION</option>
                            <option value="suspended">SUSPENDED / LOCKED</option>
                            <option value="archived">ARCHIVED RECORD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm space-y-6">
                      <h4 className="text-[11px] font-black uppercase tracking-[4px] text-slate-400 border-b border-slate-50 pb-4 mb-2 flex items-center gap-2">
                        <Info size={14} /> Bio Matrix
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Age Node</label>
                          <input
                            {...register('age', { valueAsNumber: true })}
                            type="number"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black text-slate-900 focus:outline-none focus:bg-white transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Gender</label>
                          <select
                            {...register('gender')}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black uppercase text-slate-900 focus:outline-none focus:bg-white transition-all font-mono italic"
                          >
                            <option value="male">MALE</option>
                            <option value="female">FEMALE</option>
                            <option value="other">OTHER</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-[2px]">Company Entity Name</label>
                         <input
                           {...register('company_name')}
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-black text-slate-900 focus:outline-none focus:bg-white transition-all font-mono italic"
                         />
                      </div>
                    </div>
                  </div>

                  {/* section: Contacts (Field Array) */}
                  <div className="p-10 bg-white border border-slate-100 rounded-[48px] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[11px] font-black uppercase tracking-[4px] text-slate-400 flex items-center gap-2">
                         <Phone size={14} /> Contact Propagation Nodes
                       </h4>
                       <button 
                         type="button"
                         onClick={() => appendContact({ number: '+63 ', is_default: false })}
                         className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                       >
                         <Plus size={12} /> Add Network Node
                       </button>
                    </div>
                    <div className="space-y-4">
                      {contactFields.map((field, index) => (
                        <div key={field.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 rounded-[24px] border border-slate-100 group transition-all hover:bg-slate-100/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="relative">
                               <input
                                 {...register(`contact_numbers.${index}.number`)}
                                 placeholder="+63 XXX XXX XXXX"
                                 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[18px] text-sm font-black text-slate-900 focus:outline-none focus:border-blue-500 transition-all font-mono"
                               />
                               <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            </div>
                            <div className="flex items-center justify-between bg-white px-6 py-3 rounded-[18px] border border-slate-200">
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Node</span>
                               <input 
                                 type="checkbox"
                                 {...register(`contact_numbers.${index}.is_default`)}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                      // uncheck others
                                      contactFields.forEach((_, i) => i !== index && setValue(`contact_numbers.${i}.is_default`, false));
                                   }
                                   setValue(`contact_numbers.${index}.is_default`, e.target.checked);
                                 }}
                                 className="w-5 h-5 accent-emerald-500 cursor-pointer"
                               />
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeContact(index)}
                            disabled={contactFields.length === 1}
                            className="p-4 text-slate-300 hover:text-rose-500 hover:bg-white rounded-[18px] transition-all disabled:opacity-30 self-stretch flex items-center justify-center"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      ))}
                      {errors.contact_numbers?.message && <p className="text-xs text-rose-500 font-bold">{errors.contact_numbers.message}</p>}
                    </div>
                  </div>

                  {/* section: Addresses */}
                  <div className="account-address-section p-10 bg-white border border-slate-100 rounded-[48px] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-[11px] font-black uppercase tracking-[4px] text-slate-400 flex items-center gap-2">
                         <MapPin size={14} /> Geographical Registry
                       </h4>
                       <button 
                         type="button"
                         onClick={() => setTempAddresses([...tempAddresses, { label: 'New Label', address: '' }])}
                         className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                       >
                         <Plus size={12} /> Add Location
                       </button>
                    </div>
                    <div className="space-y-4">
                      {tempAddresses.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                           <MapPin size={32} className="text-slate-100 mx-auto mb-3" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No addresses defined for this node</p>
                        </div>
                      ) : tempAddresses.map((addr, idx) => (
                        <div key={idx} className="account-address-item p-6 bg-slate-50 rounded-[32px] border border-slate-100 group">
                           <div className="flex items-center justify-between mb-4">
                              <input 
                                value={addr.label} 
                                onChange={(e) => {
                                  const next = [...tempAddresses];
                                  next[idx].label = e.target.value;
                                  setTempAddresses(next);
                                }}
                                className="bg-transparent border-none p-0 text-[11px] font-black uppercase tracking-[3px] text-blue-600 focus:outline-none w-1/2"
                              />
                              <button 
                                type="button"
                                onClick={() => setTempAddresses(tempAddresses.filter((_, i) => i !== idx))}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-full transition-all"
                              >
                                <X size={14} />
                              </button>
                           </div>
                           <textarea 
                             value={addr.address}
                             onChange={(e) => {
                               const next = [...tempAddresses];
                               next[idx].address = e.target.value;
                               setTempAddresses(next);
                             }}
                             placeholder="Full physical address path..."
                             className="w-full p-6 bg-white border border-slate-200 rounded-[22px] text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-all font-mono resize-none h-24 shadow-inner"
                           />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* section: Role Specific Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Employee Only */}
                    {(watchRole === UserRole.ADMIN || watchRole === UserRole.STAFF) && (
                      <div className="p-8 bg-blue-50 border border-blue-100 rounded-[40px] space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[4px] text-blue-400 flex items-center gap-2">
                          <Briefcase size={14} /> Employment Specs
                        </h4>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-blue-300 uppercase tracking-[2px]">Daily Rate Node (₱)</label>
                             <input
                               {...register('daily_rate', { valueAsNumber: true })}
                               type="number"
                               className="w-full px-6 py-4 bg-white border border-blue-200 rounded-[20px] text-sm font-black text-blue-900 focus:outline-none transition-all font-mono italic"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-blue-300 uppercase tracking-[2px]">Overtime Rate Factor (₱)</label>
                             <input
                               {...register('ot_rate', { valueAsNumber: true })}
                               type="number"
                               className="w-full px-6 py-4 bg-white border border-blue-200 rounded-[20px] text-sm font-black text-blue-900 focus:outline-none transition-all font-mono italic"
                             />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Only */}
                    {watchRole === UserRole.CUSTOMER && (
                      <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] space-y-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[4px] text-emerald-400 flex items-center gap-2">
                          <Star size={14} /> Commercial Node stats
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-emerald-900">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Yield</span>
                             <span className="text-xl font-black font-mono">₱{(editingUser?.total_orders_value || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-900">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Payload Count</span>
                             <span className="text-xl font-black font-mono">{editingUser?.orders || 0}</span>
                          </div>
                          <div className="pt-4 mt-4 border-t border-emerald-100 flex items-center gap-2 text-emerald-600 font-black italic text-[11px] uppercase tracking-widest cursor-not-allowed opacity-50">
                            <ExternalLink size={14} /> View Order History
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Placeholder for symmetry if only one column shown */}
                    {!((watchRole === UserRole.ADMIN || watchRole === UserRole.STAFF) || watchRole === UserRole.CUSTOMER) && (
                       <div className="hidden md:block"></div>
                    )}
                  </div>

                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-16 flex flex-col md:flex-row gap-6 pt-12 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-10 py-6 text-[12px] font-black text-slate-400 bg-white border-2 border-slate-100 rounded-[32px] hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 uppercase tracking-[4px] italic"
                >
                  Terminate Process
                </button>
                <button
                  type="submit"
                  className="flex-1 px-10 py-6 text-[12px] font-black text-slate-900 bg-[#75EEA5] rounded-[32px] hover:bg-[#5de291] transition-all shadow-[0_20px_50px_rgba(117,238,165,0.3)] hover:-translate-y-2 active:scale-95 uppercase tracking-[5px] flex items-center justify-center gap-4 italic border-4 border-white"
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[64px] shadow-[0_0_150px_rgba(244,63,94,0.3)] overflow-hidden border-8 border-rose-50 flex flex-col items-center text-center p-12">
            
            <div className={cn(
              "w-32 h-32 rounded-[44px] flex items-center justify-center mb-10 transition-all duration-500",
              isDeleteModalOpen.step === 1 ? "bg-rose-50 animate-pulse" : "bg-slate-900 rotate-12"
            )}>
              {isDeleteModalOpen.step === 1 ? (
                <Trash2 size={54} className="text-rose-500" />
              ) : (
                <ShieldAlert size={54} className="text-[#FBBF24]" />
              )}
            </div>

            {isDeleteModalOpen.step === 1 ? (
              <div className="space-y-6 w-full animate-in slide-in-from-bottom-10">
                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Identity Purge Protocol</h3>
                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Trace Summary</p>
                  <p className="text-lg font-black text-slate-900 italic uppercase underline decoration-[#FBBF24] decoration-4">{isDeleteModalOpen.user?.name}</p>
                  <p className="text-[11px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-widest">{isDeleteModalOpen.user?.id} / {isDeleteModalOpen.user?.email}</p>
                </div>
                
                <div className="space-y-4">
                   <div className="text-left space-y-2">
                      <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">Reason for Identity Purge</label>
                      <textarea 
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Must specify the operational reason for deletion..."
                        className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[28px] text-sm font-bold focus:outline-none focus:border-rose-300 h-32 font-mono resize-none"
                      />
                   </div>

                   <label className="flex items-center gap-4 p-6 bg-rose-50 rounded-[32px] border border-rose-100 cursor-pointer group hover:bg-rose-100 transition-all">
                      <input 
                        type="checkbox" 
                        checked={deleteConfirmed}
                        onChange={(e) => setDeleteConfirmed(e.target.checked)}
                        className="w-6 h-6 accent-rose-500" 
                      />
                      <span className="text-[11px] font-black text-rose-800 uppercase tracking-widest text-left leading-relaxed">
                        I understand that this action is irreversible and will purge this identity from all active registries.
                      </span>
                   </label>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setIsDeleteModalOpen({open: false, user: null, step: 1})} className="flex-1 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest italic hover:bg-slate-50 rounded-full transition-all">Abort</button>
                  <button 
                    onClick={handleSecureDelete}
                    className="flex-[2] py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[3px] italic rounded-[28px] hover:scale-105 transition-all shadow-xl shadow-slate-900/40"
                  >
                    Proceed to Verification <ArrowRight size={16} className="inline ml-2" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 w-full animate-in zoom-in-95">
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Admin Credentials</h3>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[4px] mt-2">Security Verification Required</p>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="relative">
                       <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                       <input 
                         type="password"
                         value={deletePassword}
                         onChange={(e) => setDeletePassword(e.target.value)}
                         placeholder="ADMIN_ACCESS_KEY"
                         className="w-full pl-16 pr-8 py-6 bg-slate-900 text-white border-4 border-slate-800 rounded-[32px] text-lg font-black tracking-[10px] focus:outline-none focus:border-[#75EEA5] transition-all font-mono"
                       />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                      Verify identity to confirm registry modification
                    </p>
                 </div>

                 <div className="flex flex-col gap-4 pt-6">
                   <button 
                     onClick={handleSecureDelete}
                     disabled={isDeleting}
                     className="w-full py-6 bg-rose-500 text-white font-black uppercase italic tracking-[5px] text-sm rounded-[32px] hover:bg-rose-600 transition-all shadow-[0_20px_60px_rgba(244,63,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
                   >
                     {isDeleting ? "PURGING..." : (
                        <span className="flex items-center justify-center gap-3">
                          <Trash2 size={20} className="group-hover:animate-bounce" />
                          Finalize Purge
                        </span>
                     )}
                   </button>
                   <button 
                     onClick={() => setIsDeleteModalOpen(prev => ({...prev, step: 1}))} 
                     className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all"
                   >
                     Back to parameters
                   </button>
                 </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-center gap-3">
              <div className={cn("w-16 h-1.5 rounded-full transition-all duration-500", isDeleteModalOpen.step === 1 ? "bg-rose-500 w-24" : "bg-slate-100")}></div>
              <div className={cn("w-16 h-1.5 rounded-full transition-all duration-500", isDeleteModalOpen.step === 2 ? "bg-rose-500 w-24" : "bg-slate-100")}></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounts;
