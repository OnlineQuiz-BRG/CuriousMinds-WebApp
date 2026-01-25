
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  User as UserIcon,
  Calculator,
  Zap,
  Users,
  Database,
  Loader2,
  Settings,
  MessageCircle,
  Headset,
  ExternalLink,
  Info,
  Phone,
  BookOpen,
  FolderOpen,
  Compass,
  Sparkles
} from 'lucide-react';
import { User, UserRole, SystemConfig } from './types';
import { mockDb } from './services/mockDb';
import { supabase } from './services/supabase';
import { normalizeUser } from './services/mockDb';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MathDashboard from './pages/Math/MathDashboard';
import TeluguDashboard from './pages/Telugu/TeluguDashboard';
import PromptEngineering from './pages/PromptEngineering';
import AdminDashboard from './pages/Admin/AdminDashboard';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import FreeResources from './pages/FreeResources';

// --- Custom Icons ---
const AlphabetIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <text x="1" y="13" fill="currentColor" stroke="none" fontSize="13" fontWeight="900" fontFamily="serif">అ</text>
    <text x="12" y="21" fill="currentColor" stroke="none" fontSize="14" fontWeight="900" fontFamily="sans-serif">A</text>
    <path d="M4 18L20 6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
  </svg>
);

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// --- Contexts ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  config: SystemConfig;
  refreshConfig: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Main Layout ---
