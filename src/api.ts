import axios from 'axios';
import type { Project, Dataflow, GraphPayload } from './types';

const API_BASE_URL = 'http://localhost:5257/api'; // Adjust port if necessary

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const projectApi = {
  list: () => api.get<Project[]>('/projects').then(res => res.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then(res => res.data),
  create: (project: Partial<Project>) => api.post<Project>('/projects', project).then(res => res.data),
  update: (id: string, project: Partial<Project>) => api.put(`/projects/${id}`, project),
};

export const dataflowApi = {
  listByProject: (projectId: string) => api.get<Dataflow[]>(`/projects/${projectId}/dataflows`).then(res => res.data),
  get: (id: string) => api.get<Dataflow>(`/dataflows/${id}`).then(res => res.data),
  create: (projectId: string, dataflow: Partial<Dataflow>) => 
    api.post<Dataflow>(`/projects/${projectId}/dataflows`, dataflow).then(res => res.data),
  update: (id: string, dataflow: Partial<Dataflow>) => api.put(`/dataflows/${id}`, dataflow),
  getGraph: (id: string) => api.get<GraphPayload>(`/dataflows/${id}/graph`).then(res => res.data),
  saveGraph: (id: string, payload: GraphPayload) => api.put(`/dataflows/${id}/graph`, payload),
};

export default api;
