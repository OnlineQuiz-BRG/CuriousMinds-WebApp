
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Send, ChevronLeft, Loader2, Sparkles, CheckCircle2, RotateCcw, Settings2 } from 'lucide-react';
import { MATH_LEVELS } from '../../constants';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { TestResult, Question, SystemConfig } from '../../types';

export default function TestExecution({ config }: { config: SystemConfig }) {
  const { levelId } = useParams();
  const [searchParams] = useSearchParams();
  const customDurationParam = searchParams.get('customDuration');
  const { user } = useAuth();
  const navigate = useNavigate();
  const level = MATH_LEVELS.find(l => l.id.toLowerCase() === levelId?.toLowerCase());

  const [isLoading, setIsLoading] = useState(true);
  const [timerSelected, setTimerSelected] = useState<number | null>(customDurationParam ? parseInt(customDurationParam) : null);
  const [testNumber, setTestNumber] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableTests, setAvailableTests] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('15');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      if (levelId) {
        let allQ = await mockDb.getQuestions(levelId);
        if (allQ.length === 0) {
          await mockDb.syncFromSupabase(); 
          allQ = await mockDb.getQuestions(levelId);
        }
        const uniqueTests = Array.from(new Set(allQ.map(q => q.testId)));
        setAvailableTests(uniqueTests.sort((a, b) => parseInt(a) - parseInt(b)));
      }
      setIsLoading(false);
    };
    initialize();
  }, [levelId]);

  const userResults = useMemo(() => {
    return user ? mockDb.getResults(user.id).filter(r => r.level.toLowerCase() === levelId?.toLowerCase()) : [];
  }, [user, levelId]);

  useEffect(() => {
    if (!level || testNumber === null) return;
    
    mockDb.getQuestions(level.id).then(qs => {
      const imported = qs.filter(q => 
        q.testId === testNumber.toString()
      ).sort((a, b) => {
        if (a.questionNum !== b.questionNum) return a.questionNum - b.questionNum;
        return (a.subQuestion || '').localeCompare(b.subQuestion || '');
      });
      setQuestions(imported);
    });
  }, [level, testNumber]);

  const handleSubmit = useCallback(async () => {
    if (!level || !user || isSubmitting || testNumber === null) return;
    setIsSubmitting(true);

    let correctCount = 0;
    const reviewData = questions.map(q => ({
      ...q,
      userAnswer: answers[q.id] || ''
    }));

    const hasSubQuestions = questions.some(q => q.subQuestion && q.subQuestion !== '');

    if (hasSubQuestions) {
      const uniqueQNums = Array.from(new Set(questions.map(q => q.questionNum)));
      uniqueQNums.forEach(qNum => {
        const subs = questions.filter(q => q.questionNum === qNum);
        const allCorrect = subs.every(s => answers[s.id]?.trim() === s.answer.trim());
        if (allCorrect) correctCount++;
      });
    } else {
      correctCount = questions.filter(q => answers[q.id]?.trim() === q.answer.trim()).length;
    }

    const totalCalculated = hasSubQuestions ? (questions.length / 3) : questions.length;
    const percentage = (correctCount / totalCalculated) * 100;

    const result: TestResult = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      level: level.id.toLowerCase(),
      testId: testNumber.toString(),
      duration: timerSelected || 0,
      correctAnswers: correctCount,
      totalQuestions: totalCalculated,
      scorePercentage: Math.round(percentage),
      timestamp: new Date().toISOString(),
      timeTakenSeconds: (timerSelected || 0) * 60 - timeLeft,
      completed: true,
      questionsJson: JSON.stringify(reviewData)
    };

    await mockDb.saveResult(result);
    navigate(`/math/results/${result.id}`);
  }, [level, user, questions, answers, timeLeft, timerSelected, navigate, isSubmitting, testNumber]);

  useEffect(() => {
    if (timerSelected === null || testNumber === null || timeLeft <= 0) {
      if (timeLeft === 0 && timerSelected !== null && testNumber !== null) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timerSelected, testNumber, timeLeft, handleSubmit]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-slate-400">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="font-black uppercase tracking-widest text-sm">Preparing Mathematical Interface...</p>
      </div>
    );
  }

  if (!level) return <div className="p-10 text-center font-black text-rose-500 uppercase tracking-widest">Level not found.</div>;

  if (timerSelected === null) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/math')} className="p-5 bg-white border border-slate-200 rounded-[28px] text-slate-500 transition-all hover:bg-slate-50 shadow-sm active:scale-95">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div>
            <h2 className="text-[42px] font-black text-slate-800 tracking-tighter leading-none">{level.name} Mode</h2>
            <p className="text-slate-500 font-bold text-xl mt-2 tracking-tight">Choose your calculation sprint.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[10, 8, 6, 4].map(min => (
            <button
              key={min}
              onClick={() => setTimerSelected(min)}
              className="flex flex-col items-center gap-8 p-14 bg-white border border-slate-200 rounded-[50px] hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-2 transition-all group active:scale-[0.98]"
            >
              <div className="p-8 bg-indigo-50 rounded-[32px] group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <Clock className="w-12 h-12" />
              </div>
              <span className="text-[32px] font-black text-slate-800 tracking-tighter">{min} Minutes</span>
            </button>
          ))}
          
          <div className="flex flex-col items-center gap-8 p-14 bg-white border border-slate-200 rounded-[50px] hover:border-indigo-500 transition-all group shadow-sm relative overflow-hidden">
             {!showCustomInput ? (
               <button onClick={() => setShowCustomInput(true)} className="flex flex-col items-center gap-8 h-full w-full">
                  <div className="p-8 bg-slate-50 rounded-[32px] group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner text-slate-400">
                    <Settings2 className="w-12 h-12" />
                  </div>
                  <span className="text-[32px] font-black text-slate-400 tracking-tighter group-hover:text-slate-900 transition-colors uppercase">Custom</span>
               </button>
             ) : (
               <div className="flex flex-col items-center gap-6 w-full animate-in zoom-in-95 duration-300">
                  <div className="w-full space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specify Duration</label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="1"
                        max="120"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[28px] font-black text-4xl text-center text-indigo-600 focus:outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl pointer-events-none">MIN</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTimerSelected(parseInt(customMinutes) || 15)}
                    className="w-full py-6 bg-slate-900 text-white font-black rounded-[24px] uppercase tracking-widest shadow-xl hover:bg-black transition-all"
                  >
                    Start Sprint
                  </button>
                  <button onClick={() => setShowCustomInput(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (testNumber === null) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setTimerSelected(null)} className="p-5 bg-white border border-slate-200 rounded-[28px] text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <ChevronLeft className="w-7 h-7" />
            </button>
            <div>
              <h2 className="text-[42px] font-black text-slate-800 tracking-tighter leading-none">Select Test</h2>
              <p className="text-slate-500 font-bold text-xl mt-2">{level.name} • {timerSelected}m Challenge</p>
            </div>
          </div>
          <div className="bg-[#00A36C] text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-emerald-500/30 border border-emerald-400">
            {availableTests.length} TESTS FOUND
          </div>
        </div>

        {availableTests.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-6">
            {availableTests.map((tId) => {
              const res = userResults.find(r => r.testId === tId && r.duration === timerSelected);
              const isPassed = res && res.scorePercentage >= level.passRequirement;

              return (
                <button
                  key={tId}
                  onClick={() => { setTestNumber(parseInt(tId)); setTimeLeft(timerSelected * 60); }}
                  className={`relative h-24 rounded-[32px] font-black text-2xl transition-all border-2 flex items-center justify-center group shadow-sm active:scale-90 ${
                    isPassed 
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100' 
                      : res 
                        ? 'bg-rose-50 border-rose-400 text-rose-800 hover:bg-rose-100'
                        : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-lg'
                  }`}
                >
                  {tId}
                  {res && (
                    <div className={`absolute -top-1 -right-1 w-7 h-7 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4 text-white" /> : <RotateCcw className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/40 backdrop-blur-[2px] rounded-[32px]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                      {res ? 'Re-take' : 'Start'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-40 text-center bg-white rounded-[60px] border-4 border-dashed border-slate-100 shadow-inner">
            <h3 className="text-[28px] font-black text-slate-300 uppercase tracking-widest leading-none">Bank Currently Empty</h3>
            <p className="text-slate-400 mt-6 font-bold text-lg max-w-sm mx-auto">Assessments haven't been generated for this level yet.</p>
          </div>
        )}
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <div className="sticky top-[-1.5rem] md:top-[-2rem] z-[100] bg-white -mt-6 md:-mt-8 -mx-6 md:-mx-8 px-6 md:px-12 py-6 border-b border-slate-200 flex items-center justify-between shadow-lg mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => setTestNumber(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all active:scale-95 border border-slate-200">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">{level.name} • Test {testNumber}</h3>
            <div className={`inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${timeLeft < 60 ? 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
              <Clock className="w-3.5 h-3.5" /> TIME LEFT: {formatTime(timeLeft)}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-indigo-600 text-white font-black rounded-[20px] md:rounded-[24px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-[10px] md:text-xs uppercase tracking-[0.15em]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Submit Assessment
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
        {questions.map((q) => (
          <div key={q.id} className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group border-b-[8px] md:border-b-[12px] border-b-slate-100 flex items-center justify-between gap-8">
            <div className="flex-1 space-y-4">
              <span className="text-[9px] md:text-[10px] font-black text-indigo-700 uppercase tracking-[0.25em] bg-[#EEF2FF] px-4 md:px-5 py-1.5 md:py-2 rounded-full shadow-inner border border-indigo-100">
                Question {q.questionNum}{q.subQuestion && ` - ${q.subQuestion.toUpperCase()}`}
              </span>
              <p className="text-2xl md:text-[32px] font-black text-slate-700 tracking-tighter leading-tight">
                {q.text}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="text"
                inputMode="numeric"
                className="w-24 md:w-32 px-4 md:px-6 py-4 md:py-6 border-2 border-slate-100 rounded-[20px] md:rounded-[28px] focus:ring-[12px] focus:ring-indigo-500/5 outline-none text-center font-black text-2xl md:text-4xl shadow-inner bg-slate-50 transition-all focus:border-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-200"
                placeholder="..."
                value={answers[q.id] || ''}
                autoComplete="off"
                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              />
              <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-300 opacity-20 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
