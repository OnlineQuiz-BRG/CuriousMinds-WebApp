
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useLocation, Routes, Route } from 'react-router-dom';
import { TELUGU_STAGES } from '../../constants';
import { 
  BookOpen, Compass, PenTool, Award, Crown, CheckCircle2,
  ChevronLeft, Sprout, TrendingUp, Sparkles, Loader2, ChevronRight,
  Target, Play, Settings2
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { SystemConfig, UserRole } from '../../types';
import TeluguTestExecution from './TeluguTestExecution';
import TeluguAnalytics from './TeluguAnalytics';

function TeluguMainView({ config }: { config: SystemConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGap, setSelectedGap] = useState<string>('10s');
  const [isCustomGap, setIsCustomGap] = useState(false);
  const [customGapValue, setCustomGapValue] = useState('15');
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['Foundation', 'Progressive', 'Advanced', 'Achiever', 'Expert', 'Mastery'];
  const results = mockDb.getResults(user?.id);

  // Filter stages based on admin configuration (Admins see all)
  const visibleStages = useMemo(() => {
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.TEACHER) return TELUGU_STAGES;
    const enabledIds = config.enabledTeluguStages || TELUGU_STAGES.map(s => s.id);
    return TELUGU_STAGES.filter(s => enabledIds.includes(s.id));
  }, [user, config.enabledTeluguStages]);

  const visibleCategories = useMemo(() => {
    const cats = new Set(visibleStages.map(s => s.category));
    return categories.filter(c => cats.has(c as any));
  }, [visibleStages, categories]);

  useEffect(() => {
    const loadLocalCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        const results = await Promise.all(
          TELUGU_STAGES.map(async (stage) => {
            const qs = await mockDb.getQuestions(stage.id);
            // Count unique testIds for this stage
            const uniqueSets = new Set(qs.map(q => q.testId)).size;
            return { id: stage.id.toLowerCase(), count: uniqueSets };
          })
        );
        results.forEach(res => counts[res.id] = res.count);
        setStageCounts(counts);
      } catch (err) {
        console.error("Local count read failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocalCounts();
  }, [user?.id, location.pathname, selectedStage]);

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Foundation': return { icon: Sprout, bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'text-emerald-600', fill: 'bg-emerald-500', btn: 'group-hover:bg-emerald-600 group-hover:text-white' };
      case 'Progressive': return { icon: Compass, bg: 'bg-sky-50', border: 'border-sky-100', accent: 'text-sky-600', fill: 'bg-sky-500', btn: 'group-hover:bg-sky-600 group-hover:text-white' };
      case 'Advanced': return { icon: PenTool, bg: 'bg-violet-50', border: 'border-violet-100', accent: 'text-violet-600', fill: 'bg-violet-500', btn: 'group-hover:bg-violet-600 group-hover:text-white' };
      case 'Achiever': return { icon: Award, bg: 'bg-amber-50', border: 'border-amber-100', accent: 'text-amber-600', fill: 'bg-amber-500', btn: 'group-hover:bg-amber-600 group-hover:text-white' };
      case 'Expert': return { icon: Crown, bg: 'bg-rose-50', border: 'border-rose-100', accent: 'text-rose-600', fill: 'bg-rose-500', btn: 'group-hover:bg-rose-600 group-hover:text-white' };
      case 'Mastery': return { icon: Sparkles, bg: 'bg-indigo-50', border: 'border-indigo-100', accent: 'text-indigo-600', fill: 'bg-indigo-600', btn: 'group-hover:bg-indigo-600 group-hover:text-white' };
      default: return { icon: BookOpen, bg: 'bg-slate-50', border: 'border-slate-100', accent: 'text-slate-600', fill: 'bg-slate-500', btn: 'group-hover:bg-slate-900 group-hover:text-white' };
    }
  };

  const getStageStats = (stageId: string) => {
    const stageResults = results.filter(r => r.level === stageId);
    const completedSets = new Set(stageResults.filter(r => r.scorePercentage >= 90).map(r => `${r.speedGap}-${r.testId}`));
    return {
      completedCount: completedSets.size,
      totalPossible: (config.teluguLimits[stageId] || 50) * 4 
    };
  };

  if (selectedStage) {
    const stage = TELUGU_STAGES.find(s => s.id === selectedStage);
    const theme = getCategoryTheme(stage?.category || '');
    const limit = config.teluguLimits[selectedStage] || 50;
    const { completedCount, totalPossible } = getStageStats(selectedStage);
    const progress = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;
    
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedStage(null)} 
              className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                {stage?.name} Dictation
              </h2>
              <p className="text-slate-500 font-bold mt-2">{stage?.category} • Structural Registry</p>
            </div>
          </div>

          <div className="bg-white px-8 py-5 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6">
             <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage Mastery</p>
                <p className="text-2xl font-black text-slate-800">{progress}%</p>
             </div>
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-slate-100/50 p-2 rounded-[32px] inline-flex gap-2">
            {['10s', '8s', '6s', '4s'].map(gap => (
              <button
                key={gap}
                onClick={() => {
                  setIsCustomGap(false);
                  setSelectedGap(gap);
                }}
                className={`px-10 py-4 rounded-[24px] font-black transition-all ${selectedGap === gap && !isCustomGap ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white'}`}
              >
                {gap}
              </button>
            ))}
            <button 
              onClick={() => setIsCustomGap(true)}
              className={`px-10 py-4 rounded-[24px] font-black transition-all ${isCustomGap ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-white'}`}
            >
              <Settings2 className="w-4 h-4 inline mr-1" /> Custom
            </button>
          </div>
          
          {isCustomGap && (
            <div className="animate-in slide-in-from-left-2 flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Gap Duration:</span>
              <div className="relative">
                <input 
                  type="number"
                  min="1"
                  max="300"
                  value={customGapValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomGapValue(val);
                    setSelectedGap(val + 's');
                  }}
                  className="w-24 px-4 py-3 bg-white border-2 border-indigo-100 rounded-xl font-black text-lg text-indigo-600 focus:outline-none focus:border-indigo-500 shadow-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-slate-300 pointer-events-none">SEC</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
          {Array.from({ length: limit }).map((_, i) => {
            const testNum = (i + 1).toString();
            const res = results.find(r => r.level === selectedStage && r.testId === testNum && r.speedGap === selectedGap);
            const isMastered = res && res.scorePercentage >= 90;
            
            return (
              <button
                key={testNum}
                onClick={() => navigate(`/telugu/test/${selectedStage}/${testNum}?gap=${selectedGap}`)}
                className={`group relative h-20 rounded-[28px] font-black text-xl border-2 transition-all flex items-center justify-center shadow-sm ${
                  isMastered 
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-emerald-100' 
                  : res 
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-xl'
                }`}
              >
                {testNum}
                {isMastered && <CheckCircle2 className="absolute top-1 right-1 w-4 h-4 text-emerald-500" />}
                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[28px]">
                   <Play className="w-6 h-6 fill-current" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none">Telugu Lexicon</h2>
          <p className="text-slate-500 mt-4 font-bold text-xl">Word Bank Strategy across 18 Structural Stages.</p>
        </div>
        
        <div className="flex gap-4">
          <Link to="/telugu/analytics" className="flex items-center gap-3 px-8 py-5 bg-white border border-slate-200 text-indigo-600 font-black rounded-3xl hover:bg-slate-50 shadow-sm transition-all active:scale-95">
             <TrendingUp className="w-5 h-5" /> Analytics Matrix
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-8 py-5 bg-white border border-slate-200 text-slate-600 font-black rounded-3xl hover:bg-slate-50 shadow-sm transition-all active:scale-95">
             <ChevronLeft className="w-5 h-5" /> Back
          </Link>
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="font-black uppercase tracking-widest text-xs text-slate-400">Restoring Master Bank...</p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-24">
          {visibleCategories.map(category => {
            const theme = getCategoryTheme(category);
            return (
              <section key={category} className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl ${theme.fill} text-white flex items-center justify-center shadow-xl`}>
                     <theme.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{category} Phase</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                  {visibleStages.filter(s => s.category === category).map(stage => {
                    const { completedCount, totalPossible } = getStageStats(stage.id);
                    const CategoryIcon = theme.icon;
                    const progress = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;
                    
                    return (
                      <div key={stage.id} onClick={() => setSelectedStage(stage.id)} className={`${theme.bg} ${theme.border} p-10 rounded-[56px] border-2 shadow-sm hover:shadow-2xl transition-all group flex flex-col hover:-translate-y-2 relative overflow-hidden cursor-pointer`}>
                        <div className="flex justify-between items-start mb-10 relative z-10">
                          <div className={`w-20 h-20 rounded-[32px] bg-white flex items-center justify-center shadow-lg ${theme.accent} group-hover:scale-110 transition-transform`}>
                            <CategoryIcon className="w-10 h-10" />
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Sets</p>
                             <span className="font-black text-slate-800">{stageCounts[stage.id.toLowerCase()] || 0} / 50</span>
                          </div>
                        </div>
                        
                        <div className="relative z-10 space-y-4">
                          <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{stage.name}</h4>
                          <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                             <div className={`h-full ${theme.fill} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        
                        <button className={`w-full py-6 mt-10 bg-white text-slate-800 font-black rounded-[28px] ${theme.btn} transition-all flex items-center justify-center gap-3 shadow-md uppercase tracking-widest text-xs`}>
                          Enter Stage <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TeluguDashboard({ config }: { config: SystemConfig }) {
  return (
    <Routes>
      <Route path="/" element={<TeluguMainView config={config} />} />
      <Route path="/test/:stageId/:testId" element={<TeluguTestExecution />} />
      <Route path="/analytics" element={<TeluguAnalytics />} />
    </Routes>
  );
}