const Sidebar = ({ isOpen, onClose, config }: { isOpen: boolean; onClose: () => void, config: SystemConfig }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [config.logoUrl]);

  const navItems = [
    { id: 'profile', label: 'My Profile', icon: UserIcon, path: '/profile', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT] },
    { id: 'math', label: 'Maths', icon: Calculator, path: '/math', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN] },
    { id: 'telugu', label: 'Telugu', icon: AlphabetIcon, path: '/telugu', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN] },
    { id: 'prompt', label: 'Prompt Eng.', icon: Zap, path: '/prompt-eng', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN] },
    { id: 'resources', label: 'Free Resources', icon: FolderOpen, path: '/resources', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT] },
    { id: 'teacher', label: 'Teacher Panel', icon: Users, path: '/teacher', roles: [UserRole.TEACHER, UserRole.ADMIN] },
    { id: 'admin', label: 'Admin Panel', icon: Database, path: '/admin', roles: [UserRole.ADMIN] },
    { id: 'about', label: 'About Us', icon: Info, path: '/about', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.PARENT] },
  ];

  const filteredItems = navItems.filter(item => {
    if (!user) return false;
    const role = user.role || UserRole.STUDENT;
    if (!item.roles.includes(role)) return false;
    if (role !== UserRole.ADMIN && ['math', 'telugu', 'prompt'].includes(item.id)) {
      return Array.isArray(user.allowedModules) && user.allowedModules.includes(item.id);
    }
    return true;
  });

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#1e1b4b] to-[#312e81] text-white shadow-2xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:translate-x-0 flex flex-col`}>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          {config.logoUrl && !imgError ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl group-hover:bg-white/30 transition-all"></div>
              <img 
                src={config.logoUrl} 
                alt="Logo" 
                referrerPolicy="no-referrer"
                className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-[40px] bg-white p-3 shadow-2xl relative z-10"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center font-black text-4xl shrink-0 shadow-lg shadow-indigo-500/20 text-indigo-600">
              {config.customTitle ? config.customTitle[0] : 'C'}
            </div>
          )}
          <div className="space-y-1">
             <span className="font-black text-2xl tracking-tighter block uppercase">{config.customTitle}</span>
             <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Igniting Passion for Learning</p>
          </div>
        </div>
        
        <nav className="space-y-1.5">
          {filteredItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'bg-white/10 text-white shadow-lg backdrop-blur-md border border-white/5' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* WhatsApp & Community Section */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="px-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Connect</p>
          <div className="space-y-1.5">
            <a 
              href="https://chat.whatsapp.com/Cv5KT7ElYhV8i1lNFAvGti?mode=gi_t" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-between p-3 rounded-xl text-indigo-200 hover:bg-white/5 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-3">
                <WhatsAppIcon size={18} className="text-emerald-400" />
                <span className="font-semibold text-sm">Join Community</span>
              </div>
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a 
              href="https://wa.me/919966231927" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-between p-3 rounded-xl text-indigo-200 hover:bg-white/5 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-3">
                <Headset size={18} className="text-indigo-400" />
                <span className="font-semibold text-sm">Direct Support</span>
              </div>
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <Link 
              to="/contact"
              onClick={onClose}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${location.pathname === '/contact' ? 'bg-white/10 text-white' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-sky-400" />
                <span className="font-semibold text-sm">Contact Us</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 shrink-0">
        <button 
          onClick={logout}
          className="flex items-center gap-3 p-3 w-full text-left font-bold text-indigo-300 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

const Header = ({ onToggleSidebar, config }: { onToggleSidebar: () => void, config: SystemConfig }) => {
  const { user } = useAuth();
  return (
    <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <button onClick={onToggleSidebar} className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex flex-col">
          <span className="text-2xl md:text-3xl font-black text-indigo-700 uppercase tracking-tighter leading-none mb-1">Our Mission</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#FF8C00] uppercase tracking-widest">Bridging Gaps</span>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="text-sm font-black text-[#FF8C00] uppercase tracking-widest">Building Confidence</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="text-right mr-2 hidden sm:block">
          <p className="text-base font-black text-slate-900 leading-none mb-1.5 uppercase tracking-tight">{user?.fullName || 'User'}</p>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50">Transforming the way you learn</p>
        </div>
        <Link to="/profile" className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[26px] opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
          <div className="relative w-14 h-14 bg-white rounded-[24px] flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden group-hover:border-transparent transition-all group-hover:scale-105 shadow-lg">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-7 h-7" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};

const ProtectedLayout = ({ children, config }: { children?: React.ReactNode, config: SystemConfig }) => {
  const { user, loading, refreshUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      mockDb.syncFromSupabase(true).catch(err => console.error("Sync failed:", err));
      refreshUser();
    }
  }, [user?.id, location.pathname]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Identity...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} config={config} />
      <div className="md:ml-64 min-h-screen flex flex-col">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} config={config} />
        <main className="flex-1 p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

// --- Auth Provider ---
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SystemConfig>(mockDb.getConfig());

  const refreshConfig = () => {
    setConfig(mockDb.getConfig());
  };

  const refreshUser = useCallback(async () => {
    const saved = localStorage.getItem('cm_active_user');
    if (saved) {
      try {
        const localUser = normalizeUser(JSON.parse(saved));
        
        // AGGRESSIVE IDENTITY CHECK
        const { data: remoteUserRaw } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${localUser.id},username.eq.${localUser.username.toUpperCase()}`)
          .maybeSingle();
        
        if (remoteUserRaw) {
          const remoteUser = normalizeUser(remoteUserRaw);
          const mergedAllowedModules = (Array.isArray(remoteUser.allowedModules) && remoteUser.allowedModules.length > 0)
            ? remoteUser.allowedModules 
            : (Array.isArray(localUser.allowedModules) && localUser.allowedModules.length > 0 ? localUser.allowedModules : []);

          const updatedUser = { 
            ...localUser, 
            ...remoteUser, 
            allowedModules: mergedAllowedModules 
          };
          
          setUser(updatedUser);
          localStorage.setItem('cm_active_user', JSON.stringify(updatedUser));
        } else {
          setUser(localUser);
        }
      } catch (e) {
        try {
           const localUser = normalizeUser(JSON.parse(saved));
           setUser(localUser);
        } catch(err) {
           localStorage.removeItem('cm_active_user');
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (userData: User) => {
    const cleanUser = normalizeUser(userData);
    setUser(cleanUser);
    localStorage.setItem('cm_active_user', JSON.stringify(cleanUser));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cm_active_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, config, refreshConfig }}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AuthConsumer />
      </HashRouter>
    </AuthProvider>
  );
};

const AuthConsumer = () => {
  const { config, user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login config={config} /> : <Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedLayout config={config}><Dashboard config={config} /></ProtectedLayout>} />
      <Route path="/math/*" element={<ProtectedLayout config={config}><MathDashboard config={config} /></ProtectedLayout>} />
      <Route path="/telugu/*" element={<ProtectedLayout config={config}><TeluguDashboard config={config} /></ProtectedLayout>} />
      <Route path="/prompt-eng" element={<ProtectedLayout config={config}><PromptEngineering /></ProtectedLayout>} />
      <Route path="/teacher/*" element={<ProtectedLayout config={config}><TeacherDashboard /></ProtectedLayout> } />
      <Route path="/admin/*" element={<ProtectedLayout config={config}><AdminDashboard config={config} /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout config={config}><Profile /></ProtectedLayout>} />
      <Route path="/about" element={<ProtectedLayout config={config}><About /></ProtectedLayout>} />
      <Route path="/contact" element={<ProtectedLayout config={config}><Contact /></ProtectedLayout>} />
      <Route path="/resources" element={<ProtectedLayout config={config}><FreeResources /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
