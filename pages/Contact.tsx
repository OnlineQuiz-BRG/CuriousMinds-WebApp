
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, ShieldCheck, ExternalLink, Headset, Loader2, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../App';

const WhatsAppIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Contact() {
  const { config } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) return;
    
    if (!config.googleSheetsUrl) {
      setError('Relay service not configured in Admin panel.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Create the payload
      const payload = {
        action: 'contactEmail',
        senderName: formData.fullName,
        senderEmail: formData.email,
        messageBody: formData.message,
        timestamp: new Date().toISOString()
      };

      // 1. Dispatch to Google Apps Script Webhook
      // CRITICAL: We use 'text/plain' as Content-Type for 'no-cors' requests.
      // This prevents the browser from triggering a CORS preflight that Google Scripts 
      // often reject. The script will parse the text contents as JSON.
      await fetch(config.googleSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      // 2. Archive to Supabase (Database Log) for redundancy
      if (isSupabaseConfigured) {
        await supabase.from('contact_messages').insert([
          { 
            full_name: formData.fullName, 
            email: formData.email, 
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ]);
      }

      setSuccess(true);
      setFormData({ fullName: '', email: '', message: '' });
      
      // Auto hide success message
      setTimeout(() => setSuccess(false), 8000);
    } catch (err: any) {
      console.error("Transmission error:", err);
      setError('Dispatch failed. Please check your internet or use WhatsApp support.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    { 
      id: 'email', 
      label: 'Email Support', 
      value: 'srcuriousminds@gmail.com', 
      icon: Mail, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      link: 'mailto:srcuriousminds@gmail.com'
    },
    { 
      id: 'phone', 
      label: 'Direct Contact', 
      value: '9966231927', 
      icon: Phone, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      link: 'tel:9966231927'
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp Support', 
      value: 'Instant Chat', 
      icon: WhatsAppIcon, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      link: 'https://wa.me/919966231927'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Dynamic Success Notification */}
      {success && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 w-full max-w-lg px-4">
          <div className="flex flex-col gap-2 p-6 bg-[#4F46E5] text-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] border border-indigo-400">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-400" />
              <div className="flex-1">
                <p className="font-black text-sm uppercase tracking-widest leading-none mb-1">Message Dispatched!</p>
                <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Sent to: srcuriousminds@gmail.com</p>
              </div>
              <button onClick={() => setSuccess(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 w-full max-w-lg px-4">
          <div className="flex flex-col gap-2 p-6 bg-rose-600 text-white rounded-[32px] shadow-2xl border border-rose-500">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <p className="font-black text-sm uppercase tracking-widest leading-none flex-1">{error}</p>
              <button onClick={() => setError('')} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest mx-auto">
          <Headset className="w-3.5 h-3.5" /> Support Desk
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter uppercase leading-none">Get in Touch</h1>
        <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto">
          Our dedicated team is here to help you with your learning journey.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {contactInfo.map((info) => (
          <a 
            key={info.id} 
            href={info.link}
            target={info.id === 'whatsapp' ? '_blank' : undefined}
            rel={info.id === 'whatsapp' ? 'noopener noreferrer' : undefined}
            className="group bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center text-center overflow-hidden relative"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 ${info.bg} opacity-30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform`}></div>
            <div className={`w-20 h-20 ${info.bg} ${info.color} rounded-[32px] flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform`}>
              <info.icon className="w-10 h-10" />
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{info.label}</h3>
            <p className="text-2xl font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{info.value}</p>
            
            <div className="mt-8 flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
               Connect Now <ExternalLink size={12} />
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 bg-white p-12 rounded-[64px] border border-slate-200 shadow-sm relative">
           <form onSubmit={handleDispatch} className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                  <MessageCircle className="w-8 h-8 text-indigo-500" /> Send a Message
                </h2>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Relay: Active</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner" 
                      placeholder="Enter your name" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner" 
                      placeholder="email@domain.com" 
                    />
                 </div>
                 <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
                    <textarea 
                      required
                      rows={5} 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-slate-700 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none shadow-inner" 
                      placeholder="How can we help you today?"
                    ></textarea>
                 </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-16 py-6 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send size={20} />} 
                  {loading ? 'Transmitting...' : 'Dispatch Message'}
                </button>
                
                <div className="flex flex-col items-center md:items-start">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Cloud Relay</p>
                   <p className="text-[10px] font-bold text-slate-300">Destination: srcuriousminds@gmail.com</p>
                </div>
              </div>
           </form>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 p-10 rounded-[56px] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Clock size={14} /> Response Time
              </h3>
              <p className="text-xl font-black leading-tight mb-4">Expect a reply within 24 business hours.</p>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">Support is active Monday through Friday, 9:00 AM to 6:00 PM.</p>
              
              <a 
                href="https://wa.me/919966231927" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
              >
                <WhatsAppIcon size={14} /> Direct WhatsApp
              </a>
           </div>

           <div className="bg-emerald-50 p-10 rounded-[56px] border border-emerald-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                 <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-black text-emerald-900 uppercase leading-tight mb-2">Secure Message</h3>
              <p className="text-emerald-700 font-bold text-sm text-center">Data is transmitted via encrypted cloud relay directly to our administrators.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
