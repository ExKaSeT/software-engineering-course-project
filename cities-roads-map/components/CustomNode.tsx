'use client';

import React, { FC } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';

type CityNode = Node<
  { label: string },
  'custom'
>;

const CustomNode: FC<NodeProps<CityNode>> = ({ id, data, selected }) => {
  return (
    <div
      className={ `
        p-2
        bg-neutral-200
        rounded-xl
        shadow-card
        border border-gray-500
        ${ selected ? 'ring-1 ring-gray-500' : '' }
      ` }
    >
      <div className="text-sm font-medium">{ data.label }</div>

      {/* 4 стандартных хэндла — по одному на каждую сторону */ }
      <Handle
        type="target"
        position={ Position.Top }
        id={ `top-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
      <Handle
        type="target"
        position={ Position.Right }
        id={ `right-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
      <Handle
        type="target"
        position={ Position.Bottom }
        id={ `bottom-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
      <Handle
        type="target"
        position={ Position.Left }
        id={ `left-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />

      {/* Аналогичные исходящие хэндлы */ }
      <Handle
        type="source"
        position={ Position.Top }
        id={ `top-src-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
      <Handle
        type="source"
        position={ Position.Right }
        id={ `right-src-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
      <Handle
        type="source"
        position={ Position.Bottom }
        id={ `bottom-src-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
      <Handle
        type="source"
        position={ Position.Left }
        id={ `left-src-${ id }` }
        style={ { background: '#5f8ccd', width: 8, height: 8 } }
      />
    </div>
  );
};

export default CustomNode;