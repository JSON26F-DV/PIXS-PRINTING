import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
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
  FiRefreshCw
} from 'react-icons/fi';
import { clsx } from 'clsx';
import AccountInputField from './components/AccountInputField';
import PhoneInputGroup from './components/PhoneInputGroup';
import { useAccountInfo } from './hooks/useAccountInfo';
import { useOTPVerification } from '../../../hooks/useOTPVerification';
import { calculatePasswordStrength, getStrengthLabel } from '../../../utils/passwordValidation';
import { validateContact } from '../../../utils/contactValidation';
import { profileSchema, passwordFormSchema, type ProfileFormValues, type PasswordFormValues } from './utils/validation';

const AccountInfoPage: React.FC = () => {
  const { defaultAccount, updateProfile, updatePassword, uploadProfilePicture } = useAccountInfo();
  const otp = useOTPVerification();
  const location = useLocation();
  
  // ─── States ──────────────────────────────────────────────────────────────
  const [profilePreview, setProfilePreview] = useState(defaultAccount.profilePicture);
  const [contacts, setContacts] = useState(defaultAccount.contacts);
  const [isAddingContact, setIsAddingContact] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('action') === 'add-contact';
  });
  const [newContact, setNewContact] = useState('');
  const [contactError, setContactError] = useState('');
  
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Navigation Logic ───────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('scroll') === 'contact-section') {
      const element = document.getElementById('contact-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [location]);

  // ─── Form Logic ──────────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: defaultAccount.name, email: defaultAccount.email }
  });

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    control: controlPass,
    formState: { errors: passErrors, isSubmitting: isSubmittingPass },
    reset: resetPass
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  const newPassValue = useWatch({ control: controlPass, name: 'newPassword' }) || '';
  const strength = calculatePasswordStrength(newPassValue);
  const strengthInfo = getStrengthLabel(strength);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const onProfileUpdate = async (values: ProfileFormValues) => {
    const result = await updateProfile(values);
    if (result.success) toast.success('Profile updated successfully.');
  };

  const handleSetDefaultContact = (number: string) => {
    const updated = contacts.map(c => ({
      ...c,
      is_default: c.number === number
    }));
    setContacts(updated);
    toast.success(`Primary contact updated: ${number}`);
  };

  const handleAddContact = () => {
    const validation = validateContact(newContact);
    if (!validation.valid) {
      setContactError(validation.error || 'Invalid number');
      return;
    }
    if (contacts.find(c => c.number === newContact)) {
      setContactError('This number is already registered.');
      return;
    }

    setContacts([...contacts, { number: newContact, is_default: false }]);
    setIsAddingContact(false);
    setNewContact('');
    setContactError('');
    toast.success('New contact number added.');
  };

  const handlePasswordResetComplete = async (values: PasswordFormValues) => {
    const result = await updatePassword(values);
    if (result.success) {
      toast.success('Password changed successfully.');
      resetPass();
      otp.resetVerification();
      setOtpInput('');
    }
  };

  return (
    <div className="AccountInfoPage min-h-screen space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* ─── Profile Information ────────────────────────────────────────────── */}
      <section className="ProfileSection bg-white rounded-[44px] p-10 shadow-2xl shadow-slate-100 border border-slate-50 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-[56px] overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-700 bg-slate-50">
               {profilePreview ? (
                 <img src={profilePreview} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-slate-900 flex items-center justify-center text-pixs-mint text-5xl font-black italic">
                   {defaultAccount.name[0]}
                 </div>
               )}
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-all"
               >
                 <FiCamera className="text-white" size={32} />
               </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) uploadProfilePicture(file).then(r => r.url && setProfilePreview(r.url));
            }} className="hidden" accept="image/*" />
          </div>

          <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AccountInputField 
                label="Full Name" 
                icon={FiUser} 
                registration={regProfile('name')} 
                error={profileErrors.name} 
              />
              <AccountInputField 
                label="Email Address" 
                icon={FiMail} 
                registration={regProfile('email')} 
                error={profileErrors.email} 
              />
            </div>
            <div className="flex justify-end">
              <button disabled={isSubmittingProfile} className="flex items-center gap-3 bg-slate-900 text-white rounded-[24px] px-12 py-5 text-[10px] font-black uppercase tracking-[4px] italic hover:scale-105 transition-all active:scale-95 disabled:opacity-40">
                {isSubmittingProfile ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── Contact Management ──────────────────────────────────────────────── */}
      <section id="contact-section" className="ContactNumbersSection bg-white rounded-[44px] p-10 border border-slate-50 shadow-xl space-y-10">
        <div className="flex items-center justify-between border-b border-slate-50 pb-8">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Contact Numbers</h2>
            <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Manage your verified phone sequences</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsAddingContact(!isAddingContact)}
            className="flex items-center gap-2 bg-pixs-mint text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95"
          >
            <FiPlus size={16} /> Add Contact Number
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 italic">Primary Contact Number</label>

             <div className="flex flex-wrap gap-4">
                {contacts.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSetDefaultContact(c.number)}
                    className={clsx(
                      "flex items-center gap-4 px-6 py-4 rounded-[24px] border-2 transition-all text-left group",
                      c.is_default 
                        ? "border-pixs-mint bg-pixs-mint/5 shadow-lg shadow-pixs-mint/10" 
                        : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      c.is_default ? "bg-pixs-mint text-slate-900" : "bg-slate-50 text-slate-300 group-hover:text-slate-400"
                    )}>
                      {c.is_default ? <FiCheckCircle size={20} /> : <FiPhone size={18} />}
                    </div>
                    <div>
                      <p className={clsx("text-sm font-black", c.is_default ? "text-slate-900" : "text-slate-600")}>{c.number}</p>
                      {c.is_default && <span className="text-[8px] font-black text-pixs-mint uppercase tracking-widest">Active Primary</span>}
                    </div>
                  </button>
                ))}
             </div>
          </div>

          {isAddingContact && (
            <div className="AddContactForm bg-slate-50 rounded-[32px] p-8 border border-dashed border-slate-200 animate-in zoom-in duration-300">
               <PhoneInputGroup 
                 label="Mobile Number"

                 value={newContact} 
                 onChange={(v) => setNewContact(v || '')} 
                 error={contactError}
               />
               <div className="flex gap-4 mt-6">
                 <button onClick={handleAddContact} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Add Number</button>
                 <button onClick={() => setIsAddingContact(false)} className="px-6 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Password Security ───────────────────────────────────────────────── */}
      <section className="PasswordSection bg-slate-900 rounded-[44px] p-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
        <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-8">
           <div className="w-16 h-16 bg-white/5 rounded-[28px] border border-white/10 flex items-center justify-center">
              <FiShield className="text-rose-500" size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Security & Password</h2>
              <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-500">Update your account credentials</p>
           </div>
        </div>

        {/* Verification Flow */}
        {otp.step === 'method' && (
          <div className="VerificationMethodSection space-y-8 animate-in slide-in-from-left duration-500">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-300 italic">Verify your identity to change password</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => otp.sendCode('email')}
                className="VerificationOption group p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-pixs-mint/40 transition-all text-left"
              >
                <FiMail className="text-pixs-mint mb-4" size={24} />
                <h4 className="text-white font-black uppercase italic text-sm tracking-widest">Via Email</h4>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">To {defaultAccount.email}</p>
              </button>
              
              <div className="relative group">
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-pixs-mint/40 transition-all">
                  <FiPhone className="text-amber-500 mb-4" size={24} />
                  <h4 className="text-white font-black uppercase italic text-sm tracking-widest">Via SMS</h4>
                  <select 
                    className="w-full bg-transparent text-slate-300 text-[10px] font-black uppercase tracking-widest mt-2 outline-none border-b border-white/10 pb-2 cursor-pointer"
                    onChange={() => otp.sendCode('sms')}
                  >
                    <option className="bg-slate-900" value="">Select phone number...</option>
                    {contacts.map((c, i) => <option className="bg-slate-900" key={i} value={c.number}>{c.number}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {otp.step === 'otp' && (
          <div className="OTPInputSection space-y-10 animate-in zoom-in duration-500 text-center">
            <div className="space-y-4">
               <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Enter Verification Code</h3>
               <p className="text-[10px] font-black text-pixs-mint uppercase tracking-[3px]">Sent to your {otp.method?.toUpperCase()}</p>
            </div>
            
            <div className="flex flex-col items-center gap-6">
               <div className="bg-white/5 border-2 border-white/10 rounded-[32px] p-2 focus-within:border-pixs-mint transition-all">
                  <input 
                    type="text" 
                    maxLength={6} 
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-64 text-center bg-transparent text-5xl font-black tracking-[12px] text-white outline-none caret-pixs-mint"
                    disabled={otp.isLocked}
                    placeholder="000000"
                  />
               </div>
               
               {otp.isLocked ? (
                 <div className="flex items-center gap-3 text-rose-500 italic">
                   <FiAlertCircle size={18} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Try again in 30 seconds</span>
                 </div>
               ) : (
                 <button 
                   onClick={() => otp.verifyOTP(otpInput)}
                   className="bg-pixs-mint text-slate-900 px-12 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[4px] italic hover:scale-105 active:scale-95 transition-all"
                 >
                   Verify Identity
                 </button>
               )}
            </div>
          </div>
        )}

        {otp.step === 'verified' && (
          <form onSubmit={handlePassSubmit(handlePasswordResetComplete)} className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                 <div className="relative">
                   <FiLock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    type={showNewPass ? 'text' : 'password'}
                    {...regPass('newPassword')}
                    placeholder="New Password"
                    className="w-full bg-white/5 border border-white/10 rounded-[28px] pl-16 pr-16 py-6 text-white text-sm font-bold italic outline-none focus:border-pixs-mint transition-all"
                   />
                   <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                      {showNewPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                   </button>
                 </div>
                 {passErrors.newPassword && <p className="text-[9px] font-black uppercase text-rose-500 italic px-4">{passErrors.newPassword.message}</p>}

                 <div className="space-y-3 px-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Security Strength</span>
                       <span className={clsx("text-[8px] font-black uppercase tracking-widest italic", strengthInfo.color)}>{strengthInfo.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className={clsx("h-full transition-all duration-700", strengthInfo.bar)} 
                         style={{ width: `${strength}%` }} 
                       />
                    </div>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="relative">
                   <FiLock size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                   <input 
                    type={showConfirmPass ? 'text' : 'password'}
                    {...regPass('confirmPassword')}
                    onPaste={(e) => e.preventDefault()}
                    placeholder="Confirm Password"
                    className="w-full bg-white/5 border border-white/10 rounded-[28px] pl-16 pr-16 py-6 text-white text-sm font-bold italic outline-none focus:border-pixs-mint transition-all"
                   />
                   <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white">
                      {showConfirmPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                   </button>
                 </div>
                 {passErrors.confirmPassword && <p className="text-[9px] font-black uppercase text-rose-500 italic px-4">{passErrors.confirmPassword.message}</p>}
               </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/5">
               <button 
                 type="submit"
                 disabled={isSubmittingPass}
                 className="bg-rose-500 text-white rounded-[32px] px-16 py-6 text-sm font-black uppercase tracking-[6px] italic shadow-2xl shadow-rose-900/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
               >
                 {isSubmittingPass ? 'Saving...' : 'Update Password'}
               </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default AccountInfoPage;
