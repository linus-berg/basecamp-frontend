import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectApi, dataflowApi } from '../api';
import type { Project, Dataflow, ProjectMetadata } from '../types';
import { PlusIcon, ArrowRightIcon, ChevronLeftIcon, ShieldCheckIcon, TagIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [dataflows, setDataflows] = useState<Dataflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<ProjectMetadata>({ tags: [] });
  const [editingDescription, setEditingDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (projectId) {
      Promise.all([
        projectApi.get(projectId),
        dataflowApi.listByProject(projectId)
      ]).then(([projData, dfData]) => {
        setProject(projData);
        setDataflows(dfData);
        setEditingDescription(projData.description || '');
        if (projData.metadata) {
          try {
            const meta = JSON.parse(projData.metadata);
            setEditingMetadata(meta);
            setTagInput(meta.tags?.join(', ') || '');
          } catch (e) {
            console.error("Failed to parse metadata", e);
          }
        }
        setIsLoading(false);
      });
    }
  }, [projectId]);

  const handleCreateDataflow = async () => {
    const name = prompt('Dataflow Name:');
    const description = prompt('Dataflow Description:');
    if (name && projectId) {
      const newDf = await dataflowApi.create(projectId, { name, description: description || undefined });
      setDataflows([...dataflows, newDf]);
    }
  };

  const saveMetadata = async () => {
    if (!project || !projectId) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
    const updatedMeta = { ...editingMetadata, tags };
    const updatedProject = { 
      ...project, 
      description: editingDescription,
      metadata: JSON.stringify(updatedMeta) 
    };
    
    try {
      await projectApi.update(projectId, updatedProject);
      setProject(updatedProject);
      setEditingMetadata(updatedMeta);
      setIsEditingMetadata(false);
    } catch (err) {
      console.error("Failed to update project", err);
      alert("Failed to save changes.");
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold uppercase tracking-widest text-slate-400">Loading Basecamp...</div>;
  if (!project) return <div className="p-10 text-center">Project not found</div>;

  const metadata: ProjectMetadata = project.metadata ? JSON.parse(project.metadata) : {};

  return (
    <div className="p-6 max-w-6xl mx-auto w-full relative">
      <Link to="/" className="text-[10px] text-slate-400 flex items-center gap-1 mb-4 hover:text-indigo-600 font-black uppercase tracking-[0.2em] transition-colors">
        <ChevronLeftIcon className="w-3 h-3 stroke-[4px]" />
        Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">{project.name}</h1>
            {metadata.securityClassification && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 border ${
                metadata.securityClassification === 'Public' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                metadata.securityClassification === 'Internal' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                metadata.securityClassification === 'Confidential' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-red-50 text-red-700 border-red-100'
              }`}>
                {metadata.securityClassification}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mb-3 truncate max-w-2xl">{project.description || 'No description provided.'}</p>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            {metadata.tags?.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest border border-slate-100">
                {tag}
              </span>
            ))}
            <button 
              onClick={() => setIsEditingMetadata(true)}
              className="p-1 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Edit Project Details"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <button
          onClick={handleCreateDataflow}
          className="shrink-0 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
        >
          <PlusIcon className="w-4 h-4 stroke-[3px]" />
          New Flow
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Dataflows</h2>
        <div className="h-px bg-slate-100 flex-1"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 mb-12">
        {dataflows.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
            <TagIcon className="w-10 h-10 mx-auto mb-3 text-slate-100" />
            <p className="font-bold uppercase tracking-widest text-[10px] text-slate-300">Empty Basecamp</p>
          </div>
        ) : (
          dataflows.map((df) => {
            let dfMeta: ProjectMetadata = {};
            try { if (df.metadata) dfMeta = JSON.parse(df.metadata); } catch(e) {}
            
            return (
              <Link
                key={df.id}
                to={`/dataflow/${df.id}`}
                className="bg-white border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-0.5">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition tracking-tight truncate">
                      {df.name}
                    </h4>
                    {dfMeta.securityClassification && (
                      <span className="text-[8px] font-black text-slate-400 border border-slate-100 px-1 rounded">
                        {dfMeta.securityClassification}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{df.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {dfMeta.tags?.map(tag => (
                      <span key={tag} className="px-1 py-0.5 bg-slate-50 text-[8px] font-bold text-slate-400 uppercase rounded border border-slate-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Metadata Edit Modal */}
      {isEditingMetadata && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Project Configuration</h3>
              <button onClick={() => setIsEditingMetadata(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                  placeholder="What is this project about?"
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Security Level</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  value={editingMetadata.securityClassification || ''}
                  onChange={(e) => setEditingMetadata({ ...editingMetadata, securityClassification: e.target.value as any })}
                >
                  <option value="">UNCATEGORIZED</option>
                  <option value="Public">PUBLIC</option>
                  <option value="Internal">INTERNAL</option>
                  <option value="Confidential">CONFIDENTIAL</option>
                  <option value="Highly Confidential">HIGHLY CONFIDENTIAL</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Metadata Tags</label>
                <input 
                  type="text"
                  placeholder="e.g. Finance, Core, External"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <p className="text-[9px] text-slate-400 mt-1 italic font-medium">Use commas to separate multiple tags</p>
              </div>
              <button 
                onClick={saveMetadata}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-2"
              >
                Update Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
