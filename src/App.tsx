import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import DataflowEditor from './pages/DataflowEditor';
import { MountainIcon } from 'lucide-react';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <Link to="/" className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <MountainIcon className="w-6 h-6" />
            </div>
            Basecamp
          </Link>
          <nav className="flex gap-8">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">Projects</Link>
          </nav>
        </header>

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:projectId" element={<ProjectDetails />} />
            <Route path="/dataflow/:dataflowId" element={<DataflowEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
