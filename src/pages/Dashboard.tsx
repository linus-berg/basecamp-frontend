import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi } from '../api';
import type { Project, ProjectMetadata } from '../types';
import { PlusIcon, FolderIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    projectApi.list().then(data => {
      setProjects(data);
      setIsLoading(false);
    });
  }, []);

  const handleCreateProject = async () => {
    const name = prompt('Project Name:');
    const description = prompt('Project Description:');
    if (name) {
      const newProject = await projectApi.create({ name, description: description || undefined });
      setProjects([...projects, newProject]);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
        <button
          onClick={handleCreateProject}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          let metadata: ProjectMetadata = {};
          try {
            if (project.metadata) metadata = JSON.parse(project.metadata);
          } catch (e) {
            console.error("Failed to parse metadata", e);
          }

          return (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition">
                  <FolderIcon className="w-6 h-6" />
                </div>
                {metadata.securityClassification && (
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 border ${
                    metadata.securityClassification === 'Public' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    metadata.securityClassification === 'Internal' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    metadata.securityClassification === 'Confidential' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    <ShieldCheckIcon className="w-3 h-3" />
                    {metadata.securityClassification}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition tracking-tight">{project.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                {project.description || 'No description provided.'}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                {metadata.tags && metadata.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[9px] font-bold uppercase tracking-widest border border-gray-100">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex justify-between items-center">
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">Details →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
