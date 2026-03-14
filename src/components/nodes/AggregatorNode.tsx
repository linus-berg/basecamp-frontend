import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../../types';
import { CalculatorIcon } from '@heroicons/react/24/outline';

const AggregatorNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className={`min-w-[180px] bg-white border border-gray-200 rounded shadow-sm overflow-hidden transition-all ${selected ? 'ring-2 ring-lime-500 border-lime-500' : ''}`}>
      <div className="bg-lime-500 px-2 py-1 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Aggregator</span>
        <CalculatorIcon className="w-3 h-3 text-white" />
      </div>
      <div className="p-3">
        <div className="text-sm font-bold text-gray-900 leading-tight mb-2">{data.label}</div>
        {data.aggregationType && (
          <div className="inline-block px-1.5 py-0.5 bg-lime-50 text-lime-700 text-[9px] font-black uppercase border border-lime-100 rounded">
            {data.aggregationType}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-lime-500 !border-white" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-lime-500 !border-white" />
    </div>
  );
};

export default memo(AggregatorNode);
