
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, BarChart3, TrendingUp, Grid3X3, List as ListIcon, 
  Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, 
  Award, Target, Users, BookOpen
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { TELUGU_STAGES } from '../../constants';

export default function TeluguAnalytics() {
  const { user } = useAuth();
  const [levelFilter, setLevelFilter] = useState('stage-1');
  const [gapFilter, setGapFilter] = useState('10s');
  const [viewMode, setViewMode] = useState<'matrix' | 'heatmap'>('matrix');

  const allHistory = useMemo(() => {
    if (!user) return [];
    return mockDb.getResults(user.id).filter(r => r.speedGap !== undefined).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [user]);

  const stats = useMemo(() => {
    if (allHistory.length === 0) return { avg: 0, total: 0 };
    return {
      total: allHistory.length,
      avg: Math.round(allHistory.reduce((acc, r) => acc + r.scorePercentage, 0) / allHistory.length)
    };
  }, [allHistory]);

  const matrixData = useMemo(() => {
    const stageResults = allHistory.filter(r => 
      r.level === levelFilter && 
      (gapFilter === 'all' || r.speedGap === gapFilter)
    ).sort((a, b) => parseInt(a.testId) - parseInt(b.testId));

    if (stageResults.length === 0) return null;

    // We assume 40 words as per requirement
    const rows = Array.from({ length: 40 }).map((_, i) => ({
      wordNum: i + 1,
      scores: stageResults.map(r => ({
        resultId: r.id,
        testId: r.testId,
        score: r.wordScores?.[i] ?? 0
      }))
    }));

    return { stageResults, rows };
  }, [allHistory, levelFilter, gapFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/telugu" className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Performance Matrix</h2>
            <p className="text-slate-500 font-bold mt-2">Word-by-word structural analysis across all stages.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white px-8 py-5 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="flex flex-col items-end">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Accuracy</p>
                 <p className="text-2xl font-black text-slate-800">{stats.avg}%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                 <Target className="w-6 h-6" />
              </div>
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 flex gap-4">
          <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl shadow-inner">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="w-full font-bold text-slate-600 outline-none bg-transparent" 
              value={levelFilter} 
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {TELUGU_STAGES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
            </select>
          </div>
          <div className="w-48 flex items-center gap-3 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl shadow-inner">
            <Clock className="w-4 h-4 text-slate-400" />
            <select 
              className="w-full font-bold text-slate-600 outline-none bg-transparent" 
              value={gapFilter} 
              onChange={(e) => setGapFilter(e.target.value)}
            >
              <option value="all">All Gaps</option>
              <option value="10s">10s Gap</option>
              <option value="8s">8s Gap</option>
              <option value="6s">6s Gap</option>
              <option value="4s">4s Gap</option>
            </select>
          </div>
        </div>
        
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1">
           <button 
             onClick={() => setViewMode('matrix')}
             className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
           >
             Matrix View
           </button>
           <button 
             onClick={() => setViewMode('heatmap')}
             className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'heatmap' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
           >
             Heat Map
           </button>
        </div>
      </div>

      {/* Matrix Layout */}
      <div className="bg-white rounded-[48px] border-2 border-slate-100 shadow-2xl overflow-hidden min-h-[500px]">
        {matrixData ? (
          <div className="overflow-x-auto">
             <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-10 py-10 text-left sticky left-0 bg-slate-50 z-30 min-w-[240px]">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Structural ID</span>
                          <span className="text-xl font-black text-slate-800">WORD INDEX</span>
                       </div>
                    </th>
                    {matrixData.stageResults.map(res => (
                      <th key={res.id} className="px-8 py-10 border-l border-slate-100 min-w-[140px]">
                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{res.speedGap}</span>
                            <span className="text-xl font-black text-slate-800">Set {res.testId}</span>
                         </div>
                      </th>
                    ))}
                    <th className="px-10 py-10 border-l-2 border-slate-200 bg-indigo-50/50 min-w-[200px]">
                       <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Consistency</span>
                          <span className="text-xl font-black text-indigo-900">STABILITY</span>
                       </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.rows.map(row => {
                    const failRate = row.scores.length > 0 ? row.scores.filter(s => s.score === 0).length / row.scores.length : 0;
                    return (
                      <tr key={row.wordNum} className="group border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-6 text-left font-black text-slate-700 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 z-20 transition-colors">
                           <div className="flex items-center gap-4">
                              <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black">#{row.wordNum}</span>
                              <span className="uppercase tracking-tight">Vocabulary Item {row.wordNum}</span>
                           </div>
                        </td>
                        {row.scores.map((s, idx) => (
                          <td key={idx} className="px-8 py-6 border-l border-slate-50">
                             <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all ${s.score === 1 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {s.score === 1 ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                             </div>
                          </td>
                        ))}
                        <td className="px-10 py-6 border-l-2 border-slate-200 bg-white group-hover:bg-indigo-50/30 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                 <div 
                                   className={`h-full transition-all duration-1000 ${failRate > 0.5 ? 'bg-rose-500' : failRate > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                   style={{ width: `${(1 - failRate) * 100}%` }}
                                 />
                              </div>
                              <span className={`text-xs font-black min-w-[40px] text-right ${failRate > 0.5 ? 'text-rose-600' : 'text-slate-600'}`}>
                                 {Math.round((1 - failRate) * 100)}%
                              </span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
          </div>
        ) : (
          <div className="py-40 text-center space-y-8">
             <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <BarChart3 className="w-12 h-12" />
             </div>
             <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Insufficient Data Stream</h3>
             <p className="text-slate-400 font-bold max-w-sm mx-auto">Please complete at least one assessment in this stage/gap to populate the matrix.</p>
          </div>
        )}
      </div>

      {matrixData && (
        <div className="bg-slate-900 rounded-[56px] p-12 text-white flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
           <div className="flex-1 space-y-6 relative z-10">
              <h4 className="text-4xl font-black tracking-tighter uppercase leading-none">Architectural Review</h4>
              <p className="text-slate-400 font-bold text-lg leading-relaxed">
                The matrix above provides a vertical slice of your vocabulary stability. Words with lower percentages in the stability column represent high-value learning targets for your next session.
              </p>
           </div>
           <div className="shrink-0 w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform duration-700">
              <Award className="w-16 h-16 text-emerald-400" />
           </div>
        </div>
      )}
    </div>
  );
}
