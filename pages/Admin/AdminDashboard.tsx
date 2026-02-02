
import React, { useState, useEffect, useMemo } from 'react';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { User, UserRole, SystemConfig, Question } from '../../types';
import { supabase } from '../../services/supabase';
import { db } from '../../services/db';
import { 
  Users as UsersIcon, Settings, Database, Calculator, RefreshCcw, Loader2, Code, Activity, Trash2, X, Sparkles, Wand2, Languages, CheckCircle, Search, Save, Image as ImageIcon, Palette, Type, AlertTriangle,
  Sprout, Lightbulb, Rocket, ShieldCheck, Zap, Trophy, FileUp, FileSpreadsheet, UserPlus, Download, CheckSquare, AlertCircle, Hash, Link as LinkIcon, Play, BookOpen, Layers, Edit, Shield, Mail, Check, ToggleLeft, ToggleRight,
  Lock, Binary, UserMinus, AlertOctagon, RefreshCw, School, GraduationCap, Eye, EyeOff
} from 'lucide-react';
import { MATH_LEVELS, TELUGU_STAGES, DEFAULT_BRANDING } from '../../constants';

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

const INITIAL_MATH_PRESETS: Record<string, string> = {
  "novice": "1, 10, 100, 5, 50",
  "awareness": "1, 10, 100, 11, 101, 5, 50, 105, 15, 55",
  "beginner": "1, 10, 100, 101, 11, 5, 50, 105, 15, 55, 95, 45, 99, 9, 49",
  "competent": "1, 10, 100, 101, 11, 9, 99, 2, 20, 12, 102, 5, 50, 15, 51, 49, 55, 45, 105, 95",
  "development": "1, 10, 100, 101, 11, 9, 99, 2, 12, 20, 19, 21, 18, 22, 102, 98, 5, 50, 51, 49, 52, 48, 15, 25, 55, 45, 105, 95, 125, 75",
  "expert": "1, 10, 100, 101, 11, 5, 50, 105, 15, 99, 9, 49, 95, 55, 45, 51, 2, 20, 12, 102, 98, 22, 25, 52, 48, 18, 125, 75, 19, 103, 53, 13, 23, 97, 47, 7, 6, 4, 17, 8"
};

