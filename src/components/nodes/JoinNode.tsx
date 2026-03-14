import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { ArrowsPointingInIcon } from '@heroicons/react/24/outline';

const JoinNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-cyan-500 border-cyan-500' : ''}`}>
      <div className="bg-cyan-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Join / Merge</span>
        <ArrowsPointingInIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-1">{data.label}</div>
        <div className="text-[9px] text-gray-500 italic">Combines multiple inputs</div>
      </div>
      {/* Multiple target handles for joining */}
      <Handle type="target" position={Position.Left} id="input-a" style={{ top: '30%' }} className="w-2 h-2 !bg-cyan-500 !border-white" />
      <Handle type="target" position={Position.Left} id="input-b" style={{ top: '70%' }} className="w-2 h-2 !bg-cyan-500 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-cyan-500 !border-white" />
    </div>
  );
};

export default memo(JoinNode);
