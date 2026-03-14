export interface ProjectMetadata {
  tags?: string[];
  securityClassification?: 'Public' | 'Internal' | 'Confidential' | 'Highly Confidential';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  metadata?: string; // JSON string of ProjectMetadata
  createdAt: string;
}

export interface Attribute {
  key: string;
  value: string;
}

export interface NodeData {
  label: string;
  variant?: string; // e.g., 'Database', 'API', 'File'
  description?: string;
  attributes?: Attribute[];
  logic?: string; // For Transform/Logic
  condition?: string; // For Filter
  method?: string; // For Privacy (e.g. Masking, Encryption)
  metadata?: Record<string, any>;
}

export interface Node {
  id?: string;
  reactFlowId: string;
  type: 'sourceNode' | 'sinkNode' | 'attributeNode' | 'transformNode' | 'filterNode' | 'joinNode' | 'privacyNode';
  positionX: number;
  positionY: number;
  data: string; // JSON string of NodeData
}

export interface Edge {
  id?: string;
  reactFlowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Dataflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  metadata?: string; // JSON string of ProjectMetadata
  updatedAt: string;
}

export interface GraphPayload {
  nodes: Node[];
  edges: Edge[];
}
