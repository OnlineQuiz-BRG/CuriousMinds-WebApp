
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { SystemConfig, UserRole, User } from '../types';
import { useAuth } from '../App';
import { mockDb, normalizeUser } from '../services/mockDb';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle, CheckCircle, Hash, Info } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'forgot-password';

export default function Login({ config }: { config: SystemConfig }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imgError, setImgError] = useState(false);
  
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const isEmail = (val: string) => val.includes('@');
  
  const formatIdentifier = (val: string) => {
    const trimmed = val.trim();
    if (role === UserRole.STUDENT) {
      return `${trimmed.toLowerCase()}@students.curiousminds.local`;
    }
    return trimmed;
  };

  const handleLoginSuccess = async (userData: User) => {
    // Only attempt to save to cloud if properly configured
    if (isSupabaseConfigured) {
      try {
        await mockDb.saveUser(userData);
      } catch (e) {
        console.warn("Could not sync user to cloud, saving locally only.");
      }
    } else {
      // Local storage logic for Offline/Local mode
      const users = mockDb.getUsers();
      const existingIdx = users.findIndex(u => u.username === userData.username);
      if (existingIdx >= 0) users[existingIdx] = userData;
      else users.push(userData);
      localStorage.setItem('cm_users', JSON.stringify(users));
    }
    login(userData);
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const email = formatIdentifier(identifier);
    const lookupCode = identifier.trim().toUpperCase();

    try {
      if (view === 'login') {
        // --- 1. EMERGENCY FALLBACK (HIGHEST PRIORITY) ---
        // This allows access even if cloud is broken or not yet configured
        if (lookupCode === 'ADMIN' && password === 'admin@123') {
          handleLoginSuccess({
            id: 'dev-admin',
            username: 'ADMIN',
            fullName: 'Local Administrator',
            role: UserRole.ADMIN,
            active: true,
            allowedModules: ['math', 'telugu', 'prompt']
          });
          return;
        }

        // --- 2. CLOUD LOGIN (ONLY IF CONFIGURED) ---
        if (isSupabaseConfigured) {
          try {
            if (isEmail(email)) {
              const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (!authError && authData.user) {
                const { data: profile } = await supabase.from('users').select('*').eq('username', lookupCode).maybeSingle();
                const userData = profile ? normalizeUser(profile) : {
                  id: authData.user.id,
                  username: lookupCode,
                  fullName: authData.user.user_metadata?.full_name || 'Member',
                  role: authData.user.user_metadata?.role || UserRole.STUDENT,
                  email: authData.user.email,
                  active: true,
                  allowedModules: ['math', 'telugu']
                };
                handleLoginSuccess(userData as User);
                return;
              }
            }

            // Direct DB Auth fallback
            const { data: dbUserRaw, error: dbError } = await supabase
              .from('users')
              .select('*')
              .eq('username', lookupCode)
              .maybeSingle();

            if (!dbError && dbUserRaw && dbUserRaw.password === password) {
              handleLoginSuccess(normalizeUser(dbUserRaw));
              return;
            }
          } catch (netErr) {
            // Silently swallow network errors and fall back to local
            console.warn("Supabase network error, falling back to local storage search.");
          }
        }

        // --- 3. LOCAL STORAGE LOOKUP ---
        const localUsers = mockDb.getUsers();
        const foundLocal = localUsers.find(u => 
          (u.username === lookupCode || u.email === identifier) && u.password === password
        );

        if (foundLocal) {
          handleLoginSuccess(foundLocal);
        } else {
          throw new Error(isSupabaseConfigured 
            ? "Invalid credentials. Please verify your password." 
            : "User not found. For first-time setup, use ADMIN / admin@123.");
        }
      } else if (view === 'signup') {
        if (!fullName.trim()) throw new Error('Full Name is required.');
        
        if (isSupabaseConfigured) {
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, role: role, username: lookupCode } },
          });
          if (signupError) throw signupError;
          if (signupData.user) {
            const newUser: User = {
              id: signupData.user.id,
              username: lookupCode,
              fullName: fullName,
              role: role,
              email: signupData.user.email,
              password: password,
              active: true,
              allowedModules: ['math', 'telugu']
            };
            handleLoginSuccess(newUser);
            setSuccess('Profile Created!');
          }
        } else {
          // Local-only signup for testing/offline use
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            username: lookupCode,
            fullName: fullName,
            role: role,
            email: isEmail(identifier) ? identifier : email,
            password: password,
            active: true,
            allowedModules: ['math', 'telugu']
          };
          handleLoginSuccess(newUser);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Reset feature requires a cloud connection.");
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (!isEmail(identifier)) throw new Error('Valid email required for recovery.');
      const { error } = await supabase.auth.resetPasswordForEmail(identifier);
      if (error) throw error;
      setSuccess('Recovery link dispatched! Check your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="max-w-[520px] w-full bg-white rounded-[60px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 p-10 md:p-14 text-center">
        {!isSupabaseConfigured && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 text-left">
            <div className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-wider">
              Local Mode: Cloud Sync is disabled.<br/>
              Use <strong>ADMIN / admin@123</strong> to begin.
            </div>
          </div>
        )}

        <div className="inline-flex items-center justify-center w-44 h-44 bg-white rounded-[56px] shadow-2xl shadow-indigo-100 mb-10 border border-slate-100 p-4">
          {config.logoUrl && !imgError ? (
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#5850EC] text-white flex items-center justify-center rounded-[40px] text-7xl font-black">
              {config.customTitle ? config.customTitle[0] : 'C'}
            </div>
          )}
        </div>
        
        <h2 className="text-[40px] font-black text-[#1E293B] mb-3 tracking-tight leading-none">
          {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Profile' : 'Recovery'}
        </h2>
        <p className="text-slate-500 mb-12 text-lg font-medium">{config.welcomeMessage}</p>

        <form onSubmit={view === 'forgot-password' ? handleResetPassword : handleSubmit} className="space-y-6 text-left">
          {view !== 'forgot-password' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-[24px] border border-slate-100">
                <button
                  type="button"
                  onClick={() => { setRole(UserRole.STUDENT); setIdentifier(''); }}
                  className={`py-3.5 rounded-[18px] font-black text-xs uppercase transition-all ${role === UserRole.STUDENT ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                >Student</button>
                <button
                  type="button"
                  onClick={() => { setRole(UserRole.ADMIN); setIdentifier(''); }}
                  className={`py-3.5 rounded-[18px] font-black text-xs uppercase transition-all ${role !== UserRole.STUDENT ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                >Admin/Staff</button>
              </div>
            </div>
          )}

          {view === 'signup' && (
            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-[#F8FAFC] border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
                  placeholder="e.g. Srivardhan"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {role === UserRole.STUDENT ? 'Student Access ID' : 'Email or Access ID'}
            </label>
            <div className="relative">
              {role === UserRole.STUDENT ? <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5" /> : <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />}
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(role === UserRole.STUDENT ? e.target.value.toUpperCase() : e.target.value)}
                required
                className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-[#F8FAFC] border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
                placeholder={role === UserRole.STUDENT ? "e.g. CMD001" : "ADMIN or email@domain.com"}
              />
            </div>
          </div>

          {view !== 'forgot-password' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                {view === 'login' && <button type="button" onClick={() => setView('forgot-password')} className="text-[10px] font-black text-indigo-500 uppercase">Forgot?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-[#F8FAFC] border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && <div className="p-5 rounded-[24px] text-sm font-bold border bg-rose-50 text-rose-600 border-rose-100 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}
          {success && <div className="p-5 rounded-[24px] text-sm font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 flex gap-3"><CheckCircle className="w-5 h-5 shrink-0" /> {success}</div>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-6 text-white font-black text-xl rounded-[30px] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 ${role === UserRole.STUDENT ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-900 shadow-slate-900/20'}`}
          >
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <>{view === 'login' ? 'Sign In' : view === 'signup' ? 'Create' : 'Submit'} <ArrowRight className="w-6 h-6" /></>}
          </button>
        </form>

        <div className="mt-14 pt-10 border-t border-slate-100">
          <p className="text-base font-medium text-slate-500">
            {view === 'login' ? "New member?" : "Already a member?"}
            <button onClick={() => setView(view === 'signup' ? 'login' : 'signup')} className="ml-2 text-[#5850EC] font-black">
              {view === 'login' ? 'Join Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
