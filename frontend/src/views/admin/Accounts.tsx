import React, { useState, useMemo, type FormEvent } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Download, 
  Edit2, 
  Trash2, 
  User, 
  CheckCircle, 
  X,
  Mail,
  Phone,
  MapPin,
  Lock,
  Calendar,
  CreditCard,
  Building2,
  CheckSquare,
  Square,
  Ban
} from 'lucide-react';
import Papa from 'papaparse';
import type { Employee, Customer } from '../../types';
import usersData from '../../data/users.json';
import { clsx } from 'clsx';

interface StatusPillProps {
  status: string;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const isActive = status?.toLowerCase() === 'active';
  return (
    <span className={clsx(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      isActive 
        ? 'bg-[#D6FBE8] text-[#1e4631] border-[#75EEA5]' 
        : 'bg-slate-50 text-slate-400 border-slate-200'
    )}>
      <span className={clsx("w-1 h-1 rounded-full mr-1.5", isActive ? 'bg-[#1e4631]' : 'bg-slate-400')} />
      {status}
    </span>
  );
};

interface AvatarProps {
  name: string;
  size?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'h-8 w-8' }) => {
  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${size} rounded-full bg-pixs-mint/20 border border-pixs-mint/30 flex items-center justify-center text-pixs-mint font-bold text-xs`}>
      {initials || <User size={14} />}
    </div>
  );
};

type GenericEntry = Partial<Employee & Customer> & { 
  id: string; 
  name: string;
  role?: string;
  type?: string;
  orders?: number;
};

const Accounts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'customers'>('employees');
  const [employees, setEmployees] = useState<Employee[]>(usersData.employees as unknown as Employee[]);
  const [customers, setCustomers] = useState<Customer[]>(usersData.customers as unknown as Customer[]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentEntry, setCurrentEntry] = useState<GenericEntry | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activeData = activeTab === 'employees' ? employees : customers;

  const filteredData = useMemo(() => {
    const isEmployeeCheck = (item: Employee | Customer): item is Employee => {
      return 'role' in item;
    };

    return (activeData as Array<Employee | Customer>).filter(item => {
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const content = `${fullName} ${item.email} ${item.id}`.toLowerCase();
      const matchesSearch = content.includes(searchQuery.toLowerCase());
      
      const role = isEmployeeCheck(item) ? item.role : item.type;
      const matchesRole = roleFilter === 'all' || role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (item as Employee).status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeData, searchQuery, roleFilter, statusFilter]);

  const handleExportCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly 
      ? activeData.filter(item => selectedIds.includes(item.id))
      : activeData;
    
    if (dataToExport.length === 0) return;

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_list_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account? This is a soft-delete action.')) {
      if (activeTab === 'employees') {
        setEmployees(employees.filter(e => e.id !== id));
      } else {
        setCustomers(customers.filter(c => c.id !== id));
      }
    }
  };

  const handleBulkDeactivate = () => {
    if (window.confirm(`Deactivate ${selectedIds.length} selected accounts?`)) {
      if (activeTab === 'employees') {
        setEmployees(employees.map(e => selectedIds.includes(e.id) ? { ...e, status: 'inactive' } : e));
      } else {
        setCustomers(customers.map(c => selectedIds.includes(c.id) ? { ...c, status: 'inactive' } : c));
      }
      setSelectedIds([]);
    }
  };

  const handleOpenModal = (entry: unknown = null) => {
    const defaultEntry = activeTab === 'employees' 
      ? ({ 
          id: `EMP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, 
          first_name: '', last_name: '', name: '', email: '', role: 'staff', status: 'active', 
          contact_number: '', company_name: 'PIXS PRINTING SHOP', business_address: '', 
          password: '', date_created: new Date().toISOString(), last_login: '', total_orders_value: 0 
        } as unknown as GenericEntry)
      : ({ 
          id: `CUST-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, 
          first_name: '', last_name: '', name: '', email: '', type: 'retail', status: 'active', 
          contact_number: '', company_name: '', business_address: '', 
          password: '', date_created: new Date().toISOString(), last_login: '', total_orders_value: 0, orders: 0 
        } as unknown as GenericEntry);

    setCurrentEntry((entry as GenericEntry) || defaultEntry);
    setIsEditing(!!entry);
    setShowModal(true);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!currentEntry) return;

    const entryToSave = { ...currentEntry, name: `${currentEntry.first_name} ${currentEntry.last_name}` };
    if (activeTab === 'employees') {
      const emp = entryToSave as Employee;
      if (isEditing) {
        setEmployees(employees.map(e => e.id === emp.id ? emp : e));
      } else {
        setEmployees([...employees, emp]);
      }
    } else {
      const cust = entryToSave as Customer;
      if (isEditing) {
        setCustomers(customers.map(c => c.id === cust.id ? cust : c));
      } else {
        setCustomers([...customers, cust]);
      }
    }
    setShowModal(false);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map(item => item.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User & Entity Management</h1>
          <p className="text-sm text-slate-500">Relational control for employees and verified customers.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg mr-2">
              <span className="text-[10px] font-bold px-2 text-slate-600 uppercase">{selectedIds.length} Selected</span>
              <button 
                onClick={handleBulkDeactivate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-rose-600 bg-white border border-rose-100 rounded-md hover:bg-rose-50 transition-colors uppercase"
              >
                <Ban size={12} />
                Deactivate
              </button>
              <button 
                onClick={() => handleExportCSV(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors uppercase"
              >
                <Download size={12} />
                Export
              </button>
            </div>
          )}
          <button 
            onClick={() => handleExportCSV()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Download size={16} />
            Master Export
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-900 bg-pixs-mint rounded-xl hover:bg-[#5de291] transition-all shadow-lg shadow-pixs-mint/20 active:scale-95"
          >
            <UserPlus size={16} />
            Create Entity
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('employees'); setRoleFilter('all'); setSelectedIds([]); }}
          className={clsx(
            "px-6 py-3 text-sm font-bold transition-all relative",
            activeTab === 'employees' ? 'text-pixs-mint' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          System Personnel
          {activeTab === 'employees' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pixs-mint" />}
        </button>
        <button
          onClick={() => { setActiveTab('customers'); setRoleFilter('all'); setSelectedIds([]); }}
          className={clsx(
            "px-6 py-3 text-sm font-bold transition-all relative",
            activeTab === 'customers' ? 'text-pixs-mint' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          Customer Base
          {activeTab === 'customers' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pixs-mint" />}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, company, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 focus:outline-none focus:border-pixs-mint"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Unified Roles</option>
            {activeTab === 'employees' ? (
              <>
                <option value="admin">Administrator</option>
                <option value="staff">Floor Staff</option>
                <option value="inventory">Logistics</option>
                <option value="designer">Creative</option>
              </>
            ) : (
              <>
                <option value="retail">B2C Retail</option>
                <option value="wholesale">B2B Wholesale</option>
              </>
            )}
          </select>
          <select
            className="px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 focus:outline-none focus:border-pixs-mint"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Any Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-pixs-mint transition-colors">
                    {selectedIds.length === filteredData.length && filteredData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity / Company</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Activity Value</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? filteredData.map((item) => (
                <tr key={item.id} className={clsx(
                  "hover:bg-slate-50/50 transition-colors group",
                  selectedIds.includes(item.id) && "bg-pixs-mint/5"
                )}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(item.id)} className={clsx(
                      "transition-colors",
                      selectedIds.includes(item.id) ? "text-pixs-mint" : "text-slate-200 group-hover:text-slate-300"
                    )}>
                      {selectedIds.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={item.name} />
                      <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                          <Building2 size={10} />
                          {item.company_name || 'Individual'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit italic">
                        {item.id}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-tighter">
                        <Lock size={8} /> {(item as Employee).role || (item as Customer).type} mode
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <StatusPill status={(item as Employee).status} />
                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.business_address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-pixs-mint transition-colors"
                          title={item.business_address}
                        >
                          <MapPin size={12} />
                        </a>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {item.last_login ? new Date(item.last_login).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm font-bold text-slate-700">
                        ₱{item.total_orders_value?.toLocaleString() || '0'}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{(item as Customer).orders || 0} Orders</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-slate-400 hover:text-pixs-mint hover:bg-pixs-mint/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Users size={48} className="opacity-20" />
                      <p className="text-sm font-medium">No results matched the specified parameters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Double Column Form */}
      {showModal && currentEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/30">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isEditing ? 'Configure Entity' : 'New Entity Provisioning'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Internal System Relational Registry</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-2 gap-10">
                {/* Column 1: Personal Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-pixs-mint rounded-full" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Personal Specifications</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">First Name</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint"
                        value={currentEntry.first_name}
                        onChange={(e) => setCurrentEntry({...currentEntry, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Last Name</label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint"
                        value={currentEntry.last_name}
                        onChange={(e) => setCurrentEntry({...currentEntry, last_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Node</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        required
                        type="email"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint"
                        value={currentEntry.email}
                        onChange={(e) => setCurrentEntry({...currentEntry, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Comm</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint"
                        placeholder="+63 ..."
                        value={currentEntry.contact_number}
                        onChange={(e) => setCurrentEntry({...currentEntry, contact_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Access Cipher (Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="password"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint font-mono"
                        placeholder="••••••••"
                        value={currentEntry.password}
                        onChange={(e) => setCurrentEntry({...currentEntry, password: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Business & Access */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Business & Logic Spec</h4>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Entity Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint"
                        placeholder="Company Name"
                        value={currentEntry.company_name}
                        onChange={(e) => setCurrentEntry({...currentEntry, company_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Physical Geotag (Address)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pixs-mint"
                        placeholder="Laguna, Philippines"
                        value={currentEntry.business_address}
                        onChange={(e) => setCurrentEntry({...currentEntry, business_address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {activeTab === 'employees' ? 'System Role' : 'Market Type'}
                      </label>
                      <select
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-pixs-mint"
                        value={activeTab === 'employees' ? currentEntry.role : currentEntry.type}
                        onChange={(e) => setCurrentEntry(activeTab === 'employees' 
                          ? {...currentEntry, role: e.target.value as Employee['role']} 
                          : {...currentEntry, type: e.target.value as Customer['type']}
                        )}
                      >
                        {activeTab === 'employees' ? (
                          <>
                            <option value="admin">Administrator</option>
                            <option value="staff">Floor Staff</option>
                            <option value="inventory">Logistics Manager</option>
                            <option value="designer">Creative Director</option>
                          </>
                        ) : (
                          <>
                            <option value="retail">Retail Client</option>
                            <option value="wholesale">Wholesale Partner</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registry Status</label>
                      <select
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-pixs-mint"
                        value={currentEntry.status}
                        onChange={(e) => setCurrentEntry({...currentEntry, status: e.target.value as Employee['status']})}
                      >
                        <option value="active">Active Entry</option>
                        <option value="inactive">Lock Account</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Lifetime Value</p>
                      <p className="text-xl font-mono font-bold text-slate-900">₱{currentEntry.total_orders_value?.toLocaleString()}</p>
                    </div>
                    <CreditCard size={24} className="text-slate-200" />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
              >
                Cancel Changes
              </button>
              <button
                type="submit"
                onClick={handleSave}
                className="flex-[2] px-6 py-3 text-sm font-bold text-slate-900 bg-pixs-mint rounded-2xl hover:bg-[#5de291] transition-all shadow-xl shadow-pixs-mint/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                {isEditing ? 'Commit Changes' : 'Provision Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
