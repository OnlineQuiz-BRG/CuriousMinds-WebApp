
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, CheckCircle, User as UserIcon, Play, RefreshCw, Send, Sparkles, 
  AlertCircle, Clock, Volume2, Pause, SkipForward,
  Check, X as XIcon, Minus, Timer
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { TELUGU_STAGES } from '../../constants';
import { Question, TestResult } from '../../types';
import confetti from 'canvas-confetti';

export default function TeluguTestExecution() {
  const { stageId, testId } = useParams();
  const [searchParams] = useSearchParams();
  const gapString = searchParams.get('gap') || '10s';
  const gapSeconds = parseInt(gapString);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const stage = TELUGU_STAGES.find(s => s.id === stageId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1); 
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [wordResults, setWordResults] = useState<Record<number, string>>({}); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New state for the inter-word countdown
  const [timeLeftInGap, setTimeLeftInGap] = useState(gapSeconds);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!stageId || !testId) return;
      const allQs = await mockDb.getQuestions(stageId);
      const loaded = allQs.filter(q => 
        q.testId === testId
      ).sort((a, b) => a.questionNum - b.questionNum);
      setQuestions(loaded);
    };
    loadQuestions();
  }, [stageId, testId]);

  const speakWord = useCallback((tel: string, num: number | string, isCompletion = false) => {
    window.speechSynthesis.cancel();
    
    let utteranceText = "";
    if (isCompletion) {
      utteranceText = "Dictation completed. Well done! Please verify your answers.";
    } else {
      utteranceText = `${num}. ${tel}`;
    }

    const msg = new SpeechSynthesisUtterance(utteranceText);
    msg.lang = isCompletion ? 'en-US' : 'te-IN';
    msg.rate = 0.55; 

    msg.onstart = () => setIsSpeaking(true);
    msg.onend = () => setIsSpeaking(false);
    msg.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(msg);
  }, []);

  // Refactored Cycle Management: Tick every 1 second for the visual timer
  useEffect(() => {
    let interval: any;
    if (isAutoRunning && currentIndex >= 0 && currentIndex < questions.length) {
      interval = setInterval(() => {
        setTimeLeftInGap((prev) => {
          if (prev <= 1) {
            // Timer hit zero
            if (currentIndex < questions.length - 1) {
              setCurrentIndex((idx) => idx + 1);
              return gapSeconds; // Reset timer for next word
            } else {
              // Last word finished
              setIsAutoRunning(false);
              handleSessionCompletion();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAutoRunning, currentIndex, questions.length, gapSeconds]);

  // Handle Voice trigger exactly when index changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < questions.length) {
      speakWord(questions[currentIndex].answer, questions[currentIndex].questionNum);
    }
  }, [currentIndex, questions, speakWord]);

  const handleSessionCompletion = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4F46E5', '#10B981', '#F59E0B']
    });
    setTimeout(() => {
      speakWord('', '', true);
    }, 1500);
    setIsReviewMode(true);
  };

  const startSession = async () => {
    setCurrentIndex(0);
    setTimeLeftInGap(gapSeconds);
    setIsAutoRunning(true);
  };

  const setScore = (idx: number, score: string) => {
    setWordResults(prev => ({ ...prev, [idx]: score }));
  };

  const saveAssessment = async () => {
    if (!user || !stageId || !testId) return;
    setIsSubmitting(true);

    const scoreArray = questions.map((_, i) => {
      const val = wordResults[i];
      if (val === "1") return 1;
      if (val === "0") return 0;
      return -1; 
    });

    const correctCount = scoreArray.filter(s => s === 1).length;

    const result: TestResult = {
      id: `telugu-${Date.now()}`,
      userId: user.id,
      level: stageId.toLowerCase(),
      testId: testId,
      duration: 0,
      speedGap: gapString,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      scorePercentage: Math.round((correctCount / questions.length) * 100),
      timestamp: new Date().toISOString(),
      timeTakenSeconds: 0,
      completed: true,
      questionsJson: JSON.stringify(questions),
      wordScores: scoreArray.map(s => s === -1 ? "-" : s) as any 
    };

    await mockDb.saveResult(result);
    navigate('/telugu');
  };

  if (!stage) return <div className="p-20 text-center font-black text-rose-500 uppercase tracking-widest">Assessment Not Found</div>;

  const activeWords = [...questions.slice(0, currentIndex + 1)].reverse();

  return (
    <div className="relative max-w-6xl mx-auto pb-40 min-h-[90vh] flex flex-col">
      
      {/* Global Header */}
      <div className="fixed top-0 left-0 right-0 z-[100] md:left-64 bg-white/95 backdrop-blur-2xl border-b border-slate-200 shadow-lg px-6 md:px-12 py-6 flex items-center justify-between">
         <div className="flex items-center gap-4 md:gap-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner shrink-0">
               <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="hidden sm:block">
               <p className="text-lg md:text-xl font-black text-slate-800 tracking-tight">{user?.fullName}</p>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {user?.username}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4 md:gap-8">
            <div className="text-right">
               <h3 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">{stage.name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{gapString} Cycle • Set {testId}</p>
            </div>
            <button 
              onClick={() => {
                window.speechSynthesis.cancel();
                navigate('/telugu');
              }}
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 transition-all hover:bg-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="pt-32 flex-1 flex flex-col">
        {!isReviewMode ? (
          currentIndex === -1 ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in zoom-in-95 duration-700">
               <div className="relative">
                  <div className="absolute inset-0 bg-indigo-600 blur-3xl opacity-20 animate-pulse"></div>
                  <div className="bg-white p-12 md:p-20 rounded-[80px] border border-slate-100 shadow-2xl relative z-10 text-center max-w-xl">
                    <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-inner">
                      <Sparkles className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none mb-6">Ready to Listen?</h2>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed">
                      Words will be announced every <span className="text-indigo-600">{gapString}</span>. Latest words will appear at the <span className="text-indigo-600">top</span>.
                    </p>
                  </div>
               </div>

               <button 
                 onClick={startSession}
                 className="group relative flex items-center gap-4 px-16 py-8 bg-indigo-600 text-white rounded-[40px] font-black text-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
               >
                 <Play className="w-8 h-8 fill-current" /> Start Dictation
               </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-10 animate-in fade-in duration-500">
              {/* Dictation feed with latest at top */}
              <div className="flex-1 max-h-[65vh] overflow-y-auto space-y-6 px-4 py-6 dictation-feed">
                {activeWords.map((q, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div 
                      key={q.id}
                      className={`bg-white p-8 md:p-10 rounded-[40px] border transition-all duration-700 transform ${isLatest ? 'scale-105 shadow-2xl border-indigo-400 border-2 bg-white ring-8 ring-indigo-50' : 'opacity-40 scale-95 border-slate-100'}`}
                    >
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[24px] flex items-center justify-center font-black text-xl md:text-2xl shadow-inner border ${isLatest ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {q.questionNum}
                          </div>
                          <div className="space-y-2 text-center md:text-left">
                            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">
                              {q.text}
                            </p>
                            <span className="inline-flex px-4 py-1 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Registry Entry #{q.questionNum}
                            </span>
                          </div>
                        </div>
                        
                        {isLatest && (
                          <div className="flex items-center gap-6">
                             {/* Individual Word Timer Display */}
                             <div className="flex flex-col items-center gap-2">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                   <svg className="absolute inset-0 w-full h-full -rotate-90">
                                      <circle 
                                        cx="32" cy="32" r="28" 
                                        fill="none" stroke="#F1F5F9" strokeWidth="4" 
                                      />
                                      <circle 
                                        cx="32" cy="32" r="28" 
                                        fill="none" 
                                        stroke={timeLeftInGap <= 2 ? "#F59E0B" : "#4F46E5"} 
                                        strokeWidth="4" 
                                        strokeDasharray={`${2 * Math.PI * 28}`}
                                        strokeDashoffset={`${(2 * Math.PI * 28) * (1 - timeLeftInGap / gapSeconds)}`}
                                        className="transition-all duration-1000 ease-linear"
                                        strokeLinecap="round"
                                      />
                                   </svg>
                                   <span className={`text-xl font-black ${timeLeftInGap <= 2 ? 'text-amber-600' : 'text-indigo-600'}`}>
                                      {timeLeftInGap}
                                   </span>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Next Word</span>
                             </div>

                             {isSpeaking && (
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-6 bg-indigo-200 rounded-full animate-bounce"></div>
                                  <div className="w-1.5 h-10 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
                                  <Volume2 className="w-6 h-6 text-indigo-600 ml-2 animate-pulse" />
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Footer */}
              <div className="bg-white p-8 rounded-[48px] border border-slate-200 shadow-2xl">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 w-full space-y-4">
                       <div className="flex justify-between items-end px-2">
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                             <Timer className="w-5 h-5 text-indigo-600" />
                             Next Word In: <span className={timeLeftInGap <= 2 ? "text-amber-600" : "text-indigo-600"}>{timeLeftInGap}s</span>
                          </h4>
                          <span className="text-indigo-600 font-black text-xl">{currentIndex + 1} / {questions.length}</span>
                       </div>
                       <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-indigo-600 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                          />
                       </div>
                    </div>

                    <div className="flex gap-4 shrink-0">
                       <button 
                         onClick={() => {
                           if (isAutoRunning) {
                             setIsAutoRunning(false);
                           } else {
                             setIsAutoRunning(true);
                             if (currentIndex === -1) {
                               setCurrentIndex(0);
                               setTimeLeftInGap(gapSeconds);
                             }
                           }
                         }}
                         className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all ${isAutoRunning ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700'}`}
                       >
                         {isAutoRunning ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                       </button>
                       <button 
                         onClick={() => {
                           if (currentIndex < questions.length - 1) {
                             setCurrentIndex(prev => prev + 1);
                             setTimeLeftInGap(gapSeconds);
                           } else {
                             handleSessionCompletion();
                           }
                         }}
                         className="w-16 h-16 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 rounded-[24px] flex items-center justify-center transition-all"
                       >
                         <SkipForward className="w-7 h-7 fill-current" />
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          )
        ) : (
          /* VALIDATION VIEW */
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="text-center space-y-4">
               <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Correction Registry</h2>
               <p className="text-slate-500 font-bold text-lg">Verify your entries against the Master Key for this set.</p>
               
               <div className="inline-flex items-center gap-6 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Correct [1]</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-400" /> Error [0]</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /> Null [-]</div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[48px] shadow-sm overflow-hidden flex flex-col h-[70vh]">
               <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
                 <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-4 bg-slate-50/50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                    <div className="col-span-1">#</div>
                    <div className="col-span-3">Prompt (Context)</div>
                    <div className="col-span-5 text-center">Master Key (Telugu)</div>
                    <div className="col-span-3 text-right">Verification Status</div>
                 </div>

                 {questions.map((q, idx) => (
                   <div 
                     key={q.id} 
                     className={`grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-5 md:px-10 rounded-2xl border transition-all ${wordResults[idx] === "1" ? 'bg-emerald-50/30 border-emerald-100' : wordResults[idx] === "0" ? 'bg-rose-50/30 border-rose-100' : 'bg-white border-transparent hover:bg-slate-50'}`}
                   >
                      <div className="col-span-1 flex items-center">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${wordResults[idx] === "1" ? 'bg-emerald-500 text-white' : wordResults[idx] === "0" ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {idx + 1}
                         </div>
                      </div>

                      <div className="col-span-3">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:hidden">Prompt</p>
                         <p className="font-bold text-slate-800 text-sm leading-snug">{q.text}</p>
                      </div>

                      <div className="col-span-5 flex justify-center">
                         <div className="w-full max-w-xs md:max-w-none p-3 bg-white border border-indigo-100 rounded-xl text-center shadow-sm">
                            <span className="text-2xl font-black text-indigo-900">{q.answer}</span>
                         </div>
                      </div>

                      <div className="col-span-3 flex justify-end gap-2">
                          {[
                            { val: "1", icon: Check, color: "emerald" },
                            { val: "0", icon: XIcon, color: "rose" },
                            { val: "-", icon: Minus, color: "slate" }
                          ].map(btn => (
                            <button
                              key={btn.val}
                              onClick={() => setScore(idx, btn.val)}
                              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${wordResults[idx] === btn.val ? `bg-${btn.color}-600 text-white shadow-lg` : 'bg-white border border-slate-200 text-slate-300 hover:border-slate-400'}`}
                            >
                               <btn.icon className="w-5 h-5" />
                            </button>
                          ))}
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-10">
               <button 
                 onClick={saveAssessment}
                 disabled={isSubmitting || Object.keys(wordResults).length < questions.length}
                 className="px-20 py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50 text-xl uppercase tracking-widest"
               >
                 {isSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />} Archive Results
               </button>
               {Object.keys(wordResults).length < questions.length && (
                 <p className="text-rose-500 font-bold flex items-center gap-2 animate-pulse uppercase tracking-widest text-xs">
                   <AlertCircle className="w-4 h-4" /> Please verify all {questions.length} items to proceed.
                 </p>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