export default function AdminDashboard({ config: initialConfig }: { config: SystemConfig }) {
  const { refreshConfig } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'telugu' | 'math' | 'config' | 'db_setup'>('users');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userPassword, setUserPassword] = useState('');
  
  const [generatingLevel, setGeneratingLevel] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [editableConfig, setEditableConfig] = useState<SystemConfig>(initialConfig);
  const [levelBaseNumbers, setLevelBaseNumbers] = useState<Record<string, string>>(INITIAL_MATH_PRESETS);
  const [genCounts, setGenCounts] = useState<Record<string, number>>({
    novice: 10, awareness: 10, beginner: 10, competent: 10, development: 10, expert: 10
  });
  const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error', message: string} | null>(null);
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({});
  const [masterCounts, setMasterCounts] = useState<Record<string, number>>({});

  const fetchUsers = async () => {
    setIsSyncing(true);
    try {
      const { data: dbUsers, error } = await supabase.from('users').select('*').order('fullName');
      if (error) throw error;
      
      const normalizedDbUsers = (dbUsers || []).map(u => ({
        ...u,
        username: u.username?.toUpperCase() || '',
        allowedModules: u.allowed_modules || u.allowedModules || []
      })) as User[];

      const localUsers = mockDb.getUsers();
      const mergedMap = new Map();
      
      normalizedDbUsers.forEach(u => mergedMap.set(u.id, u));
      localUsers.forEach(u => {
        if (!mergedMap.has(u.id)) mergedMap.set(u.id, u);
      });
      
      const finalUsers = Array.from(mergedMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
      setAllUsers(finalUsers);
    } catch (err) {
      console.error("Cloud fetch failed, using local only:", err);
      setAllUsers(mockDb.getUsers());
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshData = async (forceSync = false) => {
    setIsSyncing(true);
    if (forceSync) {
      await mockDb.syncFromSupabase(true);
    }
    
    if (activeTab === 'users') {
      await fetchUsers();
    }
    
    const counts: Record<string, number> = {};
    const mCounts: Record<string, number> = {};
    
    const results = await Promise.all(
      [...MATH_LEVELS, ...TELUGU_STAGES].map(async (lvl) => {
        const qs = await mockDb.getQuestions(lvl.id);
        const uniqueSets = new Set(qs.map(q => q.testId)).size;
        return { id: lvl.id.toLowerCase(), count: uniqueSets };
      })
    );

    const masterResults = await Promise.all(
      TELUGU_STAGES.map(async (stage) => {
        const words = await db.getMasterWordsByStage(stage.id);
        return { id: stage.id.toLowerCase(), count: words.length };
      })
    );
    
    results.forEach(res => { counts[res.id] = res.count; });
    masterResults.forEach(res => { mCounts[res.id] = res.count; });
    
    setLevelCounts(counts);
    setMasterCounts(mCounts);
    setIsSyncing(false);
  };

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUpdateConfig = () => {
    setIsSyncing(true);
    const success = mockDb.updateConfig(editableConfig);
    if (success) {
      refreshConfig();
      showToast('success', 'System branding updated successfully.');
    } else {
      showToast('error', 'Failed to update configuration.');
    }
    setIsSyncing(false);
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all branding and images to system defaults?")) {
      setEditableConfig(DEFAULT_BRANDING);
      mockDb.updateConfig(DEFAULT_BRANDING);
      refreshConfig();
      showToast('success', 'Configuration reset to factory defaults.');
    }
  };

  const handleDeleteUser = async (userToDelete?: User) => {
    const target = userToDelete || editingUser;
    if (!target || !target.id) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${target.fullName}? This cannot be undone.`)) return;

    setIsSyncing(true);
    try {
      const { error: dbError } = await supabase.from('users').delete().eq('id', target.id);
      if (dbError) throw dbError;

      const localUsers = mockDb.getUsers().filter(u => u.id !== target.id);
      localStorage.setItem('cm_users', JSON.stringify(localUsers));
      
      showToast('success', 'User record deleted successfully.');
      if (!userToDelete) setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast('error', `Delete failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const finalPassword = userPassword || editingUser.password;
    if (!finalPassword) {
      showToast('error', 'A password is required for this profile.');
      return;
    }

    const cleanUsername = editingUser.username.trim().toUpperCase();
    if (!cleanUsername) {
      showToast('error', 'An Access ID is required.');
      return;
    }

    const isDuplicate = allUsers.some(u => 
      u.username.trim().toUpperCase() === cleanUsername && 
      u.id !== editingUser.id
    );

    if (isDuplicate) {
      showToast('error', `The Access ID "${cleanUsername}" is already assigned to another user profile.`);
      return;
    }

    setIsSyncing(true);
    try {
      let finalId = editingUser.id;
      if (isAddingUser && !finalId) {
        finalId = self.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
      }
      
      const userToSave: User = { 
        ...editingUser,
        id: finalId,
        password: finalPassword,
        username: cleanUsername,
        allowedModules: editingUser.allowedModules || []
      };

      await mockDb.saveUser(userToSave);
      await fetchUsers();

      showToast('success', `User ${userToSave.fullName} saved successfully.`);
      setEditingUser(null);
      setIsAddingUser(false);
      setUserPassword('');
    } catch (err) {
      showToast('error', 'Failed to save user profile.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickToggleModule = async (user: User, moduleId: string) => {
    const current = user.allowedModules || [];
    const updated = current.includes(moduleId) 
      ? current.filter(m => m !== moduleId)
      : [...current, moduleId];
    
    const updatedUser = { ...user, allowedModules: updated };
    
    try {
      await mockDb.saveUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      showToast('success', `Updated ${user.fullName}'s ${moduleId} access.`);
    } catch (err) {
      showToast('error', 'Failed to update module mapping.');
    }
  };

  const startAddUser = () => {
    setEditingUser({
      id: '',
      username: '',
      fullName: '',
      role: UserRole.STUDENT,
      active: true,
      allowedModules: ['math', 'telugu']
    });
    setUserPassword('');
    setIsAddingUser(true);
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [allUsers, userSearchTerm]);

  const duplicateUsernames = useMemo(() => {
    const counts: Record<string, number> = {};
    allUsers.forEach(u => {
      const uname = u.username.toUpperCase();
      counts[uname] = (counts[uname] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(k => counts[k] > 1));
  }, [allUsers]);

  const handleGenerateMathBank = async (levelId: string) => {
    const levelKey = levelId.toLowerCase();
    const baseNumbersString = levelBaseNumbers[levelKey];
    const numTests = genCounts[levelKey] || 10;
    if (!baseNumbersString || !baseNumbersString.trim()) { showToast('error', 'Base numbers required.'); return; }
    setGeneratingLevel(levelId);
    setIsSyncing(true);
    try {
      await mockDb.clearQuestionsByLevel(levelKey);
      const baseNumbers = baseNumbersString.split(',').map(n => n.trim()).filter(n => n !== "").map(Number);
      const isAdvanced = (levelKey === "competent" || levelKey === "development" || levelKey === "expert");
      
      const getUniqueVars = () => {
        let v: number[] = [];
        while (v.length < 3) { let r = Math.floor(Math.random() * 8) + 2; if (v.indexOf(r) === -1) v.push(r); }
        return v;
      };

      let generatedQuestions: Question[] = [];
      for (let t = 0; t < numTests; t++) {
        let testIdStr = (t + 1).toString();
        baseNumbers.forEach((num, index) => {
          const [vA, vB, vC] = getUniqueVars();
          let qNum = index + 1;
          if (isAdvanced) {
            const subs = ["a", "b", "c"];
            const vals = [num * vA, num * vB, num * vC];
            const texts = [`${num} added ${vA} times`, `${num} + ${num} + ... (${vB} times)`, `${num} X ${vC}`];
            subs.forEach((sub, sIdx) => {
              generatedQuestions.push({
                id: `${levelKey}-t${testIdStr}-q${qNum}-${sub}`,
                level: levelKey,
                testId: testIdStr,
                questionNum: qNum,
                subQuestion: sub,
                text: texts[sIdx],
                answer: vals[sIdx].toString()
              });
            });
          } else {
            let seqStart = (index * 3) + 1;
            const texts = [`${num} added ${vA} times`, `${num} + ${num} + ... (${vB} times)`, `${num} X ${vC}`];
            const vals = [num * vA, num * vB, num * vC];
            [0, 1, 2].forEach(i => {
              generatedQuestions.push({
                id: `${levelKey}-t${testIdStr}-q${seqStart + i}-main`,
                level: levelKey,
                testId: testIdStr,
                questionNum: seqStart + i,
                subQuestion: '',
                text: texts[i],
                answer: vals[i].toString()
              });
            });
          }
        });
      }
      await mockDb.saveQuestions(generatedQuestions);
      refreshData();
      showToast('success', `Generated ${numTests} sets for ${levelId}.`);
    } catch (err) { 
      showToast('error', 'Generation failed.'); 
      console.error(err);
    }
    finally { setGeneratingLevel(null); setIsSyncing(false); }
  };

  const handleGenerateTeluguBank = async (stageId: string) => {
    if (editableConfig.googleSheetsUrl) {
      setGeneratingLevel(stageId);
      setIsSyncing(true);
      try {
        await mockDb.clearQuestionsByLevel(stageId);
        const count = await mockDb.syncTeluguFromSheets(stageId, editableConfig.googleSheetsUrl);
        refreshData();
        showToast('success', `Synced ${count} words and built 50 sets for ${stageId}.`);
      } catch (err: any) {
        showToast('error', `Sheets Sync Failed: ${err.message}`);
      } finally {
        setGeneratingLevel(null);
        setIsSyncing(false);
      }
    } else {
      showToast('error', 'Please configure Google Sheets URL first.');
    }
  };

  const handleMasterSyncTelugu = async () => {
    if (!editableConfig.googleSheetsUrl) {
      showToast('error', 'Spreadsheet URL required for Master Sync.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus('Connecting to Google Registry...');
    
    try {
      const totalWords = await mockDb.syncMasterRegistry(editableConfig.googleSheetsUrl, setSyncStatus);
      setSyncStatus(`Registry Updated. Building 900 Assessment Sets...`);

      for (const stage of TELUGU_STAGES) {
        setSyncStatus(`Building Stage Sets: ${stage.name}...`);
        setGeneratingLevel(stage.id);
        await mockDb.clearQuestionsByLevel(stage.id);
        await mockDb.generateSetsFromRegistry(stage.id);
      }
      
      refreshData();
      showToast('success', `Global Registry Sync Complete: All 3,600 words and 900 sets updated.`);
    } catch (err: any) {
      showToast('error', `Master Sync Interrupted: ${err.message}`);
    } finally {
      setSyncStatus('');
      setGeneratingLevel(null);
      setIsSyncing(false);
    }
  };

  const toggleModuleAccess = (moduleId: string) => {
    if (!editingUser) return;
    const current = editingUser.allowedModules || [];
    const updated = current.includes(moduleId) 
      ? current.filter(m => m !== moduleId)
      : [...current, moduleId];
    setEditingUser({ ...editingUser, allowedModules: updated });
  };

  const toggleTeluguStageAccess = (stageId: string) => {
    const current = editableConfig.enabledTeluguStages || [];
    const updated = current.includes(stageId)
      ? current.filter(id => id !== stageId)
      : [...current, stageId];
    
    setEditableConfig({ ...editableConfig, enabledTeluguStages: updated });
  };

  const toggleTeluguCategoryAccess = (category: string) => {
    const categoryStages = TELUGU_STAGES.filter(s => s.category === category).map(s => s.id);
    const current = editableConfig.enabledTeluguStages || [];
    const allEnabled = categoryStages.every(id => current.includes(id));
    
    const updated = allEnabled
      ? current.filter(id => !categoryStages.includes(id))
      : Array.from(new Set([...current, ...categoryStages]));
    
    setEditableConfig({ ...editableConfig, enabledTeluguStages: updated });
  };

  const teachers = useMemo(() => allUsers.filter(u => u.role === UserRole.TEACHER), [allUsers]);

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto">
      {notification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 w-full max-w-md px-4">
          <div className={`flex items-center gap-4 p-5 rounded-[24px] shadow-2xl border ${notification.type === 'success' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold flex-1 text-sm">{notification.message}</p>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[75vh]">
        <div className="flex border-b border-slate-100 p-4 gap-2 overflow-x-auto bg-slate-50/50 sticky top-0 z-10">
          {[
            { id: 'users', label: 'Users & Roles', icon: UsersIcon },
            { id: 'telugu', label: 'Telugu Management', icon: AlphabetIcon },
            { id: 'math', label: 'Math Bank', icon: Calculator },
            { id: 'config', label: 'Identity', icon: Settings },
            { id: 'db_setup', label: 'Maintenance', icon: Code }
          ].map(tab => (
            <button
              key={tab.id}
              disabled={isSyncing}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-[22px] font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white disabled:opacity-50'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-10 flex-1">
          {activeTab === 'users' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">User Registry</h3>
                  <p className="text-slate-500 font-bold">Quickly map modules or edit profiles.</p>
                  {duplicateUsernames.size > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 animate-pulse">
                      <AlertOctagon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Duplicate Access IDs detected.</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Search directory..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl w-full md:w-80 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                  <button 
                    onClick={startAddUser}
                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl transition-all uppercase text-xs tracking-widest"
                  >
                    <UserPlus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-5">Full Name</th>
                      <th className="px-8 py-5">Access ID</th>
                      <th className="px-8 py-5">Role</th>
                      <th className="px-8 py-5">Module Mapping</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(user => {
                      const isAdmin = user.role === UserRole.ADMIN;
                      const isDuplicate = duplicateUsernames.has(user.username.toUpperCase());
                      return (
                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors group ${isDuplicate ? 'bg-rose-50/30' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 leading-none mb-1">{user.fullName}</span>
                                {user.institute && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.institute}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2">
                               <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${isDuplicate ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-slate-500'}`}>{user.username}</span>
                               {isDuplicate && <span title="Duplicate ID"><AlertTriangle className="w-3.5 h-3.5 text-rose-500" /></span>}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              isAdmin ? 'bg-rose-50 border-rose-100 text-rose-600' :
                              user.role === UserRole.TEACHER ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                              'bg-slate-50 border-slate-100 text-slate-600'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {isAdmin ? (
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Access</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                {[
                                  { id: 'math', icon: Calculator, label: 'Math' },
                                  { id: 'telugu', icon: AlphabetIcon, label: 'Telugu' },
                                  { id: 'prompt', icon: Zap, label: 'AI Prompt' }
                                ].map(mod => {
                                  const isActive = user.allowedModules?.includes(mod.id);
                                  return (
                                    <button
                                      key={mod.id}
                                      title={`Toggle ${mod.label}`}
                                      onClick={() => handleQuickToggleModule(user, mod.id)}
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 border border-slate-200'}`}
                                    >
                                      <mod.icon size={18} />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsAddingUser(false);
                                  setUserPassword(user.password || '');
                                }}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5" /> PROFILE
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user)}
                                className="p-2 bg-white border border-slate-200 text-rose-400 hover:text-rose-600 hover:border-rose-300 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'telugu' && (
            <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-indigo-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 space-y-4 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-4xl font-black tracking-tight uppercase leading-none">Telugu Master Management</h3>
                      <p className="text-indigo-200 font-bold text-lg max-w-2xl mt-2">
                        Unified synchronization and student access control for all 3,600 Master Words. 
                      </p>
                    </div>
                    <button 
                      onClick={handleUpdateConfig}
                      className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-emerald-600 transition-all"
                    >
                      <Save size={16} /> Save Visibility Settings
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-4 pt-4">
                    <div className="flex gap-4">
                      <button 
                        onClick={handleMasterSyncTelugu} 
                        disabled={isSyncing} 
                        className="flex items-center gap-3 px-10 py-5 bg-white text-indigo-900 font-black rounded-3xl hover:bg-indigo-50 transition-all shadow-xl disabled:opacity-50"
                      >
                        {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCcw className="w-6 h-6" />}
                        {isSyncing ? 'Synchronizing Bank...' : 'Global Master Sync'}
                      </button>
                      <button 
                        onClick={() => refreshData()} 
                        disabled={isSyncing}
                        className="px-6 py-4 bg-white/10 rounded-2xl flex items-center gap-3 border border-white/20 hover:bg-white/20 transition-all"
                      >
                        <RefreshCcw className={`w-4 h-4 text-indigo-300 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Refresh UI</span>
                      </button>
                    </div>
                    {isSyncing && syncStatus && (
                      <p className="text-indigo-300 font-bold animate-pulse text-sm">Status: {syncStatus}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Access Control Checkboxes */}
              <div className="bg-slate-50 p-10 rounded-[48px] border border-slate-200 space-y-10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                    <Eye className="w-6 h-6 text-indigo-600" /> Student Access Configuration
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected: {editableConfig.enabledTeluguStages?.length || 0} / 18 Stages</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {['Foundation', 'Progressive', 'Advanced', 'Achiever', 'Expert', 'Mastery'].map(cat => {
                    const stagesInCat = TELUGU_STAGES.filter(s => s.category === cat);
                    const allCatEnabled = stagesInCat.every(s => editableConfig.enabledTeluguStages?.includes(s.id));
                    
                    return (
                      <div key={cat} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                          <span className="font-black text-slate-800 uppercase text-xs tracking-widest">{cat}</span>
                          <button 
                            onClick={() => toggleTeluguCategoryAccess(cat)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${allCatEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                          >
                            {allCatEnabled ? 'Disable All' : 'Enable All'}
                          </button>
                        </div>
                        <div className="space-y-4">
                          {stagesInCat.map(stage => {
                            const isEnabled = editableConfig.enabledTeluguStages?.includes(stage.id);
                            return (
                              <label key={stage.id} className="flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                                    {stage.id.split('-')[1]}
                                  </div>
                                  <span className={`font-bold transition-colors ${isEnabled ? 'text-slate-800' : 'text-slate-300'}`}>{stage.name}</span>
                                </div>
                                <input 
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => toggleTeluguStageAccess(stage.id)}
                                  className="w-5 h-5 rounded-lg border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {TELUGU_STAGES.map(stage => {
                  const setLimit = levelCounts[stage.id.toLowerCase()] || 0;
                  const wordCount = masterCounts[stage.id.toLowerCase()] || 0;
                  const isLoaded = setLimit > 0;
                  const isWordsLoaded = wordCount > 0;
                  
                  return (
                    <div key={stage.id} className="bg-white border border-slate-200 rounded-[40px] p-8 space-y-6 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                      {generatingLevel === stage.id && <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /><p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Processing...</p></div>}
                      
                      <div className="flex justify-between items-start">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${isLoaded ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          {stage.id.split('-')[1]}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isWordsLoaded ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                            Registry: {wordCount}/200
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isLoaded ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                            Sets: {setLimit}/50
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-xl leading-none">{stage.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage.category}</p>
                      </div>

                      <div className="space-y-3 pt-4">
                        <button 
                          onClick={() => handleGenerateTeluguBank(stage.id)} 
                          disabled={isSyncing} 
                          className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50"
                        >
                          <RefreshCcw className="w-4 h-4" /> Sync Stage
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'math' && (
             <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Mental Math Bank</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MATH_LEVELS.map(level => {
                  const qCount = levelCounts[level.id.toLowerCase()] || 0;
                  const levelKey = level.id.toLowerCase();
                  return (
                    <div key={level.id} className="bg-white border border-slate-200 rounded-[40px] p-8 space-y-6 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                      {generatingLevel === level.id && <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex flex-col items-center justify-center gap-4"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /><p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Generating...</p></div>}
                      
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">M</div>
                        <span className="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{qCount} Sets</span>
                      </div>
                      
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-xl">{level.name}</h4>
                      
                      <div className="space-y-4 pt-2 flex-1">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                             <Binary className="w-3 h-3" /> Base Numbers (CSV)
                           </label>
                           <textarea 
                             rows={3}
                             value={levelBaseNumbers[levelKey] || ''}
                             onChange={(e) => setLevelBaseNumbers(prev => ({...prev, [levelKey]: e.target.value}))}
                             placeholder="e.g. 10, 20, 30"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                           />
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                             <RefreshCcw className="w-3 h-3" /> Set Generation Count
                           </label>
                           <input 
                             type="number"
                             min="1"
                             max="50"
                             value={genCounts[levelKey] || 10}
                             onChange={(e) => setGenCounts(prev => ({...prev, [levelKey]: parseInt(e.target.value) || 1}))}
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                           />
                        </div>
                      </div>

                      <button 
                        onClick={() => handleGenerateMathBank(level.id)} 
                        disabled={isSyncing} 
                        className="w-full py-4 mt-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                      >
                        <Wand2 className="w-4 h-4" /> Generate Level Bank
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {activeTab === 'config' && (
             <div className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">System Identity</h3>
                <button 
                  onClick={resetToDefaults}
                  className="flex items-center gap-2 px-6 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                >
                  <RefreshCw className="w-3 h-3" /> Reset to Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Type className="w-3.5 h-3.5" /> Platform Title</label>
                    <input 
                      type="text" 
                      value={editableConfig.customTitle}
                      onChange={(e) => setEditableConfig({...editableConfig, customTitle: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5" /> Registry Spreadsheet URL</label>
                    <input 
                      type="text" 
                      value={editableConfig.googleSheetsUrl}
                      onChange={(e) => setEditableConfig({...editableConfig, googleSheetsUrl: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all text-xs"
                    />
                  </div>

                  <button onClick={handleUpdateConfig} className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                    <Save className="w-5 h-5" /> Save Configuration
                  </button>
                </div>

                <div className="space-y-8 bg-slate-50 p-10 rounded-[40px] border border-slate-100">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Program Imagery</h4>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Math Image URL</label>
                      <input 
                        type="text" 
                        value={editableConfig.mathImageUrl}
                        onChange={(e) => setEditableConfig({...editableConfig, mathImageUrl: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telugu Image URL</label>
                      <input 
                        type="text" 
                        value={editableConfig.teluguImageUrl}
                        onChange={(e) => setEditableConfig({...editableConfig, teluguImageUrl: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prompt Eng. Image URL</label>
                      <input 
                        type="text" 
                        value={editableConfig.promptImageUrl}
                        onChange={(e) => setEditableConfig({...editableConfig, promptImageUrl: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'db_setup' && (
             <div className="max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Database Maintenance</h3>
              <div className="p-10 bg-rose-50 border border-rose-100 rounded-[40px] space-y-6">
                <div className="flex items-center gap-4 text-rose-600">
                  <AlertCircle className="w-8 h-8" />
                  <p className="font-bold text-lg">Use these tools only if data seems missing or stale across devices.</p>
                </div>
                <button 
                  onClick={() => refreshData(true)} 
                  disabled={isSyncing}
                  className="w-full py-5 bg-rose-600 text-white font-black rounded-3xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-200"
                >
                  <RefreshCcw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} /> Force Global Data Sync
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh]">
            <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  {isAddingUser ? <UserPlus className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
                  {isAddingUser ? 'Create New Profile' : 'Modify User Permissions'}
                </h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </header>

            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-10 space-y-12">
              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Core Profile</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Full Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Sree"
                      value={editingUser.fullName}
                      onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Access ID (Username)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.G. CMD002"
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({...editingUser, username: e.target.value.toUpperCase()})}
                        className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner uppercase ${duplicateUsernames.has(editingUser.username.toUpperCase()) ? 'border-rose-300 text-rose-700' : 'border-slate-200 text-slate-800'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Login Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                        <input 
                          type="password"
                          placeholder="••••••••"
                          required={isAddingUser}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Role Assignment</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                     {[UserRole.STUDENT, UserRole.TEACHER, UserRole.PARENT, UserRole.ADMIN].map(role => (
                       <button
                         key={role}
                         type="button"
                         onClick={() => setEditingUser({...editingUser, role})}
                         className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${editingUser.role === role ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-500'}`}
                       >
                         {role}
                       </button>
                     ))}
                   </div>
                </div>
              </section>

              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Classroom Assignment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-2"><School size={10} /> Institute/School</label>
                    <input 
                      type="text"
                      placeholder="e.g. CM Institute"
                      value={editingUser.institute || ''}
                      onChange={(e) => setEditingUser({...editingUser, institute: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-2"><GraduationCap size={10} /> Assigned Teacher</label>
                    <select 
                      value={editingUser.assignedTeacherId || ''}
                      onChange={(e) => setEditingUser({...editingUser, assignedTeacherId: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 focus:bg-white transition-all outline-none shadow-inner"
                    >
                      <option value="">None / Manual</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.username})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Module Entitlements</h4>
                   <span className="text-[9px] font-bold text-slate-300 italic uppercase tracking-widest">Toggle Subscription Access</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'math', label: 'Mental Mathematics', icon: Calculator },
                    { id: 'telugu', label: 'Telugu Dictation', icon: AlphabetIcon },
                    { id: 'prompt', label: 'Prompt Engineering', icon: Zap }
                  ].map(mod => (
                    <div 
                      key={mod.id} 
                      onClick={() => toggleModuleAccess(mod.id)}
                      className={`flex items-center justify-between p-5 rounded-3xl border-2 cursor-pointer transition-all ${editingUser.allowedModules?.includes(mod.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100 grayscale opacity-60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingUser.allowedModules?.includes(mod.id) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <mod.icon size={18} />
                        </div>
                        <p className="font-black text-slate-800 uppercase text-[10px] tracking-widest leading-none">{mod.label}</p>
                      </div>
                      <div className={`transition-colors ${editingUser.allowedModules?.includes(mod.id) ? 'text-indigo-600' : 'text-slate-300'}`}>
                         {editingUser.allowedModules?.includes(mod.id) ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {!isAddingUser && (
                <section className="pt-6">
                   <button 
                     type="button"
                     onClick={() => handleDeleteUser()}
                     className="w-full py-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-[24px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-rose-100 transition-all"
                   >
                      <UserMinus className="w-5 h-5" /> Delete Account
                   </button>
                </section>
              )}
            </form>

            <footer className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-4 relative z-10">
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-full sm:w-1/3 py-5 bg-white border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUser}
                disabled={isSyncing}
                className="w-full sm:w-2/3 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {isAddingUser ? 'Create User Profile' : 'Archive Changes'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
