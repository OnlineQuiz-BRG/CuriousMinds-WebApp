
import React, { useState, useMemo, useEffect } from 'react';
import { mockDb } from '../../services/mockDb';
import { UserRole, User, TestResult } from '../../types';
import { 
  Users, BookOpen, GraduationCap, Search, CheckCircle2, LayoutGrid, List as ListIcon, 
  UserPlus, ShieldAlert, TrendingUp, Filter, Calculator, Zap, ArrowRight,
  School, Hash, Info, RefreshCw, ChevronRight, AlertCircle, Sparkles, X, MessageSquare, Save, Check, Award
} from 'lucide-react';
import { TELUGU_STAGES, MATH_LEVELS } from '../../constants';
import { useAuth } from '../../App';

const AlphabetIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <text x="1" y="13" fill="currentColor" stroke="none" fontSize="13" fontWeight="900" fontFamily="serif">అ</text>
    <text x="12" y="21" fill="currentColor" stroke="none" fontSize="14" fontWeight="900" fontFamily="sans-serif">A</text>
    <path d="M4 18L20 6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
  </svg>
);

export default function TeacherDashboard() {
  const { user: teacher } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'math' | 'telugu' | 'prompt'>('all');
  const [claimId, setClaimId] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allResults, setAllResults] = useState<TestResult[]>([]);
  
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [guidanceText, setGuidanceText] = useState('');
  const [isSavingGuidance, setIsSavingGuidance] = useState(false);

  const fetchData = () => {
    setAllUsers(mockDb.getUsers());
    setAllResults(mockDb.getResults());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const myStudents = useMemo(() => {
    if (!teacher) return [];
    return allUsers.filter(u => 
      u.role === UserRole.STUDENT && 
      (u.assignedTeacherId === teacher.id || 
       (teacher.institute && u.institute === teacher.institute))
    );
  }, [allUsers, teacher]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myStudents, searchTerm]);

  const cohortResults = useMemo(() => {
    const studentIds = new Set(myStudents.map(s => s.id));
    let results = allResults.filter(r => studentIds.has(r.userId));

    if (subjectFilter !== 'all') {
      results = results.filter(r => {
        if (subjectFilter === 'math') return MATH_LEVELS.some(l => l.id.toLowerCase() === r.level.toLowerCase());
        if (subjectFilter === 'telugu') return TELUGU_STAGES.some(s => s.id.toLowerCase() === r.level.toLowerCase());
        return false;
      });
    }

    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allResults, myStudents, subjectFilter]);

  const handleClaimStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimId.trim() || !teacher) return;
    setClaiming(true);
    try {
      const code = claimId.trim().toUpperCase();
      const student = allUsers.find(u => u.username === code && u.role === UserRole.STUDENT);
      
      if (!student) {
        alert("Student with this Access ID not found in global registry.");
      } else if (student.assignedTeacherId === teacher.id) {
        alert("This student is already assigned to you.");
      } else {
        const updatedStudent = { 
          ...student, 
          assignedTeacherId: teacher.id,
          institute: teacher.institute || student.institute 
        };
        await mockDb.saveUser(updatedStudent);
        fetchData();
        setClaimId('');
        alert(`Student ${student.fullName} successfully linked to your classroom.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  const openStudentProfile = (student: User) => {
    setSelectedStudent(student);
    setGuidanceText(student.teacherNotes || '');
  };

  const handleSaveGuidance = async () => {
    if (!selectedStudent) return;
    setIsSavingGuidance(true);
    try {
      const updated = { ...selectedStudent, teacherNotes: guidanceText };
      await mockDb.saveUser(updated);
      setSelectedStudent(updated);
      setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      alert("Guidance archived for student.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingGuidance(false);
    }
  };

  const studentDetailedStats = useMemo(() => {
    if (!selectedStudent) return null;
    const results = allResults.filter(r => r.userId === selectedStudent.id);
    
    const mathMastery = MATH_LEVELS.map(lvl => {
      const levelRes = results.filter(r => r.level.toLowerCase() === lvl.id.toLowerCase());
      const passed = levelRes.some(r => r.scorePercentage >= lvl.passRequirement);
      return { ...lvl, passed };
    });

    const teluguMastery = TELUGU_STAGES.map(stg => {
      const stageRes = results.filter(r => r.level.toLowerCase() === stg.id.toLowerCase());
      const passed = stageRes.some(r => r.scorePercentage >= 90);
      return { ...stg, passed };
    });

    return { results, mathMastery, teluguMastery };
  }, [selectedStudent, allResults]);

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
            <School className="w-3.5 h-3.5" /> {teacher?.institute || 'Independent Educator'}
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Classroom Monitor</h2>
          <p className="text-slate-500 font-bold">Managing {myStudents.length} assigned students across {teacher?.institute || 'system'}.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
             <button onClick={() => setViewMode('table')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                <ListIcon className="w-4 h-4 inline mr-2" /> Live Stream
             </button>
             <button onClick={() => setViewMode('heatmap')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'heatmap' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                <LayoutGrid className="w-4 h-4 inline mr-2" /> Cohort Grid
             </button>
          </div>
          <button onClick={fetchData} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Cohort Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
             <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cohort Size</p>
            <p className="text-2xl font-black text-slate-800">{myStudents.length}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
             <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sprints Run</p>
            <p className="text-2xl font-black text-slate-800">{cohortResults.length}</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
             <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mean Accuracy</p>
            <p className="text-2xl font-black text-slate-800">
              {cohortResults.length ? Math.round(cohortResults.reduce((acc, r) => acc + r.scorePercentage, 0) / cohortResults.length) : 0}%
            </p>
          </div>
        </div>
        
        {/* Claim Student Card */}
        <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Enrollment Engine</p>
            <form onSubmit={handleClaimStudent} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Access ID..."
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 w-full uppercase"
              />
              <button disabled={claiming} className="bg-white text-slate-900 p-2 rounded-xl hover:bg-indigo-50 transition-all shrink-0">
                {claiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </form>
          </div>
          <Sparkles className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 group-hover:text-white/10 transition-colors" />
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[60vh]">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="bg-white p-1 rounded-xl border border-slate-200 flex gap-1">
                {[
                  { id: 'all', label: 'All', icon: ListIcon },
                  { id: 'math', label: 'Math', icon: Calculator },
                  { id: 'telugu', label: 'Telugu', icon: AlphabetIcon },
                  { id: 'prompt', label: 'AI', icon: Zap }
                ].map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => setSubjectFilter(sub.id as any)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${subjectFilter === sub.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <sub.icon size={12} /> {sub.label}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cohort..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 w-full md:w-80 font-bold bg-white text-sm"
            />
          </div>
        </div>

        <div className="flex-1">
          {myStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center px-10">
               <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
                  <ShieldAlert className="w-12 h-12" />
               </div>
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Roster Empty</h3>
               <p className="text-slate-500 font-bold max-w-sm mx-auto mt-4">
                 Students linked to <span className="text-indigo-600">"{teacher?.institute || 'your profile'}"</span> will automatically appear here. You can also claim students manually using their Access ID.
               </p>
               <button onClick={() => document.querySelector('input')?.focus()} className="mt-8 flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs hover:underline">
                 Enroll First Student <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-10 py-5">Student Identity</th>
                    <th className="px-10 py-5">Module / Level</th>
                    <th className="px-10 py-5">Result</th>
                    <th className="px-10 py-5">Verification</th>
                    <th className="px-10 py-5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {cohortResults.map(r => {
                    const student = myStudents.find(s => s.id === r.userId);
                    const isMath = MATH_LEVELS.some(l => l.id.toLowerCase() === r.level.toLowerCase());
                    const isPass = r.scorePercentage >= 90;
                    return (
                      <tr key={r.id} onClick={() => student && openStudentProfile(student)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                 {student?.fullName?.[0]}
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{student?.fullName || 'Legacy Member'}</p>
                                 <p className="text-[10px] font-bold text-slate-400">ID: {student?.username}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMath ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                 {isMath ? <Calculator size={14} /> : <AlphabetIcon size={14} />}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-slate-700 capitalize">{r.level.replace('stage-', 'Stage ')}</p>
                                 {r.speedGap && <p className="text-[9px] font-bold text-slate-400">{r.speedGap} Gap</p>}
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`text-2xl font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>{r.scorePercentage}%</span>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${isPass ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                            {isPass ? 'MASTERED' : 'NEEDS REVIEW'}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right text-xs text-slate-400 font-bold">
                           {new Date(r.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {filteredStudents.map(student => {
                 const studentResults = allResults.filter(r => r.userId === student.id);
                 const latest = studentResults[0];
                 const avg = studentResults.length > 0 ? Math.round(studentResults.reduce((acc, r) => acc + r.scorePercentage, 0) / studentResults.length) : 0;
                 return (
                   <div key={student.id} onClick={() => openStudentProfile(student)} className="bg-slate-50/50 border border-slate-200 p-8 rounded-[40px] flex flex-col items-center text-center hover:bg-white hover:shadow-2xl transition-all group cursor-pointer relative">
                      <div className="w-20 h-20 bg-white shadow-xl rounded-[30px] flex items-center justify-center text-3xl font-black text-slate-800 mb-6 group-hover:scale-110 transition-transform">
                         {student.fullName[0]}
                      </div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none mb-1 group-hover:text-indigo-600 transition-colors">{student.fullName}</h4>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-[9px] font-black uppercase text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-md">{student.username}</span>
                        {student.grade && <span className="text-[9px] font-black uppercase text-indigo-500">{student.grade}</span>}
                      </div>

                      <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t border-slate-200/50">
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mastery</p>
                            <p className="text-xl font-black text-slate-800">{avg}%</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sprints</p>
                            <p className="text-xl font-black text-slate-800">{studentResults.length}</p>
                         </div>
                      </div>

                      <div className="w-full mt-8">
                         {latest ? (
                           <div className="text-[9px] font-bold text-slate-400 flex items-center justify-center gap-2">
                              <div className="flex items-center gap-1.5"><Info size={12} className="text-indigo-400" /> Last: {latest.level.replace('stage-', 'S')} ({latest.scorePercentage}%)</div>
                           </div>
                         ) : (
                           <div className="text-[9px] font-bold text-slate-300 italic">No Assessment History</div>
                         )}
                      </div>
                      
                      {student.teacherNotes && (
                        <div className="absolute top-6 right-6 w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                           <MessageSquare size={14} />
                        </div>
                      )}
                   </div>
                 );
               })}
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal (Centered) */}
      {selectedStudent && studentDetailedStats && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedStudent(null)} />
           <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden max-h-[95vh]">
             <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-black shadow-xl">
                      {selectedStudent.fullName[0]}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedStudent.fullName}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {selectedStudent.username}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                   <X size={24} />
                </button>
             </header>

             <div className="flex-1 overflow-y-auto p-10 space-y-12">
                {/* Guidance Section */}
                <section className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                         <MessageSquare size={14} /> Educator's Guidance
                      </h4>
                      {guidanceText !== (selectedStudent.teacherNotes || '') && (
                        <span className="text-[9px] font-black text-amber-500 uppercase animate-pulse">Unsaved Changes</span>
                      )}
                   </div>
                   <div className="relative group">
                      <textarea
                        value={guidanceText}
                        onChange={(e) => setGuidanceText(e.target.value)}
                        placeholder="Provide personalized advice..."
                        className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[32px] p-8 text-slate-800 font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner resize-none"
                      />
                      <button 
                        onClick={handleSaveGuidance}
                        disabled={isSavingGuidance}
                        className="absolute bottom-6 right-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                      >
                         {isSavingGuidance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                      </button>
                   </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Calculator size={14} /> Math Status
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                         {studentDetailedStats.mathMastery.map(lvl => (
                           <div key={lvl.id} className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${lvl.passed ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                              <span className={`text-[8px] font-black uppercase tracking-tight ${lvl.passed ? 'text-indigo-600' : 'text-slate-400'}`}>{lvl.name}</span>
                              {lvl.passed ? <Check className="text-indigo-600" size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                           </div>
                         ))}
                      </div>
                   </section>

                   <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <AlphabetIcon size={14} /> Telugu Status
                      </h4>
                      <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 h-full min-h-[140px]">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Mastered</p>
                         <div className="flex flex-wrap gap-2">
                            {studentDetailedStats.teluguMastery.filter(s => s.passed).length > 0 ? (
                              studentDetailedStats.teluguMastery.filter(s => s.passed).map(stg => (
                                <span key={stg.id} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{stg.id.split('-')[1]}</span>
                              ))
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 italic">None yet</span>
                            )}
                         </div>
                      </div>
                   </section>
                </div>

                <section className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Sprints</h4>
                   <div className="space-y-4">
                      {studentDetailedStats.results.slice(0, 5).map(r => (
                        <div key={r.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-lg transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                 {MATH_LEVELS.some(l => l.id.toLowerCase() === r.level.toLowerCase()) ? <Calculator size={18} /> : <AlphabetIcon size={18} />}
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 uppercase text-xs">{r.level.replace('stage-', 'S')}</p>
                                 <p className="text-[9px] font-bold text-slate-400">{new Date(r.timestamp).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={`text-xl font-black ${r.scorePercentage >= 90 ? 'text-emerald-600' : 'text-rose-600'}`}>{r.scorePercentage}%</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
             </div>

             <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                   <Award className="text-amber-500 w-5 h-5" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Snapshot</p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors">Dismiss</button>
             </footer>
           </div>
        </div>
      )}
    </div>
  );
}
