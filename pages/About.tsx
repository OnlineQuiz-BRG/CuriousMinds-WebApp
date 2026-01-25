
import React from 'react';
// Fixed missing 'Link' import from react-router-dom
import { Link } from 'react-router-dom';
import { Rocket, Target, Brain, Languages, GraduationCap, Users, Sparkles, BookOpen, CheckCircle2 } from 'lucide-react';

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

export default function About() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Hero Section */}
      <header className="relative py-12 px-10 md:px-16 rounded-[60px] bg-white border border-slate-200 shadow-sm overflow-hidden text-center md:text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Igniting Minds
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter leading-[1.1] uppercase">
              About <span className="text-indigo-600">Curious Minds</span> 🤔
            </h1>
            <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-2xl">
              Your dedicated online learning platform designed to ignite a passion for learning in students from Grade 4 to Grade 10!
            </p>
          </div>
          <div className="w-full md:w-1/3 aspect-square rounded-[48px] bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center p-8 relative">
             <img 
               src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800" 
               alt="Education" 
               className="w-full h-full object-cover rounded-[32px] shadow-2xl"
             />
             <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
                <p className="font-black text-slate-800 text-sm leading-tight">CBSE • ICSE • STATE</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Standards</p>
             </div>
          </div>
        </div>
      </header>

      {/* Vision Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-indigo-900 p-12 rounded-[56px] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
           <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center">
                 <Rocket className="w-8 h-8 text-indigo-300" />
              </div>
              <h2 className="text-4xl font-black tracking-tight uppercase leading-none">Our Vision 🚀</h2>
              <p className="text-xl text-indigo-100 font-medium leading-relaxed">
                To create a learning environment where students build robust foundational knowledge, develop independent learning skills, and truly enjoy the educational journey.
              </p>
           </div>
        </div>

        <div className="bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm flex flex-col justify-center space-y-6">
           <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600">
              <Target className="w-8 h-8" />
           </div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Bridging the Gaps, Building Confidence</h2>
           <p className="text-lg text-slate-500 font-bold leading-relaxed">
              At Curious Minds, we understand that strong fundamentals are the bedrock of academic success. Our programs are meticulously crafted to identify and bridge any gaps in a student's understanding.
           </p>
           <div className="flex flex-wrap gap-3">
              {['No Rote Memorization', 'Conceptual Clarity', 'Confidence Building'].map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                   {tag}
                </span>
              ))}
           </div>
        </div>
      </section>

      {/* Core Philosophy */}
      <section className="bg-slate-900 rounded-[64px] p-12 md:p-20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Philosophy
             </div>
             <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none uppercase">
                The Power of Self-Learning & Daily Practice 💪
             </h2>
             <p className="text-xl text-slate-400 font-medium leading-relaxed">
                We believe in fostering self-reliance. Our unique approach emphasizes consistent daily practice with minimal teacher intervention. This empowers students to take ownership of their learning and develop problem-solving skills.
             </p>
             <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
                   <p className="text-2xl font-black text-indigo-400">Self-Reliance</p>
                   <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Core Value</p>
                </div>
                <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
                   <p className="text-2xl font-black text-emerald-400">Ownership</p>
                   <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-widest">Student Outcome</p>
                </div>
             </div>
          </div>
          <div className="w-full lg:w-2/5 aspect-[4/5] rounded-[56px] overflow-hidden shadow-2xl relative border-8 border-white/5">
             <img 
               src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800" 
               alt="Student working" 
               className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
             <div className="absolute bottom-10 left-10 right-10">
                <p className="text-3xl font-black leading-none">Imagine your child becoming a self-directed learner!</p>
             </div>
          </div>
        </div>
      </section>

      {/* Signature Programs */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Our Signature Programs</h2>
          <div className="w-24 h-1.5 bg-indigo-600 rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="group bg-white p-12 rounded-[56px] border-2 border-slate-100 hover:border-indigo-500 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Brain className="w-10 h-10" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 uppercase leading-tight mb-6">Maths Foundation & Mental Calculation Mastery 🧠</h3>
             <p className="text-slate-500 font-bold leading-relaxed text-lg">
                Our comprehensive Maths program goes beyond textbooks, focusing on building a rock-solid foundation. We integrate engaging techniques to enhance mental calculation abilities, making numbers fun and accessible.
             </p>
             <ul className="mt-8 space-y-3">
                {['Rock-solid foundations', 'Various difficulty levels', 'Personalized pace'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-600 font-black text-xs uppercase tracking-tight">
                     <CheckCircle2 size={16} className="text-indigo-500" /> {item}
                  </li>
                ))}
             </ul>
          </div>

          <div className="group bg-white p-12 rounded-[56px] border-2 border-slate-100 hover:border-emerald-500 shadow-sm hover:shadow-2xl transition-all duration-500">
             <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <AlphabetIcon size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 uppercase leading-tight mb-6">Telugu Vocabulary Building & Language Fluency 🗣️</h3>
             <p className="text-slate-500 font-bold leading-relaxed text-lg">
                Unlock the beauty of the Telugu language with our specially designed vocabulary building program. Through interactive methods, students will expand their vocabulary and gain confidence in using Telugu effectively.
             </p>
             <ul className="mt-8 space-y-3">
                {['Interactive acquisition', 'Improved comprehension', 'Fluent communication'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-600 font-black text-xs uppercase tracking-tight">
                     <CheckCircle2 size={16} className="text-emerald-500" /> {item}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="bg-white p-12 md:p-20 rounded-[64px] border border-slate-200 shadow-sm relative overflow-hidden text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="shrink-0 w-32 h-32 md:w-48 md:h-48 bg-amber-50 rounded-[48px] flex items-center justify-center text-amber-500 shadow-inner">
             <GraduationCap className="w-20 h-20 md:w-32 md:h-32" />
          </div>
          <div className="space-y-6 flex-1">
             <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Backed by Expertise & Experience 🎓</h2>
             <p className="text-xl text-slate-500 font-bold leading-relaxed">
                Curious Minds is built on a strong foundation of research and extensive educational experience. Our team comprises highly qualified professionals with over <span className="text-indigo-600">15 years of teaching experience</span>, bringing a wealth of knowledge to every student.
             </p>
             <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <Users className="w-5 h-5 text-indigo-500" />
                   <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">Expert Facilitators</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <BookOpen className="w-5 h-5 text-emerald-500" />
                   <span className="font-black text-[10px] uppercase tracking-widest text-slate-600">Research-led pedagogy</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="text-center space-y-10 py-10">
         <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter uppercase leading-none">Join the Curious Minds Community Today! 🌟</h2>
         <p className="text-2xl text-slate-500 font-bold max-w-3xl mx-auto leading-relaxed">
            Let's embark on a journey of discovery, growth, and academic excellence together. Your child's brighter future starts here.
         </p>
         <div className="flex justify-center pt-6">
            <Link to="/contact" className="px-16 py-8 bg-indigo-600 text-white rounded-[40px] font-black text-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
               Enroll Now
            </Link>
         </div>
      </section>
    </div>
  );
}
