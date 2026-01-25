
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Lock, Play, ChevronLeft, Sprout, Lightbulb, Rocket, 
  ShieldCheck, Zap, Trophy, BookOpen, Loader2, History, 
  Clock, Target, Settings2
} from 'lucide-react';
import { MATH_LEVELS } from '../../constants';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { UserRole, SystemConfig, Question } from '../../types';
import TestExecution from './TestExecution';
import ResultsReview from './ResultsReview';
import ResultsHistory from './ResultsHistory';

function MathMainView({ config }: { config: SystemConfig }) {
  const { user } = useAuth();
  const location = useLocation();
  const [levelQuestions, setLevelQuestions] = useState<Record<string, Question[]>>({});
  const [results, setResults] = useState(mockDb.getResults(user?.id));
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCustomMode, setIsCustomMode] = useState<Record<string, boolean>>({});
  const [customValues, setCustomValues] = useState<Record<string, number>>({});
  const [selectedDurations, setSelectedDurations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    MATH_LEVELS.forEach(l => initial[l.id] = 10);
    return initial;
  });

  const loadLocalData = async () => {
    setIsLoading(true);
    const qsMap: Record<string, Question[]> = {};
    let totalQsFound = 0;

    for (const lvl of MATH_LEVELS) {
      const qs = await mockDb.getQuestions(lvl.id);
      qsMap[lvl.id.toLowerCase()] = qs;
      totalQsFound += qs.length;
    }
    
    setLevelQuestions(qsMap);
    setResults(mockDb.getResults(user?.id));
    
    if (totalQsFound === 0) {
      await mockDb.syncFromSupabase();
      const refetchedQs: Record<string, Question[]> = {};
      for (const lvl of MATH_LEVELS) {
        const qs = await mockDb.getQuestions(lvl.id);
        refetchedQs[lvl.id.toLowerCase()] = qs;
      }
      setLevelQuestions(refetchedQs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLocalData();
  }, [user?.id, location.pathname]);

  const isLevelUnlocked = (levelId: string) => {
    if (user?.role === UserRole.ADMIN) return true;
    const level = MATH_LEVELS.find(l => l.id === levelId);
    if (!level || !level.unlockRequirement) return true;
    
    const reqLevel = level.unlockRequirement.toLowerCase();
    const reqLevelConfig = MATH_LEVELS.find(l => l.id.toLowerCase() === reqLevel);
    const passReq = reqLevelConfig?.passRequirement || 90;
    
    return results.some(r => r.level.toLowerCase() === reqLevel && r.scorePercentage >= passReq);
  };

  const getLevelProgress = (levelId: string, duration: number) => {
    const levelKey = levelId.toLowerCase();
    const levelConfig = MATH_LEVELS.find(l => l.id.toLowerCase() === levelKey);
    const passReq = levelConfig?.passRequirement || 90;

    const levelResults = results.filter(r => 
      r.level.toLowerCase() === levelKey && 
      (r.duration === duration || r.duration === 0)
    );

    const passedTests = new Set(
      levelResults
        .filter(r => r.scorePercentage >= passReq)
        .map(r => r.testId.toString().padStart(2, '0'))
    );
    
    const qs = levelQuestions[levelKey] || [];
    const uniqueTests = new Set(qs.map(q => q.testId.toString().padStart(2, '0')));
    const availableTestsCount = uniqueTests.size || 0;

    return {
      attempts: levelResults.length,
      passed: passedTests.size,
      available: availableTestsCount,
      passReq
    };
  };

  const getLevelTheme = (id: string) => {
    switch(id.toLowerCase()) {
      case 'novice': return { icon: Sprout, bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'text-emerald-600', fill: 'bg-emerald-500', hover: 'hover:border-emerald-300' };
      case 'awareness': return { icon: Lightbulb, bg: 'bg-sky-50', border: 'border-sky-100', accent: 'text-sky-600', fill: 'bg-sky-500', hover: 'hover:border-sky-300' };
      case 'beginner': return { icon: Rocket, bg: 'bg-indigo-50', border: 'border-indigo-100', accent: 'text-indigo-600', fill: 'bg-indigo-500', hover: 'hover:border-indigo-300' };
      case 'competent': return { icon: ShieldCheck, bg: 'bg-violet-50', border: 'border-violet-100', accent: 'text-violet-600', fill: 'bg-violet-500', hover: 'hover:border-violet-300' };
      case 'development': return { icon: Zap, bg: 'bg-amber-50', border: 'border-amber-100', accent: 'text-amber-600', fill: 'bg-amber-500', hover: 'hover:border-amber-300' };
      case 'expert': return { icon: Trophy, bg: 'bg-rose-50', border: 'border-rose-100', accent: 'text-rose-600', fill: 'bg-rose-500', hover: 'hover:border-rose-300' };
      default: return { icon: BookOpen, bg: 'bg-slate-50', border: 'border-slate-100', accent: 'text-slate-600', fill: 'bg-slate-500', hover: 'hover:border-slate-300' };
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto relative pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Vertical Mastery</h2>
          <p className="text-slate-500 font-bold text-lg mt-2">Track your growth per duration track.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/math/history" className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-indigo-600 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <History className="w-5 h-5" /> Detailed History
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-8 px-4">
        {MATH_LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(level.id);
          const customMode = isCustomMode[level.id] || false;
          const activeDuration = selectedDurations[level.id] || 10;
          const { attempts, passed, available, passReq } = getLevelProgress(level.id, activeDuration);
          const theme = getLevelTheme(level.id);
          const LevelIcon = theme.icon;
          const progressPercent = available > 0 ? (passed / available) * 100 : 0;

          return (
            <div key={level.id} className={`group rounded-[48px] p-8 md:p-10 border-2 transition-all flex flex-col md:flex-row items-center gap-8 md:gap-12 min-h-[220px] ${unlocked ? `${theme.bg} ${theme.border} ${theme.hover} shadow-sm hover:shadow-2xl` : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
              
              {/* Left: Icon Section (Fixed Width) */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="relative">
                  <div className={`w-24 h-24 md:w-28 md:h-28 rounded-[40px] flex items-center justify-center transition-all ${unlocked ? 'bg-white shadow-xl text-slate-800 group-hover:scale-105' : 'bg-slate-200 text-slate-400'}`}>
                    <LevelIcon className={`w-12 h-12 md:w-14 md:h-14 ${unlocked ? theme.accent : 'text-slate-400'}`} />
                  </div>
                  {!unlocked && <div className="absolute -top-2 -right-2 bg-white rounded-full p-3 shadow-xl border border-slate-100"><Lock className="w-6 h-6 text-slate-400" /></div>}
                </div>
              </div>

              {/* Center: Content & Progress Section (Fluid) */}
              <div className="flex-1 space-y-6 w-full">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                       <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{level.name}</h3>
                       {unlocked && (
                         <span className="px-4 py-1.5 bg-white/70 border border-slate-200 rounded-full text-[10px] font-black text-slate-500 flex items-center gap-1.5 shadow-sm">
                           <Target className="w-3.5 h-3.5 text-indigo-500" /> PASS: {passReq}%
                         </span>
                       )}
                    </div>
                    <p className={`font-black text-xl md:text-2xl mt-3 ${unlocked ? theme.accent : 'text-slate-400'}`}>
                      {available > 0 ? `${passed} / ${available} Sets Mastered` : 'Checking Assessments...'}
                    </p>
                  </div>

                  <div className="flex flex-col lg:items-end gap-3">
                    <div className="bg-white/60 p-1.5 rounded-[24px] border border-slate-200 flex items-center gap-1 shadow-inner">
                      {[10, 8, 6, 4].map(d => (
                        <button
                          key={d}
                          onClick={() => {
                            setIsCustomMode(prev => ({...prev, [level.id]: false}));
                            setSelectedDurations(prev => ({...prev, [level.id]: d}));
                          }}
                          className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black transition-all ${activeDuration === d && !customMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/80'}`}
                        >
                          {d}m
                        </button>
                      ))}
                      <button
                        onClick={() => setIsCustomMode(prev => ({...prev, [level.id]: true}))}
                        className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black transition-all ${customMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/80'}`}
                      >
                        <Settings2 className="w-3.5 h-3.5 inline mr-1" /> Custom
                      </button>
                    </div>
                    
                    {customMode && (
                      <div className="animate-in slide-in-from-top-2 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration:</span>
                        <input 
                          type="number"
                          min="1"
                          max="120"
                          value={customValues[level.id] || activeDuration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setCustomValues(prev => ({...prev, [level.id]: val}));
                            setSelectedDurations(prev => ({...prev, [level.id]: val}));
                          }}
                          className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded-lg font-black text-xs text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="w-full h-4 bg-slate-200/50 rounded-full overflow-hidden shadow-inner relative border border-slate-100">
                    <div className={`h-full ${theme.fill} transition-all duration-1000 shadow-lg`} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {activeDuration} MINUTE TRACK</span>
                    <span className="flex items-center gap-1">{attempts} ATTEMPTS • {Math.round(progressPercent)}% GOAL REACHED</span>
                  </div>
                </div>
              </div>

              {/* Right: Action Button (Strictly Aligned Fixed Width Column) */}
              <div className="shrink-0 w-full md:w-[320px] flex items-center justify-center md:justify-end">
                {unlocked && (available > 0 || isLoading) ? (
                  <Link
                    to={`/math/test/${level.id}${customMode ? `?customDuration=${activeDuration}` : ''}`}
                    className={`flex items-center justify-center gap-5 w-full py-8 md:py-10 ${theme.fill} text-white font-black rounded-[40px] shadow-2xl shadow-indigo-200/50 hover:brightness-110 hover:scale-[1.03] active:scale-95 transition-all text-sm md:text-base uppercase tracking-[0.2em]`}
                  >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-7 h-7 fill-current" />} 
                    {isLoading ? 'SYNCING...' : 'TAKE ASSESSMENT'}
                  </Link>
                ) : (
                  <div className="w-full py-8 md:py-10 bg-white/40 text-slate-300 font-black rounded-[40px] text-center flex items-center justify-center gap-3 border-4 border-dashed border-slate-200/50 text-[10px] md:text-xs uppercase tracking-[0.25em]">
                    {unlocked ? (isLoading ? 'LOADING...' : 'EMPTY BANK') : 'LEVEL LOCKED'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MathDashboard({ config }: { config: SystemConfig }) {
  return (
    <Routes>
      <Route path="/" element={<MathMainView config={config} />} />
      <Route path="/test/:levelId" element={<TestExecution config={config} />} />
      <Route path="/results/:resultId" element={<ResultsReview />} />
      <Route path="/history" element={<ResultsHistory />} />
    </Routes>
  );
}
