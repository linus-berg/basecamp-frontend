import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const EnrichmentNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-teal-500 border-teal-500' : ''}`}>
      <div className="bg-teal-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Enrichment</span>
        <PlusCircleIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-2">{data.label}</div>
        {data.lookupSource && (
          <div className="text-[9px] text-teal-600 font-medium">
            FROM: <span className="font-bold">{data.lookupSource}</span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-teal-500 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-teal-500 !border-white" />
    </div>
  );
};

export default memo(EnrichmentNode);
