import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, BarChart3, ChevronLeft, RotateCcw, AlertCircle } from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { MATH_LEVELS } from '../../constants';

// Fixed duplicate RotateCcw identifier error by removing the redundant import at the end of the file
export default function ResultsReview() {
  const { resultId } = useParams();
  const result = mockDb.getResults().find(r => r.id === resultId);

  if (!result) return <div className="p-8 text-center font-black text-rose-500 uppercase tracking-widest">Result not found.</div>;

  const questions = JSON.parse(result.questionsJson);
  const level = MATH_LEVELS.find(l => l.id === result.level);
  const isPassed = result.scorePercentage >= (level?.passRequirement || 90);

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 animate-in fade-in duration-700">
      <div className={`rounded-[50px] p-12 text-center space-y-8 border-b-[16px] shadow-2xl ${isPassed ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-200/20' : 'bg-rose-50 text-rose-900 border-rose-200 shadow-rose-200/20'}`}>
        <div className="flex justify-center">
          <div className={`p-6 rounded-[40px] ${isPassed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-xl`}>
            {isPassed ? <CheckCircle2 className="w-24 h-24" /> : <XCircle className="w-24 h-24" />}
          </div>
        </div>
        <div>
          <h2 className="text-[52px] font-black tracking-tighter leading-none">{isPassed ? 'Test Passed!' : 'Requires Improvement'}</h2>
          <p className="text-2xl mt-4 font-bold opacity-70">
            {level?.name} • Test {result.testId} • {result.duration}m Duration
          </p>
          {!isPassed && (
            <div className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-rose-200/50 rounded-full text-sm font-black uppercase tracking-widest text-rose-700">
              <AlertCircle className="w-4 h-4" /> Pass Requirement: {level?.passRequirement || 90}%
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8">
          <div className="bg-white/80 p-8 rounded-[36px] backdrop-blur-sm border border-white shadow-sm">
            <p className="text-[11px] uppercase font-black opacity-40 tracking-[0.2em] mb-2">Final Score</p>
            <p className="text-[44px] font-black tracking-tighter">{result.scorePercentage}%</p>
          </div>
          <div className="bg-white/80 p-8 rounded-[36px] backdrop-blur-sm border border-white shadow-sm">
            <p className="text-[11px] uppercase font-black opacity-40 tracking-[0.2em] mb-2">Accuracy</p>
            <p className="text-[44px] font-black tracking-tighter">{result.correctAnswers}/{result.totalQuestions}</p>
          </div>
          <div className="bg-white/80 p-8 rounded-[36px] backdrop-blur-sm border border-white shadow-sm">
            <p className="text-[11px] uppercase font-black opacity-40 tracking-[0.2em] mb-2">Time Taken</p>
            <p className="text-[44px] font-black tracking-tighter">
              {Math.floor(result.timeTakenSeconds / 60)}m {result.timeTakenSeconds % 60}s
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <div className="flex items-center justify-between px-4">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Question Analysis</h3>
            <p className="text-slate-500 font-bold">Review individual responses and correct mistakes.</p>
          </div>
          <div className="flex gap-4">
            <Link to={`/math/test/${result.level}`} className="flex items-center gap-2 px-8 py-4 bg-[#1E293B] text-white rounded-[20px] font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-sm">
              <RotateCcw className="w-4 h-4" /> Try Again
            </Link>
            <Link to="/math" className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-[20px] font-black hover:bg-slate-50 transition-all shadow-sm text-sm">
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q: any, idx: number) => {
            const isCorrect = q.userAnswer.trim() === q.answer.trim();
            return (
              <div key={idx} className={`bg-white p-8 rounded-[40px] border-2 transition-all flex flex-col md:flex-row items-center gap-8 ${isCorrect ? 'border-emerald-100 shadow-sm hover:shadow-emerald-200/20' : 'border-rose-100 shadow-sm hover:shadow-rose-200/20'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                  {isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Question {q.questionNum}{q.subQuestion && ` • ${q.subQuestion.toUpperCase()}`}</span>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter leading-tight">{q.text}</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-32 text-center space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Input</span>
                    <div className={`py-4 rounded-2xl font-black text-xl shadow-inner border ${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      {q.userAnswer || 'EMPTY'}
                    </div>
                  </div>
                  {!isCorrect && (
                    <div className="flex-1 md:w-32 text-center space-y-1">
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Master Key</span>
                      <div className="bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-emerald-200 border border-emerald-400">
                        {q.answer}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
