import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { BellIcon } from '@heroicons/react/24/outline';

const AlertNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-rose-500 border-rose-500' : ''}`}>
      <div className="bg-rose-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Alert / Notify</span>
        <BellIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-2">{data.label}</div>
        {data.alertTarget && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[9px] font-black text-rose-700 uppercase">{data.alertTarget}</span>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-rose-500 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-rose-500 !border-white" />
    </div>
  );
};

export default memo(AlertNode);
