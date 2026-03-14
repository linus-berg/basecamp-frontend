import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { FunnelIcon } from '@heroicons/react/24/outline';

const FilterNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-purple-500 border-purple-500' : ''}`}>
      <div className="bg-purple-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Filter</span>
        <FunnelIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-2">{data.label}</div>
        {data.condition && (
          <div className="text-[9px] font-mono text-purple-700 bg-purple-50 p-1 rounded border border-purple-100 line-clamp-2 italic">
            WHERE: {data.condition}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-purple-500 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-purple-500 !border-white" />
    </div>
  );
};

export default memo(FilterNode);
