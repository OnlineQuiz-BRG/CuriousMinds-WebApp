
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calculator, Zap, ChevronRight, Award, X, BookOpen, 
  Target, Info, ArrowRight, BarChart3, TrendingUp, CheckCircle2, 
  Trophy, Medal, Star, ShieldCheck, Rocket, Flame, Sparkles, Lock, Image as ImageIcon, MessageSquare
} from 'lucide-react';
import { SystemConfig, UserRole, Question } from '../types';
import { mockDb } from '../services/mockDb';
import { useAuth } from '../App';
import { MATH_LEVELS, TELUGU_STAGES } from '../constants';

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

interface Subject {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  highlights: string[];
  icon: any;
  color: string;
  image: string;
  path: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  isUnlocked: boolean;
  earnedDate?: string;
  requirement: string;
}

export default function Dashboard({ config }: { config: SystemConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [localResults, setLocalResults] = useState(mockDb.getResults(user?.id));
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalResults(mockDb.getResults(user?.id));
    mockDb.getQuestions().then(qs => setAllQuestions(qs));
  }, [user?.id, location.pathname]);

  const stats = useMemo(() => {
    if (!user) return { total: 0, avg: 0 };
    const avg = localResults.length > 0 
      ? Math.round(localResults.reduce((acc, r) => acc + r.scorePercentage, 0) / localResults.length) 
      : 0;
    return { total: localResults.length, avg };
  }, [user, localResults]);

  const achievements = useMemo((): Achievement[] => {
    const list: Achievement[] = [];
    if (!user) return list;

    const allowed = user.allowedModules || [];
    const isAdmin = user.role === UserRole.ADMIN;

    // --- Math Badges (Only show if Math is allowed) ---
    if (isAdmin || allowed.includes('math')) {
      MATH_LEVELS.forEach(level => {
        const levelResults = localResults.filter(r => r.level.toLowerCase() === level.id.toLowerCase());
        const levelQs = allQuestions.filter(q => q.level.toLowerCase() === level.id.toLowerCase());
        const uniqueTests = new Set(levelQs.map(q => q.testId));
        
        const passedTests = new Set(
          levelResults
            .filter(r => r.scorePercentage >= level.passRequirement)
            .map(r => r.testId)
        );

        const isMastered = uniqueTests.size > 0 && passedTests.size >= uniqueTests.size;
        const latestResult = levelResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        list.push({
          id: `math-${level.id}`,
          title: `${level.name} Master`,
          description: `Complete all ${level.name} level assessments with ${level.passRequirement}%+ accuracy.`,
          icon: Medal,
          color: 'text-indigo-500',
          isUnlocked: isMastered,
          earnedDate: isMastered ? latestResult?.timestamp : undefined,
          requirement: `Complete ${passedTests.size}/${uniqueTests.size || '?'} tests`
        });
      });
    }

    // --- Telugu Badges (Only show if Telugu is allowed) ---
    if (isAdmin || allowed.includes('telugu')) {
      const categories = ['Foundation', 'Progressive', 'Advanced', 'Achiever', 'Expert', 'Mastery'];
      categories.forEach(cat => {
        const catStages = TELUGU_STAGES.filter(s => s.category === cat).map(s => s.id);
        const catResults = localResults.filter(r => catStages.includes(r.level));
        
        const uniquePassedStages = new Set(catResults.filter(r => r.scorePercentage >= 90).map(r => r.level));
        const isScholar = uniquePassedStages.size >= 3;
        const latestResult = catResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        list.push({
          id: `telugu-${cat}`,
          title: `${cat} Scholar`,
          description: `Master all 3 stages in the ${cat} category with 90%+ accuracy.`,
          icon: Trophy,
          color: cat === 'Mastery' ? 'text-indigo-600' : 'text-emerald-500',
          isUnlocked: isScholar,
          earnedDate: isScholar ? latestResult?.timestamp : undefined,
          requirement: `Mastered ${uniquePassedStages.size}/3 stages`
        });
      });
    }

    // --- Special Badges ---
    const isAiArchitect = stats.total > 50;
    list.push({
      id: 'marathoner',
      title: 'Sprint Marathoner',
      description: 'Complete a total of 50 learning assessments.',
      icon: Flame,
      color: 'text-rose-500',
      isUnlocked: isAiArchitect,
      earnedDate: isAiArchitect ? localResults[49]?.timestamp : undefined,
      requirement: `Current: ${stats.total}/50`
    });

    return list;
  }, [localResults, allQuestions, stats.total, user]);

  const subjects: Subject[] = [
    {
      id: 'math',
      title: 'Mental Mathematics',
      description: 'Master 6 levels of proficiency from Novice to Expert.',
      longDescription: 'A rigorous mental arithmetic program designed to enhance calculation speed, memory retention, and numerical intuition. Students progress through adaptive challenges focusing on addition, subtraction, multiplication, and complex multi-part equations.',
      highlights: ['6 Progressive Difficulty Levels', 'Timed Speed Challenges', 'Deterministic Progress Tracking', 'Adaptive Learning Path'],
      icon: Calculator,
      color: 'bg-indigo-500',
      image: config.mathImageUrl,
      path: '/math'
    },
    {
      id: 'telugu',
      title: 'Telugu Dictation',
      description: 'Progress through 18 stages across 6 proficiency levels.',
      longDescription: 'Our comprehensive Telugu literacy curriculum spans 18 stages across Foundation, Progressive, Advanced, Achiever, Expert, and Mastery levels. The program utilizes structural dictation to perfect spelling and accuracy.',
      highlights: ['6 Modular Proficiency Levels', '18 Structural Learning Stages', 'Block-based Vocabulary Randomization', 'Manual Scoring Matrix'],
      icon: AlphabetIcon,
      color: 'bg-emerald-500',
      image: config.teluguImageUrl,
      path: '/telugu'
    },
    {
      id: 'prompt',
      title: 'Prompt Engineering',
      description: 'Advanced course for high school students to master AI prompting.',
      longDescription: 'Unlock the potential of generative AI. This course teaches high school students how to craft precise instructions, manage AI context, and leverage large language models for complex problem-solving and creative workflows.',
      highlights: ['Interactive AI Playground', 'Context Management Techniques', 'Persona-based Instruction Sets', 'Real-world AI Application Lab'],
      icon: Zap,
      color: 'bg-orange-500',
      image: config.promptImageUrl,
      path: '/prompt-eng'
    }
  ];

  const visibleSubjects = useMemo(() => {
    if (!user) return [];
    if (user.role === UserRole.ADMIN) return subjects;
    return subjects.filter(subject => user.allowedModules?.includes(subject.id));
  }, [user, subjects]);

  const openPreview = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowDetails(false);
  };

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Welcome Back, {user?.fullName.split(' ')[0]}!</h2>
          <p className="text-slate-500 mt-2 font-bold text-lg">Your educational odyssey continues today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-8 py-5 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Sprints</p>
              <p className="text-2xl font-black text-slate-800 leading-none mt-1">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white px-8 py-5 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Accuracy</p>
              <p className="text-2xl font-black text-slate-800 leading-none mt-1">{stats.avg}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* Teacher's Guidance Section */}
      {user?.teacherNotes && (
        <section className="bg-amber-50 rounded-[48px] p-10 border border-amber-100 shadow-sm flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-50">
              <MessageSquare size={32} />
           </div>
           <div className="space-y-4">
              <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                 <Award size={14} /> Teacher's Guidance & Feedback
              </h3>
              <p className="text-xl font-bold text-amber-900 leading-relaxed italic">
                 "{user.teacherNotes}"
              </p>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Last updated by your educator</p>
           </div>
        </section>
      )}

      {/* Main Learning Hub - Filtered List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {visibleSubjects.length > 0 ? (
          visibleSubjects.map((subject) => (
            <div 
              key={subject.id} 
              onClick={() => openPreview(subject)}
              className="group bg-white rounded-[48px] shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="relative h-72 overflow-hidden bg-slate-50">
                {!imageErrors[subject.id] ? (
                  <img 
                    src={subject.image} 
                    alt={subject.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    onError={() => handleImageError(subject.id)}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${subject.color} opacity-10`}>
                    <ImageIcon className="w-16 h-16 text-slate-400 opacity-20" />
                  </div>
                )}
                <div className={`absolute top-8 left-8 ${subject.color} p-5 rounded-[24px] text-white shadow-2xl group-hover:rotate-12 transition-transform`}>
                  <subject.icon className="w-8 h-8" />
                </div>
              </div>
              
              <div className="p-10 flex-1 flex flex-col">
                <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tighter uppercase leading-none">{subject.title}</h3>
                <p className="text-slate-500 font-bold text-base mb-8 flex-1 leading-relaxed">
                  {subject.description}
                </p>
                
                <div className="flex items-center justify-between w-full py-5 px-10 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white rounded-[24px] font-black text-slate-800 transition-all duration-500 uppercase tracking-widest text-xs">
                  <span>View Program</span>
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-3 py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-200 text-center">
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No Modules Assigned</h3>
            <p className="text-slate-400 font-bold mt-4">Please contact your administrator to assign learning modules to your profile.</p>
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <section className="space-y-8 pt-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Milestones & Achievements</h3>
                <p className="text-slate-500 font-bold">Showcasing your journey towards academic mastery.</p>
              </div>
           </div>
           {user?.allowedModules?.includes('math') && (
             <button onClick={() => navigate('/math/history')} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Records</button>
           )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {achievements.map((badge) => (
            <div 
              key={badge.id}
              className={`relative group bg-white p-8 rounded-[40px] border-2 flex flex-col items-center text-center transition-all ${badge.isUnlocked ? 'border-amber-100 shadow-md hover:shadow-xl hover:-translate-y-1' : 'border-slate-50 opacity-40 grayscale'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${badge.isUnlocked ? 'bg-amber-50 text-amber-500 shadow-inner' : 'bg-slate-100 text-slate-400'}`}>
                {badge.isUnlocked ? <badge.icon className="w-8 h-8" /> : <Lock className="w-6 h-6" />}
              </div>
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight mb-2 leading-tight h-8 flex items-center">
                {badge.title}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 leading-tight">
                {badge.isUnlocked ? `Earned ${new Date(badge.earnedDate!).toLocaleDateString()}` : badge.requirement}
              </p>

              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                <p className="mb-2 text-amber-400 uppercase tracking-widest">Requirement</p>
                <p className="leading-relaxed opacity-80">{badge.description}</p>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <div className="bg-slate-900 rounded-[56px] p-12 text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>
        
        <div className="flex-1 space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
            <Sparkles className="w-3 h-3" /> Growth Engine
          </div>
          <h3 className="text-4xl font-black tracking-tighter leading-none uppercase">Architect Your Future</h3>
          <p className="text-slate-400 font-bold text-lg max-w-2xl leading-relaxed">
            Every session adds to your neural blueprint. Consistency isn't just a habit—it's the foundation of genius. Ready for the next sprint?
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {user?.allowedModules?.includes('math') && (
              <button onClick={() => navigate('/math')} className="px-10 py-5 bg-white text-slate-900 font-black rounded-[24px] shadow-2xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
                Continue Math
              </button>
            )}
            {user?.allowedModules?.includes('telugu') && (
              <button onClick={() => navigate('/telugu')} className="px-10 py-5 bg-white text-slate-900 font-black rounded-[24px] shadow-2xl hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-widest">
                Open Telugu Bank
              </button>
            )}
            <button onClick={() => navigate(user?.allowedModules?.includes('math') ? '/math/history' : '/dashboard')} className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-[24px] hover:bg-white/10 transition-all text-sm uppercase tracking-widest">
              View Analytics
            </button>
          </div>
        </div>
        <div className="w-48 h-48 bg-white/5 rounded-[48px] flex items-center justify-center backdrop-blur-3xl border border-white/10 shrink-0 transform transition-all group-hover:rotate-12 duration-1000 shadow-inner group-hover:scale-110">
          <Award className="w-24 h-24 text-indigo-400" />
        </div>
      </div>

      {/* Modal Preview for Subjects */}
      {selectedSubject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-1 sm:p-2 md:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl" onClick={() => setSelectedSubject(null)}></div>
          
          <div className="relative bg-white w-full max-w-[99vw] h-full max-h-[98vh] rounded-[24px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="absolute top-6 right-6 z-50">
              <button 
                onClick={() => setSelectedSubject(null)}
                className="p-4 bg-white/80 backdrop-blur-xl text-slate-900 rounded-full hover:bg-white transition-all border border-slate-200 shadow-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white flex flex-col">
              <div className="w-full bg-slate-50 flex items-center justify-center p-4 min-h-[50vh] relative overflow-hidden">
                <div className={`absolute inset-0 ${selectedSubject.color} opacity-5 blur-[120px]`}></div>
                {!imageErrors[selectedSubject.id] ? (
                  <img 
                    src={selectedSubject.image} 
                    className="w-full max-w-[100%] h-auto max-h-[88vh] object-contain drop-shadow-2xl transition-all duration-1000 relative z-10" 
                    alt={selectedSubject.title} 
                    onError={() => handleImageError(selectedSubject.id)}
                  />
                ) : (
                  <div className="w-64 h-64 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 relative z-10">
                    <ImageIcon size={64} />
                  </div>
                )}
              </div>

              <div className="bg-white px-10 py-10 md:px-16 md:py-12 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-slate-100 relative z-10 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
                <div className="space-y-3 text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className={`p-4 rounded-3xl ${selectedSubject.color} text-white shadow-2xl`}>
                      <selectedSubject.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none uppercase">
                      {selectedSubject.title}
                    </h3>
                  </div>
                  <p className="text-slate-500 font-bold text-xl">
                    {selectedSubject.description}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-[28px] font-black text-sm transition-all border-2 ${showDetails ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Info className="w-5 h-5" /> 
                    {showDetails ? 'Hide Curriculum' : 'View Curriculum'}
                  </button>
                  <button 
                    onClick={() => navigate(selectedSubject.path)}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                  >
                    Enter Program <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {showDetails && (
                <div className="bg-slate-50 p-10 md:p-20 animate-in slide-in-from-bottom duration-700 border-t border-slate-100">
                  <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${selectedSubject.color} text-white shadow-lg`}>
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Learning Profile</span>
                      </div>
                      <p className="text-slate-600 font-bold leading-relaxed text-2xl md:text-3xl tracking-tight">
                        {selectedSubject.longDescription}
                      </p>
                    </div>

                    <div className="space-y-10">
                      <div className="space-y-8">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${selectedSubject.color} text-white shadow-lg`}>
                            <Target className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Module Objectives</span>
                        </div>
                        <div className="grid grid-cols-1 gap-5">
                          {selectedSubject.highlights.map((highlight, idx) => (
                            <div key={idx} className="flex items-center gap-5 p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:scale-[1.02]">
                              <div className={`w-4 h-4 rounded-full ${selectedSubject.color} shadow-lg shadow-current`}></div>
                              <span className="text-xl font-black text-slate-800 tracking-tight">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
