
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Video, Image as ImageIcon, Archive, Link as LinkIcon, 
  Download, Upload, Plus, Trash2, Search, Filter, 
  ExternalLink, File, Loader2, Sparkles, FolderOpen, X, Check
} from 'lucide-react';
import { useAuth } from '../App';
import { mockDb } from '../services/mockDb';
import { UserRole, Resource } from '../types';

export default function FreeResources() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  
  // New Resource Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    title: '',
    description: '',
    fileType: 'pdf',
    url: '',
    category: 'General',
    size: ''
  });

  useEffect(() => {
    setResources(mockDb.getResources());
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || r.fileType === filterType;
      return matchesSearch && matchesType;
    });
  }, [resources, searchTerm, filterType]);

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title || !newResource.url) return;
    
    const resource: Resource = {
      id: Math.random().toString(36).substr(2, 9),
      title: newResource.title!,
      description: newResource.description || '',
      fileType: (newResource.fileType as any) || 'pdf',
      url: newResource.url!,
      category: newResource.category || 'General',
      timestamp: new Date().toISOString(),
      size: newResource.size || 'N/A'
    };

    mockDb.saveResource(resource);
    setResources(mockDb.getResources());
    setShowAddModal(false);
    setNewResource({ title: '', description: '', fileType: 'pdf', url: '', category: 'General' });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this resource forever?")) return;
    mockDb.deleteResource(id);
    setResources(mockDb.getResources());
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-rose-500" />;
      case 'video': return <Video className="text-indigo-500" />;
      case 'image': return <ImageIcon className="text-emerald-500" />;
      case 'zip': return <Archive className="text-amber-500" />;
      case 'link': return <LinkIcon className="text-sky-500" />;
      default: return <File className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Curated Knowledge
          </div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-none uppercase">Free Resources</h1>
          <p className="text-xl text-slate-500 font-bold max-w-2xl">
            A growing library of worksheets, guides, and learning materials to supplement your daily practice.
          </p>
        </div>

        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-2xl transition-all active:scale-95 uppercase text-xs tracking-widest"
          >
            <Plus size={18} /> Upload New Material
          </button>
        )}
      </header>

      {/* Control Bar */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search resources..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl shadow-inner">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="font-bold text-slate-600 outline-none bg-transparent uppercase text-xs tracking-widest" 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Formats</option>
            <option value="pdf">Worksheets (PDF)</option>
            <option value="video">Lectures (Video)</option>
            <option value="zip">Practice Sets (ZIP)</option>
            <option value="link">External Tools (URL)</option>
          </select>
        </div>
      </div>

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredResources.map((res) => (
            <div key={res.id} className="group bg-white rounded-[48px] border border-slate-200 p-10 flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                     {getIcon(res.fileType)}
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{res.category}</span>
                     <span className="text-[9px] font-bold text-slate-300 uppercase">{res.size || 'Web Resource'}</span>
                  </div>
               </div>

               <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-4 group-hover:text-indigo-600 transition-colors uppercase truncate">{res.title}</h3>
               <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 flex-1 line-clamp-3">
                 {res.description}
               </p>

               <div className="flex items-center gap-4">
                  <a 
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-900 text-white font-black rounded-3xl hover:bg-black transition-all shadow-xl text-[10px] uppercase tracking-widest active:scale-95"
                  >
                    {res.fileType === 'link' ? <ExternalLink size={14} /> : <Download size={14} />} 
                    {res.fileType === 'link' ? 'Open Link' : 'Download File'}
                  </a>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(res.id)}
                      className="w-14 h-14 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-40 bg-white rounded-[64px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-10">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8">
              <FolderOpen size={48} />
           </div>
           <h3 className="text-3xl font-black text-slate-300 uppercase tracking-tighter">Vault Empty</h3>
           <p className="text-slate-400 font-bold text-lg max-w-sm mt-4 leading-relaxed">
             No resources match your search or filters. Check back soon for fresh learning material!
           </p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
           <div className="relative bg-white w-full max-w-2xl rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <header className="p-10 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                       <Upload size={24} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Upload Resource</h2>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Management</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
              </header>

              <form onSubmit={handleAddResource} className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-full space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title of Material</label>
                       <input 
                         required
                         type="text"
                         value={newResource.title}
                         onChange={e => setNewResource({...newResource, title: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                         placeholder="e.g. Stage 5 Practice Sheet"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Format</label>
                       <select 
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                         value={newResource.fileType}
                         onChange={e => setNewResource({...newResource, fileType: e.target.value as any})}
                       >
                          <option value="pdf">Worksheet (PDF)</option>
                          <option value="video">Lecture (Video)</option>
                          <option value="image">Poster (Image)</option>
                          <option value="zip">Bundle (ZIP)</option>
                          <option value="link">Reference (Link)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Size / Ext</label>
                       <input 
                         type="text"
                         value={newResource.size}
                         onChange={e => setNewResource({...newResource, size: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                         placeholder="e.g. 2.4 MB"
                       />
                    </div>
                    <div className="col-span-full space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">File or Destination URL</label>
                       <div className="relative">
                          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input 
                             required
                             type="text"
                             value={newResource.url}
                             onChange={e => setNewResource({...newResource, url: e.target.value})}
                             className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all"
                             placeholder="https://..."
                          />
                       </div>
                    </div>
                    <div className="col-span-full space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Summary Description</label>
                       <textarea 
                         rows={3}
                         value={newResource.description}
                         onChange={e => setNewResource({...newResource, description: e.target.value})}
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all resize-none"
                         placeholder="Describe the learning outcomes..."
                       />
                    </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-6 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-95"
                 >
                    <Check size={20} /> Deploy to Vault
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
