import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {GoogleGenAI} from "@google/genai";
import { Zap, Play, CheckCircle, MessageSquare, Sparkles, ChevronLeft } from 'lucide-react';

export default function PromptEngineering() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const lessons = [
    { title: 'The Basics of AI', status: 'completed' },
    { title: 'Anatomy of a Prompt', status: 'current' },
    { title: 'Context & Persona', status: 'locked' },
    { title: 'Zero-Shot vs Few-Shot', status: 'locked' }
  ];

  const handleTestPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      // Corrected initialization to strictly follow guidelines: new GoogleGenAI({apiKey: process.env.API_KEY})
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setResponse(res.text || 'No response from model');
    } catch (err) {
      setResponse('Error: Please check if API Key is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Prompt Engineering</h2>
          <p className="text-slate-500">Master the art of communicating with Artificial Intelligence.</p>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Course Progress</h3>
          <div className="space-y-3">
            {lessons.map((lesson, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between ${lesson.status === 'current' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lesson.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {lesson.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className="font-semibold text-slate-800">{lesson.title}</span>
                </div>
                {lesson.status === 'current' && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-orange-400 w-6 h-6" />
              <h3 className="text-xl font-bold">AI Playground</h3>
            </div>
            
            <p className="text-slate-400 mb-6">Apply your prompt engineering skills here. Try giving the AI a persona or specific instructions.</p>
            
            <div className="space-y-4">
              <textarea
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder="Write your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              ></textarea>
              
              <button 
                onClick={handleTestPrompt}
                disabled={loading}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Thinking...' : <><Play className="w-4 h-4 fill-current" /> Execute Prompt</>}
              </button>
            </div>

            {response && (
              <div className="mt-8 pt-8 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">AI Response</span>
                </div>
                <div className="bg-slate-800/50 rounded-2xl p-6 text-slate-200 font-medium">
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}