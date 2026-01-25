
import React, { useState, useRef } from 'react';
import { useAuth } from '../App';
import { mockDb } from '../services/mockDb';
import { 
  User as UserIcon, Mail, Phone, GraduationCap, School, 
  Camera, Save, CheckCircle2, Shield, Hash, BookOpen, 
  Loader2, AlertCircle, RefreshCw, X, Image as ImageIcon, Upload, Trash2
} from 'lucide-react';
import { UserRole } from '../types';

export default function Profile() {
  const { user, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    grade: user?.grade || '',
    curriculum: user?.curriculum || '',
    avatarUrl: user?.avatarUrl || '',
    institute: user?.institute || '',
    school: user?.school || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      setError('Image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    
    try {
      const updatedUser = { 
        ...user, 
        ...formData 
      };
      await mockDb.saveUser(updatedUser);
      login(updatedUser); // Update local context
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err) {
      setError('Failed to update profile. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Notifications */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-[32px] shadow-2xl shadow-indigo-200">
            <CheckCircle2 size={24} />
            <p className="font-black text-sm uppercase tracking-widest">Profile Identity Updated</p>
            <button onClick={() => setShowToast(false)} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 px-8 py-5 bg-rose-600 text-white rounded-[32px] shadow-2xl shadow-rose-200">
            <AlertCircle size={24} />
            <p className="font-black text-sm uppercase tracking-widest">{error}</p>
            <button onClick={() => setError('')} className="ml-4 opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" /> Account Identity
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Your Profile</h2>
          <p className="text-slate-500 font-bold text-lg">Manage your personal information and academic credentials.</p>
        </div>
        
        <div className="bg-white px-8 py-4 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <Hash className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access ID</p>
              <p className="text-xl font-black text-slate-800 leading-none">{user.username}</p>
           </div>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[56px] border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
              
              <div className="relative mb-8 cursor-pointer" onClick={triggerUpload}>
                 <div className="w-40 h-40 rounded-[48px] bg-slate-50 border-4 border-white shadow-2xl flex items-center justify-center text-slate-200 overflow-hidden ring-1 ring-slate-100 group-hover:ring-indigo-200 transition-all duration-500">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={80} strokeWidth={1} />
                    )}
                 </div>
                 <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white group-hover:scale-110 transition-transform">
                    <Camera size={20} />
                 </div>
              </div>

              <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none mb-2 truncate w-full">{formData.fullName || 'Member Name'}</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-8">{user.role}</p>

              <div className="w-full space-y-4 pt-8 border-t border-slate-50">
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   className="hidden" 
                   accept="image/*"
                 />
                 <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                       type="button"
                       onClick={triggerUpload}
                       className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                    >
                       <Upload size={14} /> Upload
                    </button>
                    <button 
                       type="button"
                       onClick={removePhoto}
                       className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                    >
                       <Trash2 size={14} /> Remove
                    </button>
                 </div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">JPG, PNG or WEBP (Max 2MB)</p>
              </div>
           </div>

           <div className="bg-indigo-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Shield size={14} /> Security Note
              </h4>
              <p className="text-indigo-100 font-bold leading-relaxed">
                 Your Access ID and Role are managed by the administrator. To change your login credentials or module permissions, please contact your educational coordinator.
              </p>
           </div>
        </div>

        {/* Right Column: Detailed Form */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white p-10 md:p-14 rounded-[56px] border border-slate-200 shadow-sm space-y-12">
              
              {/* Personal Information */}
              <section className="space-y-8">
                 <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                       <UserIcon size={20} />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity Details</h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                       <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                             type="text"
                             required
                             value={formData.fullName}
                             onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                             type="email"
                             value={formData.email}
                             onChange={(e) => setFormData({...formData, email: e.target.value})}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                             placeholder="email@example.com"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                             type="tel"
                             value={formData.phone}
                             onChange={(e) => setFormData({...formData, phone: e.target.value})}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                             placeholder="+91..."
                          />
                       </div>
                    </div>
                 </div>
              </section>

              {/* Academic/Professional Info */}
              <section className="space-y-8">
                 <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                       <BookOpen size={20} />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Academic Context</h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{user.role === UserRole.TEACHER ? 'Primary Institute' : 'Assigned Institute'}</label>
                       <div className="relative">
                          <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                             type="text"
                             value={formData.institute}
                             onChange={(e) => setFormData({...formData, institute: e.target.value})}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                             placeholder="Institute Name"
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Branch/School</label>
                       <div className="relative">
                          <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                             type="text"
                             value={formData.school}
                             onChange={(e) => setFormData({...formData, school: e.target.value})}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                             placeholder="School Name"
                          />
                       </div>
                    </div>
                    
                    {user.role === UserRole.STUDENT && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade / Class</label>
                          <div className="relative">
                              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                              <input 
                                type="text"
                                value={formData.grade}
                                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                placeholder="e.g. Grade 10"
                              />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curriculum Track</label>
                          <div className="relative">
                              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                              <input 
                                type="text"
                                value={formData.curriculum}
                                onChange={(e) => setFormData({...formData, curriculum: e.target.value})}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                placeholder="e.g. CBSE / IGCSE"
                              />
                          </div>
                        </div>
                      </>
                    )}
                 </div>
              </section>

              <div className="pt-10 flex flex-col md:flex-row items-center gap-6">
                 <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full md:w-auto px-16 py-6 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-50"
                 >
                    {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                    {isSaving ? 'Syncing Changes...' : 'Seal Profile Identity'}
                 </button>
                 
                 <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                    <RefreshCw size={12} className="text-indigo-400" /> All updates are cross-referenced with global student records.
                 </p>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
}
