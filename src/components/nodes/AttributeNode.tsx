import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { TagIcon } from '@heroicons/react/24/outline';

const AttributeNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}>
      <div className="bg-amber-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Attribute Node</span>
        <TagIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 mb-2 leading-tight">{data.label}</div>
        {data.attributes && data.attributes.length > 0 && (
          <div className="space-y-1">
            {data.attributes.map((attr, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-amber-50 pb-0.5 last:border-0">
                <span className="text-amber-700 font-bold">{attr.key}:</span>
                <span className="text-gray-600 truncate max-w-[80px] text-right">{attr.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-amber-500 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-amber-500 !border-white" />
    </div>
  );
};

export default memo(AttributeNode);
