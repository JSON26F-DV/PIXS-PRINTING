import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiSave,
  FiUser,
  FiCamera,
  FiCheckCircle,
} from 'react-icons/fi';
import AccountInputField from './components/AccountInputField';
import { useAccountInfo } from './hooks/useAccountInfo';
import { 
  profileSchema, type ProfileFormValues, 
  passwordSchema, type PasswordFormValues 
} from './utils/validation';

const AccountInfoPage: React.FC = () => {
  const { defaultAccount, updateProfile, updatePassword, uploadProfilePicture } = useAccountInfo();
  
  // ─── Profile Selection Node State ──────────────────────────────────────────
  const [profilePreview, setProfilePreview] = useState(defaultAccount.profilePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Password Visibility Management ────────────────────────────────────────
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Profile Form Integration ─────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultAccount.name,
      email: defaultAccount.email,
      phone: defaultAccount.phone,
    },
  });

  // ─── Password Form Integration ────────────────────────────────────────────
  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // ─── Profile Update Pipeline ──────────────────────────────────────────────
  const onProfileSubmit = async (values: ProfileFormValues) => {
    const result = await updateProfile(values);
    if (result.success) {
      toast.success('Profile configuration updated successfully.');
      // TODO: PHPMailer: Logic to send an email notification about profile update nodes.
    } else {
      toast.error('Unable to synchronize profile data.');
    }
  };

  // ─── Password Update Pipeline ─────────────────────────────────────────────
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    const result = await updatePassword(values);
    if (result.success) {
      toast.success('Password protocol re-synchronized successfully.');
      resetPassword();
      // ─── PHPMailer Concept ──────────────────────────────────────────────────
      // TODO: Use PHPMailer to send a security confirmation email indicating 
      // the password cluster was updated securely.
    } else {
      toast.error('Unable to calibrate password node.');
    }
  };

  // ─── Image Binary Logic Node ──────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadProfilePicture(file);
      if (result.success && result.url) {
        setProfilePreview(result.url);
        toast.success('Profile binary uploaded.');
      }
    }
  };

  return (
    <div className="SettingsAccountInfoPage px-6 py-8 md:px-10 md:py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── Change Profile Section Node ───────────────────────────────────────── */}
      <section className="AccountFormSection space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-8">
           <div>
             <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic leading-none mb-2">Change Profile</h2>
             <p className="text-[10px] font-black tracking-[4px] text-slate-400 uppercase italic">Configure identity nodes and contact protocols</p>
           </div>
           
           {/* Profile Picture Identification Node */}
           <div className="ProfilePictureUpload relative group flex flex-col items-center">
             <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl shadow-slate-200 group-hover:scale-105 transition-transform duration-500">
               {profilePreview ? (
                 <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-slate-900 flex items-center justify-center text-pixs-mint text-4xl font-black italic">
                   {defaultAccount.name[0]?.toUpperCase()}
                 </div>
               )}
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm"
               >
                 <FiCamera className="text-white" size={24} />
               </button>
             </div>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
             />
             <p className="mt-3 text-[8px] font-black uppercase tracking-[3px] text-slate-300 italic group-hover:text-pixs-mint transition-colors">Update Avatar Binary</p>
           </div>
        </div>

        <form className="SettingsAccountInfo space-y-6" onSubmit={handleProfileSubmit(onProfileSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountInputField
              label="Name Node"
              placeholder="Full Identification String"
              icon={FiUser}
              registration={regProfile('name')}
              error={errorsProfile.name}
              rightIcon={<FiEdit2 className="text-slate-200 group-focus-within:text-pixs-mint transition-colors" size={14} />}
            />

            <AccountInputField
              label="Email Terminal"
              placeholder="communication@node.com"
              icon={FiMail}
              registration={regProfile('email')}
              error={errorsProfile.email}
              rightIcon={<FiEdit2 className="text-slate-200 group-focus-within:text-pixs-mint transition-colors" size={14} />}
            />

            <AccountInputField
              label="Mobile Sequence"
              placeholder="+63xxxxxxxxx"
              icon={FiPhone}
              registration={regProfile('phone')}
              error={errorsProfile.phone}
              rightIcon={<FiEdit2 className="text-slate-200 group-focus-within:text-pixs-mint transition-colors" size={14} />}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmittingProfile}
              className="ChangeProfileButton AccountButton flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-10 py-5 text-[10px] font-black uppercase tracking-[4px] italic border border-white/10 shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmittingProfile ? (
                 <div className="w-4 h-4 border-2 border-pixs-mint border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave size={14} />
              )}
              {isSubmittingProfile ? 'Synchronizing...' : 'Change Profile Node'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Change Password Sub-Matrix ─────────────────────────────────────────── */}
      <section className="SettingsChangePassword space-y-8 bg-slate-50/50 rounded-[32px] p-8 border border-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-2xl shadow-lg border border-red-500/10">
             <FiLock className="text-red-400" size={18} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-slate-800 uppercase italic leading-none">Security Encryption Protocol</h2>
            <p className="text-[9px] font-bold tracking-[3px] text-slate-400 uppercase mt-1">Re-calibrate credentials for secure node access</p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AccountInputField
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Encryption Seed"
              icon={FiLock}
              registration={regPassword('currentPassword')}
              error={errorsPassword.currentPassword}
              rightIcon={
                <button type="button" onClick={() => setShowCurrentPassword((prev) => !prev)} className="text-slate-300 hover:text-pixs-mint transition-colors">
                  {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />

            <AccountInputField
              label="New Encryption"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Min 8 Characters"
              icon={FiLock}
              registration={regPassword('newPassword')}
              error={errorsPassword.newPassword}
              rightIcon={
                <button type="button" onClick={() => setShowNewPassword((prev) => !prev)} className="text-slate-300 hover:text-pixs-mint transition-colors">
                  {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />

            <AccountInputField
              label="Verify Encryption"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Sequence"
              icon={FiLock}
              registration={regPassword('confirmPassword')}
              error={errorsPassword.confirmPassword}
              rightIcon={
                <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="text-slate-300 hover:text-pixs-mint transition-colors">
                  {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100">
             <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl">
               <FiCheckCircle size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest leading-none">PHPMailer Ready for Security Alert</span>
             </div>
             
             <button
                type="submit"
                disabled={isSubmittingPassword}
                className="ChangePasswordButton AccountButton flex items-center justify-center gap-3 bg-red-500 text-white rounded-2xl px-10 py-5 text-[10px] font-black uppercase tracking-[4px] italic border border-red-400/20 shadow-2xl shadow-red-200 transition-all hover:bg-red-600 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingPassword ? (
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiLock size={14} />
                )}
                {isSubmittingPassword ? 'Encrypting...' : 'Change Password Node'}
              </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AccountInfoPage;
