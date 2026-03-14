import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const PrivacyNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-slate-700 border-slate-700' : ''}`}>
      <div className="bg-slate-700 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Privacy / Security</span>
        <ShieldCheckIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-2">{data.label}</div>
        {data.method && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-700">{data.method}</span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-slate-700 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-slate-700 !border-white" />
    </div>
  );
};

export default memo(PrivacyNode);
