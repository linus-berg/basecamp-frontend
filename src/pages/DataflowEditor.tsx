import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type { 
  Connection, 
  Edge as RFEdge, 
  Node as RFNode,
  XYPosition
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { dataflowApi } from '../api';
import type { Dataflow, NodeData, Node as DbNode, Edge as DbEdge, Attribute, ProjectMetadata } from '../types';
import SourceNode from '../components/nodes/SourceNode';
import SinkNode from '../components/nodes/SinkNode';
import AttributeNode from '../components/nodes/AttributeNode';
import TransformNode from '../components/nodes/TransformNode';
import FilterNode from '../components/nodes/FilterNode';
import JoinNode from '../components/nodes/JoinNode';
import PrivacyNode from '../components/nodes/PrivacyNode';
import RouterNode from '../components/nodes/RouterNode';
import AggregatorNode from '../components/nodes/AggregatorNode';
import EnrichmentNode from '../components/nodes/EnrichmentNode';
import AlertNode from '../components/nodes/AlertNode';
import { 
  CloudArrowUpIcon, 
  ChevronLeftIcon, 
  InformationCircleIcon, 
  PlusIcon, 
  TrashIcon, 
  TagIcon,
  CodeBracketIcon,
  FunnelIcon,
  ArrowsPointingInIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  CalculatorIcon,
  PlusCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const nodeTypes = {
  sourceNode: SourceNode,
  sinkNode: SinkNode,
  attributeNode: AttributeNode,
  transformNode: TransformNode,
  filterNode: FilterNode,
  joinNode: JoinNode,
  privacyNode: PrivacyNode,
  routerNode: RouterNode,
  aggregatorNode: AggregatorNode,
  enrichmentNode: EnrichmentNode,
  alertNode: AlertNode,
};

const DataflowEditor: React.FC = () => {
  const { dataflowId } = useParams<{ dataflowId: string }>();
  const navigate = useNavigate();
  const [dataflow, setDataflow] = useState<Dataflow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<RFNode | null>(null);
  const [tracingResult, setTracingResult] = useState<{ sinkLabel: string, route: string[], attributes: Attribute[], info: {type: string, label: string, value: string}[] }[] | null>(null);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<ProjectMetadata>({ tags: [] });
  const [editingDescription, setEditingDescription] = useState('');
  const [tagInput, setTagInput] = useState('');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const performSave = useCallback(async (isAuto = false) => {
    if (!dataflowId || !dataflow) return;
    setSaveStatus('saving');
    const dbNodes: DbNode[] = nodes.map(n => ({
      reactFlowId: n.id,
      type: n.type as any,
      positionX: n.position.x,
      positionY: n.position.y,
      data: JSON.stringify(n.data)
    }));
    const dbEdges: DbEdge[] = edges.map(e => ({
      reactFlowId: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      sourceHandle: e.sourceHandle || undefined,
      targetHandle: e.targetHandle || undefined
    }));

    try {
      await dataflowApi.saveGraph(dataflowId, { nodes: dbNodes, edges: dbEdges });
      await dataflowApi.update(dataflowId, {
        name: dataflow.name,
        description: dataflow.description,
        metadata: dataflow.metadata
      });
      setLastSaved(new Date());
      setSaveStatus('saved');
      if (!isAuto) {
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  }, [nodes, edges, dataflowId, dataflow]);

  // Auto-save effect
  useEffect(() => {
    if (!isAutoSaveEnabled) return;

    const interval = setInterval(() => {
      performSave(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [isAutoSaveEnabled, performSave]);

  useEffect(() => {
    if (dataflowId) {
      dataflowApi.get(dataflowId).then(df => {
        setDataflow(df);
        setEditingDescription(df.description || '');
        if (df.metadata) {
          try {
            const meta = JSON.parse(df.metadata);
            setEditingMetadata(meta);
            setTagInput(meta.tags?.join(', ') || '');
          } catch(e) {}
        }
      }).catch(err => console.error("Error fetching dataflow:", err));

      dataflowApi.getGraph(dataflowId).then(graph => {
        if (!graph || !graph.nodes) return;

        const rfNodes: RFNode[] = graph.nodes.map(n => {
          let parsedData: NodeData = { label: 'Node' };
          try {
            if (n.data) {
              parsedData = JSON.parse(n.data);
            }
          } catch (e) {
            console.error("Failed to parse node data", e);
          }

          return {
            id: n.reactFlowId,
            type: n.type === 'updaterNode' ? 'attributeNode' : (n.type || 'sourceNode'),
            position: { x: n.positionX || 0, y: n.positionY || 0 },
            data: parsedData
          };
        });

        const rfEdges: RFEdge[] = (graph.edges || []).map(e => ({
          id: e.reactFlowId,
          source: e.sourceNodeId,
          target: e.targetNodeId,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle
        }));

        setNodes(rfNodes);
        setEdges(rfEdges);
      }).catch(err => console.error("Error fetching graph:", err));
    }
  }, [dataflowId, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: RFNode) => {
    setSelectedNode(node);
    
    // Tracing from Source
    if (node.type === 'sourceNode') {
      const results: { sinkLabel: string, route: string[], attributes: Attribute[], info: {type: string, label: string, value: string}[] }[] = [];
      const visitedSinks = new Set<string>();

      // 1. Find all reachable Sinks
      const findAllSinks = (nodeId: string, visited = new Set<string>()) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        const curr = nodes.find(n => n.id === nodeId);
        if (!curr) return;
        if (curr.type === 'sinkNode') visitedSinks.add(nodeId);
        edges.filter(e => e.source === nodeId).forEach(edge => findAllSinks(edge.target, visited));
      };
      findAllSinks(node.id);

      // 2. For each Sink, find all simple paths from Source
      visitedSinks.forEach(sinkId => {
        const paths: string[][] = [];
        const findPaths = (currentId: string, currentPath: string[]) => {
          if (currentId === sinkId) {
            paths.push([...currentPath, currentId]);
            return;
          }
          edges.filter(e => e.source === currentId).forEach(edge => {
            if (!currentPath.includes(edge.target)) {
              findPaths(edge.target, [...currentPath, currentId]);
            }
          });
        };
        findPaths(node.id, []);

        // 3. Cluster paths based on Join convergence
        // Paths are merged if they share a Join node and have the same suffix from that node to the sink
        const pathSuffix = (path: string[], fromId: string) => path.slice(path.indexOf(fromId)).join('->');
        
        const clusters: string[][][] = []; // Groups of paths
        const processedPaths = new Set<number>();

        for (let i = 0; i < paths.length; i++) {
          if (processedPaths.has(i)) continue;
          
          const currentCluster = [paths[i]];
          processedPaths.add(i);

          // Find all other paths that converge with this one (including transitive convergence)
          let changed = true;
          while (changed) {
            changed = false;
            for (let j = 0; j < paths.length; j++) {
              if (processedPaths.has(j)) continue;

              const p2 = paths[j];
              const isEquivalent = currentCluster.some(p1 => {
                const sharedJoins = p1.filter(id => p2.includes(id) && nodes.find(n => n.id === id)?.type === 'joinNode');
                return sharedJoins.some(joinId => pathSuffix(p1, joinId) === pathSuffix(p2, joinId));
              });

              if (isEquivalent) {
                currentCluster.push(p2);
                processedPaths.add(j);
                changed = true;
              }
            }
          }
          clusters.push(currentCluster);
        }

        // 4. For each cluster, merge and generate result
        clusters.forEach((clusterPaths) => {
          const clusterNodeIds = new Set<string>();
          clusterPaths.forEach(p => p.forEach(id => clusterNodeIds.add(id)));

          const mergedAttrs = new Map<string, string>();
          const intermediateInfo: {type: string, label: string, value: string}[] = [];
          
          const distances = new Map<string, number>();
          const calcDist = (id: string, dist: number) => {
            if ((distances.get(id) || -1) >= dist) return;
            distances.set(id, dist);
            edges.filter(e => e.source === id).forEach(edge => calcDist(edge.target, dist + 1));
          };
          calcDist(node.id, 0);

          const sortedClusterNodes = Array.from(clusterNodeIds).sort((a, b) => (distances.get(a) || 0) - (distances.get(b) || 0));

          const routeLabels: string[] = [];
          sortedClusterNodes.forEach(nodeId => {
            const curr = nodes.find(n => n.id === nodeId);
            if (!curr) return;

            if (curr.type !== 'sourceNode' && curr.type !== 'sinkNode') {
              if (!routeLabels.includes(curr.data.label)) routeLabels.push(curr.data.label);
            }

            if (curr.type === 'attributeNode' && curr.data.attributes) {
              curr.data.attributes.forEach((attr: Attribute) => {
                if (attr.key) mergedAttrs.set(attr.key, attr.value);
              });
            }

            if (curr.type === 'transformNode' && curr.data.logic) {
              intermediateInfo.push({ type: 'TRANSFORM', label: curr.data.label, value: curr.data.logic });
            }
            if (curr.type === 'filterNode' && curr.data.condition) {
              intermediateInfo.push({ type: 'FILTER', label: curr.data.label, value: curr.data.condition });
            }
            if (curr.type === 'privacyNode' && curr.data.method) {
              intermediateInfo.push({ type: 'PRIVACY', label: curr.data.label, value: curr.data.method });
            }
            if (curr.type === 'routerNode' && curr.data.routingLogic) {
              intermediateInfo.push({ type: 'ROUTER', label: curr.data.label, value: curr.data.routingLogic });
            }
            if (curr.type === 'aggregatorNode' && curr.data.aggregationType) {
              intermediateInfo.push({ type: 'AGGREGATE', label: curr.data.label, value: curr.data.aggregationType });
            }
            if (curr.type === 'enrichmentNode' && curr.data.lookupSource) {
              intermediateInfo.push({ type: 'ENRICH', label: curr.data.label, value: curr.data.lookupSource });
            }
          });

          const sinkNode = nodes.find(n => n.id === sinkId);
          results.push({
            sinkLabel: sinkNode?.data.label || 'Unknown Sink',
            route: routeLabels,
            attributes: Array.from(mergedAttrs.entries()).map(([key, value]) => ({ key, value })),
            info: intermediateInfo
          });
        });
      });

      setTracingResult(results);
    } else {
      setTracingResult(null);
    }
  }, [nodes, edges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: RFNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { 
          label: `${type.replace('Node', '')} Node`,
          attributes: type === 'attributeNode' ? [] : undefined
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const updateNodeData = (data: Partial<NodeData>) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: { ...node.data, ...data },
          };
        }
        return node;
      })
    );
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...data } });
  };

  const addAttribute = () => {
    if (!selectedNode) return;
    const currentAttrs = selectedNode.data.attributes || [];
    const updatedAttrs = [...currentAttrs, { key: '', value: '' }];
    updateNodeData({ attributes: updatedAttrs });
  };

  const updateAttribute = (index: number, key: string, value: string) => {
    if (!selectedNode) return;
    const updatedAttrs = [...(selectedNode.data.attributes || [])];
    updatedAttrs[index] = { key, value };
    updateNodeData({ attributes: updatedAttrs });
  };

  const removeAttribute = (index: number) => {
    if (!selectedNode) return;
    const updatedAttrs = (selectedNode.data.attributes || []).filter((_, i) => i !== index);
    updateNodeData({ attributes: updatedAttrs });
  };

  const saveMetadata = () => {
    if (!dataflow) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
    const updatedMeta = { ...editingMetadata, tags };
    const updatedDf: Dataflow = { 
      ...dataflow, 
      description: editingDescription,
      metadata: JSON.stringify(updatedMeta) 
    };
    setDataflow(updatedDf);
    setEditingMetadata(updatedMeta);
    setIsEditingMetadata(false);
  };

  const SOURCE_VARIANTS = ['Database', 'API Endpoint', 'Message Queue', 'File System', 'Manual Input'];
  const SINK_VARIANTS = ['Database', 'API Endpoint', 'Message Queue', 'File System', 'Dashboard / UI'];
  const PRIVACY_METHODS = ['Masking', 'Encryption', 'Anonymization', 'Pseudonymization', 'Redaction'];
  const AGGREGATION_TYPES = ['Sum', 'Average', 'Count', 'Min', 'Max', 'Group Concat'];
  const ALERT_TARGETS = ['Email', 'Slack', 'Teams', 'PagerDuty', 'Webhook'];

  const dfMeta: ProjectMetadata = dataflow?.metadata ? JSON.parse(dataflow.metadata) : {};

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-73px)] relative bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar">
        <button 
          onClick={() => navigate(`/project/${dataflow?.projectId}`)}
          className="text-[10px] text-slate-400 flex items-center gap-1 mb-2 hover:text-indigo-600 font-black uppercase tracking-[0.2em] transition-colors"
        >
          <ChevronLeftIcon className="w-3 h-3 stroke-[4px]" />
          Back to Project
        </button>

        <div className="px-2 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-save</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isAutoSaveEnabled}
                onChange={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
              />
              <div className="w-7 h-4 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-200 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          {lastSaved && (
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
              Synced: {lastSaved.toLocaleTimeString()}
            </div>
          )}
          {saveStatus === 'saving' && <div className="text-[9px] text-indigo-500 font-black uppercase animate-pulse">Syncing...</div>}
          {saveStatus === 'error' && <div className="text-[9px] text-red-500 font-black uppercase">Sync failed</div>}
        </div>

        <h3 className="font-black text-slate-900 px-2 uppercase text-[10px] tracking-[0.2em] pt-2">Library</h3>
        <div className="space-y-1.5">
          {[
            { type: 'sourceNode', label: 'Source', color: 'emerald', icon: null },
            { type: 'sinkNode', label: 'Sink', color: 'red', icon: null },
            { type: 'attributeNode', label: 'Attribute', color: 'amber', icon: <TagIcon className="w-3 h-3" /> },
            { type: 'transformNode', label: 'Transform', color: 'blue', icon: <CodeBracketIcon className="w-3 h-3" /> },
            { type: 'filterNode', label: 'Filter', color: 'purple', icon: <FunnelIcon className="w-3 h-3" /> },
            { type: 'joinNode', label: 'Join', color: 'cyan', icon: <ArrowsPointingInIcon className="w-3 h-3" /> },
            { type: 'privacyNode', label: 'Privacy', color: 'slate', icon: <ShieldCheckIcon className="w-3 h-3" /> },
            { type: 'routerNode', label: 'Router', color: 'indigo', icon: <ArrowsRightLeftIcon className="w-3 h-3" /> },
            { type: 'aggregatorNode', label: 'Aggregator', color: 'lime', icon: <CalculatorIcon className="w-3 h-3" /> },
            { type: 'enrichmentNode', label: 'Enrichment', color: 'teal', icon: <PlusCircleIcon className="w-3 h-3" /> },
            { type: 'alertNode', label: 'Alert', color: 'rose', icon: <BellIcon className="w-3 h-3" /> },
          ].map(item => (
            <div 
              key={item.type}
              className="p-2 border border-slate-200 rounded-lg cursor-grab bg-white text-slate-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:border-indigo-300 hover:bg-slate-50 transition-all shadow-sm"
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', item.type)}
              draggable
            >
              {item.icon ? item.icon : <div className={`w-2 h-2 rounded-full bg-${item.color}-500 shadow-sm`} />} {item.label}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={() => performSave(false)}
            disabled={saveStatus === 'saving'}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            <CloudArrowUpIcon className="w-4 h-4 stroke-[3px]" />
            {saveStatus === 'saving' ? 'Syncing...' : 'Push Changes'}
          </button>
        </div>
      </aside>

      {/* Editor Canvas */}
      <div className="flex-1 relative bg-slate-50" ref={reactFlowWrapper}>
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{dataflow?.name}</span>
            {dfMeta.securityClassification && (
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                dfMeta.securityClassification === 'Public' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                dfMeta.securityClassification === 'Internal' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                dfMeta.securityClassification === 'Confidential' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-red-50 text-red-700 border-red-100'
              }`}>
                {dfMeta.securityClassification}
              </span>
            )}
            <button 
              onClick={() => setIsEditingMetadata(true)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
            </button>
          </div>
          <div className="flex gap-1">
            {dfMeta.tags?.map(tag => (
              <span key={tag} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-md">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls className="!bg-white !border-slate-200 !shadow-sm" />
        </ReactFlow>
      </div>

      {/* Inspector / Results Panel */}
      <aside className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto custom-scrollbar">
        {selectedNode ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Node Configuration</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Identifier</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData({ label: e.target.value })}
                  />
                </div>

                {(selectedNode.type === 'sourceNode' || selectedNode.type === 'sinkNode') && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      {selectedNode.type === 'sourceNode' ? 'Source' : 'Sink'} Endpoint Type
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                      value={selectedNode.data.variant || ''}
                      onChange={(e) => updateNodeData({ variant: e.target.value })}
                    >
                      <option value="">UNCATEGORIZED</option>
                      {(selectedNode.type === 'sourceNode' ? SOURCE_VARIANTS : SINK_VARIANTS).map(v => (
                        <option key={v} value={v}>{v.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedNode.type === 'transformNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mapping Logic</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 focus:border-blue-500 outline-none transition-all h-32 resize-none"
                      placeholder="Define transformations..."
                      value={selectedNode.data.logic || ''}
                      onChange={(e) => updateNodeData({ logic: e.target.value })}
                    />
                  </div>
                )}

                {selectedNode.type === 'filterNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Exclusion Condition</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-purple-700 focus:border-purple-500 outline-none transition-all"
                      placeholder="e.g. valid === true"
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => updateNodeData({ condition: e.target.value })}
                    />
                  </div>
                )}

                {selectedNode.type === 'routerNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Routing Logic</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-indigo-700 focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                      placeholder="Define branching switch logic..."
                      value={selectedNode.data.routingLogic || ''}
                      onChange={(e) => updateNodeData({ routingLogic: e.target.value })}
                    />
                  </div>
                )}

                {selectedNode.type === 'aggregatorNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Aggregation Method</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                      value={selectedNode.data.aggregationType || ''}
                      onChange={(e) => updateNodeData({ aggregationType: e.target.value })}
                    >
                      <option value="">SELECT METHOD...</option>
                      {AGGREGATION_TYPES.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                    </select>
                  </div>
                )}

                {selectedNode.type === 'enrichmentNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">External Lookup Source</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-teal-700 focus:border-teal-500 outline-none transition-all"
                      placeholder="e.g. User-Service API"
                      value={selectedNode.data.lookupSource || ''}
                      onChange={(e) => updateNodeData({ lookupSource: e.target.value })}
                    />
                  </div>
                )}

                {selectedNode.type === 'alertNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notification Target</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-rose-700 focus:border-rose-500 outline-none transition-all cursor-pointer"
                      value={selectedNode.data.alertTarget || ''}
                      onChange={(e) => updateNodeData({ alertTarget: e.target.value })}
                    >
                      <option value="">SELECT TARGET...</option>
                      {ALERT_TARGETS.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                    </select>
                  </div>
                )}

                {selectedNode.type === 'privacyNode' && (
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Compliance Method</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:border-slate-700 outline-none transition-all cursor-pointer"
                      value={selectedNode.data.method || ''}
                      onChange={(e) => updateNodeData({ method: e.target.value })}
                    >
                      <option value="">NO ENFORCEMENT</option>
                      {PRIVACY_METHODS.map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                    </select>
                  </div>
                )}

                {selectedNode.type === 'attributeNode' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Metadata Schema</label>
                      <button 
                        onClick={addAttribute}
                        className="text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1"
                      >
                        <PlusIcon className="w-2.5 h-2.5 stroke-[3px]" /> New Entry
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedNode.data.attributes?.map((attr: Attribute, i: number) => (
                        <div key={i} className="flex gap-2 items-start bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                          <div className="flex-1 space-y-1">
                            <input 
                              placeholder="KEY"
                              className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-amber-500"
                              value={attr.key}
                              onChange={(e) => updateAttribute(i, e.target.value, attr.value)}
                            />
                            <input 
                              placeholder="VALUE"
                              className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] text-slate-500 outline-none focus:border-amber-500"
                              value={attr.value}
                              onChange={(e) => updateAttribute(i, attr.key, e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => removeAttribute(i)}
                            className="text-slate-300 hover:text-red-500 transition-colors pt-1"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {tracingResult && (
              <div className="pt-8 border-t border-slate-100">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 text-[10px] mb-6 uppercase tracking-[0.2em]">
                  <InformationCircleIcon className="w-4 h-4 stroke-[2.5px]" />
                  Downstream Lineage
                </h4>
                <div className="space-y-6">
                  {tracingResult.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-medium">No active sinks downstream.</p>
                  ) : (
                    tracingResult.map((res, i) => (
                      <div key={i} className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 shadow-sm">
                        <div className="text-[9px] font-black text-indigo-800 mb-4 uppercase tracking-widest flex items-center justify-between border-b border-indigo-100 pb-2">
                          <span>Target Sink</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-indigo-200">{res.sinkLabel}</span>
                        </div>

                        {res.route.length > 0 && (
                          <div className="mb-4 flex flex-wrap items-center gap-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase mr-1">Route:</span>
                            {res.route.map((nodeLabel, idx) => (
                              <React.Fragment key={idx}>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{nodeLabel}</span>
                                {idx < res.route.length - 1 && <span className="text-slate-300 text-[8px]">→</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          {/* Logic & Transformations */}
                          {res.info.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-[8px] text-indigo-400 uppercase font-black tracking-widest">Logic & Flow</div>
                              <div className="space-y-1.5">
                                {res.info.map((inf, j) => (
                                  <div key={j} className="text-[10px] bg-white p-2 rounded-lg border border-indigo-50 shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-[8px] font-black px-1 rounded ${
                                        inf.type === 'TRANSFORM' ? 'bg-blue-100 text-blue-700' :
                                        inf.type === 'FILTER' ? 'bg-purple-100 text-purple-700' :
                                        inf.type === 'ROUTER' ? 'bg-indigo-100 text-indigo-700' :
                                        inf.type === 'AGGREGATE' ? 'bg-lime-100 text-lime-700' :
                                        inf.type === 'ENRICH' ? 'bg-teal-100 text-teal-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>{inf.type}</span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">{inf.label}</span>
                                    </div>
                                    <div className="font-mono text-[9px] text-slate-600 truncate">{inf.value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Attributes */}
                          <div className="space-y-2">
                            <div className="text-[8px] text-indigo-400 uppercase font-black tracking-widest">Merged Attributes</div>
                            {res.attributes.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic">No attributes tracked</div>
                            ) : (
                              <div className="grid grid-cols-1 gap-1">
                                {res.attributes.map((attr, j) => (
                                  <div key={j} className="text-[10px] flex items-center justify-between gap-2 bg-white px-2 py-1.5 rounded-lg border border-indigo-50 shadow-sm">
                                    <span className="font-black text-indigo-600 uppercase text-[9px] tracking-tighter">{attr.key}</span>
                                    <span className="truncate text-slate-600 font-medium">{attr.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <AdjustmentsHorizontalIcon className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Select a node to configure</p>
          </div>
        )}
      </aside>

      {/* Metadata Edit Modal */}
      {isEditingMetadata && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Flow Configuration</h3>
              <button onClick={() => setIsEditingMetadata(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                  placeholder="What is this dataflow doing?"
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data Sensitivity</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Flow Tags</label>
                <input 
                  type="text"
                  placeholder="e.g. ETL, Realtime, Batch"
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
                Apply Changes
              </button>
              <p className="text-[9px] text-center text-gray-400 italic font-medium">Synced during next auto-save</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WrappedEditor = () => (
  <ReactFlowProvider>
    <DataflowEditor />
  </ReactFlowProvider>
);

export default WrappedEditor;
