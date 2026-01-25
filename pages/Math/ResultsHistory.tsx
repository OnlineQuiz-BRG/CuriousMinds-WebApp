
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, History, Search, Filter, 
  CheckCircle2, XCircle, Clock, BarChart3, TrendingUp, Sparkles, Brain, Grid3X3, List as ListIcon, AlertCircle, ArrowRight
} from 'lucide-react';
import { mockDb } from '../../services/mockDb';
import { useAuth } from '../../App';
import { MATH_LEVELS } from '../../constants';

export default function ResultsHistory() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('novice'); 
  const [durationFilter, setDurationFilter] = useState('10'); 
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');

  const allHistory = useMemo(() => {
    if (!user) return [];
    return mockDb.getResults(user.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [user]);

  const recentFive = useMemo(() => allHistory.slice(0, 5), [allHistory]);

  const filteredHistory = useMemo(() => {
    let results = [...allHistory];
    if (levelFilter !== 'all') results = results.filter(r => r.level.toLowerCase() === levelFilter.toLowerCase());
    if (durationFilter !== 'all') results = results.filter(r => r.duration === parseInt(durationFilter));
    if (searchTerm) {
      results = results.filter(r => 
        r.testId.includes(searchTerm) || 
        r.level.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return results;
  }, [allHistory, searchTerm, levelFilter, durationFilter]);

  // Data for Heatmap / Analysis Matrix
  const heatmapData = useMemo(() => {
    if (viewMode !== 'heatmap' || levelFilter === 'all') return null;

    const level = MATH_LEVELS.find(l => l.id.toLowerCase() === levelFilter.toLowerCase());
    if (!level) return null;

    // Filter results for this specific level and duration
    const relevantResults = allHistory.filter(r => 
      r.level.toLowerCase() === levelFilter.toLowerCase() && 
      (durationFilter === 'all' || r.duration === parseInt(durationFilter))
    ).sort((a, b) => parseInt(a.testId) - parseInt(b.testId));

    // Get all unique test IDs attempted
    const attemptedTestIds = Array.from(new Set(relevantResults.map(r => r.testId)))
      .sort((a, b) => parseInt(a) - parseInt(b));
    
    const rows: any[] = [];
    const maxQ = level.questionsCount;

    for (let qNum = 1; qNum <= maxQ; qNum++) {
      const qRow: any = { qNum, attempts: {}, failCount: 0, totalAttempts: 0 };
      
      attemptedTestIds.forEach(tId => {
        // Find the most recent result for this specific testId in the filtered set
        const result = relevantResults.find(r => r.testId === tId);
        if (result) {
          const qData = JSON.parse(result.questionsJson || '[]');
          const qItems = qData.filter((q: any) => q.questionNum === qNum);
          
          if (qItems.length > 0) {
            const allCorrect = qItems.every((qi: any) => qi.userAnswer?.trim() === qi.answer?.trim());
            const anyAttempted = qItems.some((qi: any) => qi.userAnswer?.trim() !== '');
            
            qRow.attempts[tId] = {
              correct: allCorrect,
              attempted: anyAttempted,
              resultId: result.id
            };

            if (anyAttempted) {
              qRow.totalAttempts++;
              if (!allCorrect) qRow.failCount++;
            }
          }
        }
      });

      // Calculate failure intensity (0 to 1)
      qRow.failRate = qRow.totalAttempts > 0 ? (qRow.failCount / qRow.totalAttempts) : 0;
      rows.push(qRow);
    }

    return { attemptedTestIds, rows };
  }, [viewMode, levelFilter, durationFilter, allHistory]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/math" className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Performance Records</h2>
            <p className="text-slate-500 font-bold mt-1">Select duration and level for cross-assessment analysis.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex gap-1 shadow-sm">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ListIcon className="w-4 h-4" /> Activity Feed
            </button>
            <button 
              onClick={() => {
                setViewMode('heatmap');
                if (levelFilter === 'all') setLevelFilter('novice');
                if (durationFilter === 'all') setDurationFilter('10');
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'heatmap' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Grid3X3 className="w-4 h-4" /> Mastery Matrix
            </button>
          </div>

          <div className="bg-white px-8 py-4 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-6 hidden sm:flex">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><BarChart3 className="w-5 h-5" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Sprints</p><p className="text-xl font-black text-slate-800 leading-none">{allHistory.length}</p></div>
             </div>
             <div className="w-px h-8 bg-slate-100" />
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Accuracy</p><p className="text-xl font-black text-slate-800 leading-none">{allHistory.length ? Math.round(allHistory.reduce((acc, r) => acc + r.scorePercentage, 0) / allHistory.length) : 0}%</p></div>
             </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by Set ID..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl shadow-inner">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="font-bold text-slate-600 outline-none bg-transparent" 
              value={levelFilter} 
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {viewMode === 'list' && <option value="all">All Levels</option>}
              {MATH_LEVELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl shadow-inner">
            <Clock className="w-4 h-4 text-slate-400" />
            <select 
              className="font-bold text-slate-600 outline-none bg-transparent" 
              value={durationFilter} 
              onChange={(e) => setDurationFilter(e.target.value)}
            >
              {viewMode === 'list' && <option value="all">All Durations</option>}
              <option value="10">10m Sprint</option>
              <option value="8">8m Sprint</option>
              <option value="6">6m Sprint</option>
              <option value="4">4m Sprint</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'list' ? (
        <div className="space-y-12">
           {recentFive.length > 0 && !searchTerm && levelFilter === 'all' && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 ml-2">
                <Sparkles className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Performance DNA</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {recentFive.map((res) => {
                  const level = MATH_LEVELS.find(l => l.id.toLowerCase() === res.level.toLowerCase());
                  const isPass = res.scorePercentage >= (level?.passRequirement || 90);
                  return (
                    <Link to={`/math/results/${res.id}`} key={res.id} className={`p-6 rounded-[32px] border-2 transition-all hover:-translate-y-2 hover:shadow-xl group bg-white ${isPass ? 'border-emerald-100' : 'border-rose-100'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${isPass ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {isPass ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Set {res.testId}</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-sm uppercase truncate mb-1">{level?.name}</h4>
                      <p className="text-2xl font-black text-slate-900 leading-none mb-3">{res.scorePercentage}%</p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {res.duration}m Sprint
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {filteredHistory.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-10 py-5">Level</th>
                    <th className="px-10 py-5">Set ID</th>
                    <th className="px-10 py-5">Duration</th>
                    <th className="px-10 py-5">Score</th>
                    <th className="px-10 py-5">Date</th>
                    <th className="px-10 py-5 text-right">Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map((res) => {
                    const level = MATH_LEVELS.find(l => l.id.toLowerCase() === res.level.toLowerCase());
                    const isPass = res.scorePercentage >= (level?.passRequirement || 90);
                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-10 py-6">
                           <p className="font-black text-slate-800 uppercase tracking-tight">{level?.name}</p>
                        </td>
                        <td className="px-10 py-6 font-bold text-slate-600 text-sm">#{res.testId}</td>
                        <td className="px-10 py-6">
                           <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{res.duration}m</span>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`text-xl font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>{res.scorePercentage}%</span>
                        </td>
                        <td className="px-10 py-6 text-slate-400 text-xs font-bold">
                          {new Date(res.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <Link to={`/math/results/${res.id}`} className="inline-flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-indigo-600 hover:translate-x-1 transition-transform">
                            Full Breakdown <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-32 text-center">
                <History className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No matching records</h3>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 ml-2">
            <Brain className="w-6 h-6 text-indigo-500" />
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Cross-Assessment Mastery Matrix</h3>
          </div>

          <div className="bg-white rounded-[48px] border-2 border-slate-100 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {heatmapData && heatmapData.attemptedTestIds.length > 0 ? (
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                      <th className="px-8 py-8 text-left sticky left-0 bg-slate-50 z-30 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Row Identifier</span>
                          <span className="text-lg font-black text-slate-800">QUESTION #</span>
                        </div>
                      </th>
                      {heatmapData.attemptedTestIds.map(tId => (
                        <th key={tId} className="px-6 py-8 border-l border-slate-100 min-w-[120px]">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Assessment</span>
                            <span className="text-lg font-black text-slate-800">Set {tId}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-10 py-8 border-l-2 border-slate-200 bg-indigo-50/50 min-w-[180px]">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Stability</span>
                          <span className="text-lg font-black text-indigo-900">FAILURE HEAT</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.rows.map((row) => (
                      <tr key={row.qNum} className="group border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-6 text-left font-black text-slate-700 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-20">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs">{row.qNum}</span>
                            <span className="uppercase tracking-tight">Question {row.qNum}</span>
                          </div>
                        </td>
                        {heatmapData.attemptedTestIds.map(tId => {
                          const attempt = row.attempts[tId];
                          return (
                            <td key={tId} className="px-6 py-6 border-l border-slate-50">
                              {attempt ? (
                                <Link 
                                  to={`/math/results/${attempt.resultId}`}
                                  className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-sm ${attempt.correct ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-rose-500 text-white shadow-rose-200'}`}
                                >
                                  {attempt.correct ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                </Link>
                              ) : (
                                <div className="w-10 h-1 rounded-full bg-slate-100 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                        <td className="px-10 py-6 border-l-2 border-slate-200 bg-white group-hover:bg-indigo-50/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full transition-all duration-1000 ${row.failRate > 0.5 ? 'bg-rose-500' : row.failRate > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${row.failRate * 100}%` }}
                              />
                            </div>
                            <span className={`text-sm font-black w-12 ${row.failRate > 0.5 ? 'text-rose-600' : row.failRate > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {Math.round(row.failRate * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-40 text-center space-y-6">
                  <div className="inline-flex p-8 rounded-full bg-indigo-50 text-indigo-400 mb-4 shadow-inner">
                    <AlertCircle className="w-16 h-16" />
                  </div>
                  <h3 className="text-[28px] font-black text-slate-800 uppercase tracking-tighter">Insufficient Data for Matrix</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto">Please attempt at least one sprint for the selected level and duration to generate the analysis heatmap.</p>
                </div>
              )}
            </div>
          </div>

          {heatmapData && heatmapData.attemptedTestIds.length > 0 && (
            <div className="bg-slate-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="flex-1 space-y-4">
                <h4 className="text-2xl font-black tracking-tight uppercase">How to read this analysis?</h4>
                <p className="text-slate-400 font-medium leading-relaxed">
                  The <span className="text-rose-400 font-black">FAILURE HEAT</span> column on the right highlights the specific question numbers where you have the lowest success rate. 
                  Questions with a high percentage indicate areas for focused practice. Click on any green or red icon to review that specific attempt's full breakdown.
                </p>
              </div>
              <div className="shrink-0 w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
