import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

const SinkNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[160px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-red-500 border-red-500' : ''}`}>
      <div className="bg-red-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Sink</span>
        <ArchiveBoxIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-1">{data.label}</div>
        {data.variant && (
          <div className="inline-block px-1.5 py-0.5 bg-red-50 text-red-700 text-[9px] font-mono border border-red-100 rounded">
            {data.variant}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-red-500 !border-white" />
    </div>
  );
};

export default memo(SinkNode);
