'use client';

import React, { FC } from 'react';
import type { EdgeProps, Edge } from '@xyflow/react';
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  Position,
} from '@xyflow/react';
import ClickableBaseEdge from './ClickableBaseEdge';
import './PositionableEdge.css';
import type { Caretaker } from '@/utils/caretaker';
import { ModifyHandlersCommand } from '@/utils/command';

interface Handler {
  x: number;
  y: number;
  active?: boolean;
}

interface PositionableEdgeProps extends EdgeProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  caretaker: Caretaker;
}

// Вычисляем направление сегмента по вектору от src к tgt
function getSegmentPosition(
  src: { x: number; y: number },
  tgt: { x: number; y: number }
): Position {
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? Position.Right : Position.Left;
  } else {
    return dy > 0 ? Position.Bottom : Position.Top;
  }
}

const PositionableEdge: FC<PositionableEdgeProps> = ({
                                                       id,
                                                       selected,
                                                       sourceX, sourceY,
                                                       targetX, targetY,
                                                       sourcePosition,
                                                       targetPosition,
                                                       style = {},
                                                       markerEnd,
                                                       markerStart,
                                                       data,
                                                       setEdges,
                                                       caretaker,
                                                     }) => {
  const rf = useReactFlow();
  const handlers: Handler[] = (data as any)?.positionHandlers || [];
  const type = (data as any)?.type || 'bezier';
  const cost = (data as any)?.cost;

  const strokeColor = '#3A3A3C';
  const strokeWidth = selected ? 2 : 1;
  const pathFn = type === 'straight'
    ? getStraightPath
    : type === 'smoothstep'
      ? getSmoothStepPath
      : getBezierPath;

  // готовим сегменты
  const segments: { path: string; labelX: number; labelY: number }[] = [];
  for (let i = 0; i < handlers.length + 1; i++) {
    const src = i === 0
      ? { x: sourceX, y: sourceY }
      : handlers[i - 1];
    const tgt = i === handlers.length
      ? { x: targetX, y: targetY }
      : handlers[i];

    const srcPos = i === 0
      ? sourcePosition
      : getSegmentPosition(src, tgt);
    const tgtPos = i === handlers.length
      ? targetPosition
      : getSegmentPosition(tgt, src);

    const [d, lx, ly] = pathFn({
      sourceX: src.x,
      sourceY: src.y,
      sourcePosition: srcPos,
      targetX: tgt.x,
      targetY: tgt.y,
      targetPosition: tgtPos,
    });
    segments.push({ path: d, labelX: lx, labelY: ly });
  }

  const oldHandlers = JSON.parse(JSON.stringify(handlers)) as Handler[];

  // добавление метки через команду
  const handleContextMenu = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newHandlers = [...handlers];
    newHandlers.splice(idx, 0, { x: pos.x, y: pos.y });
    const cmd = new ModifyHandlersCommand(id, oldHandlers, newHandlers, setEdges);
    caretaker.addCommand(cmd);
  };

  // перемещение метки через команду
  const startDrag = (i: number) => {
    let moveListener: any, upListener: any;

    // onMove запоминает новую позицию
    moveListener = (e: MouseEvent) => {
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const middle = [...handlers];
      middle[i] = { x: pos.x, y: pos.y, active: true };
      // не выполняем команду сразу, откладываем до mouseup
      handlers[i] = { ...handlers[i], active: true };
      rf.setEdges((eds) =>
        eds.map((e) =>
          e.id === id
            ? { ...e, data: { ...e.data, positionHandlers: middle } }
            : e
        )
      );
    };

    upListener = () => {
      const edgeItem = rf.getEdges().find(e => e.id === id);
      // берём либо его data.positionHandlers, либо пустой массив
      const finalHandlers = (edgeItem?.data?.positionHandlers ?? []) as Handler[];
      // создаём команду с сохранённым oldHandlers и новым finalHandlers
      const cmd = new ModifyHandlersCommand(
        id,
        oldHandlers,
        finalHandlers,
        setEdges
      );
      caretaker.addCommand(cmd);

      window.removeEventListener('mousemove', moveListener);
      window.removeEventListener('mouseup', upListener);
    };

    window.addEventListener('mousemove', moveListener);
    window.addEventListener('mouseup', upListener);
  };

  // удаление метки через команду
  const handleRemove = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    const newHandlers = handlers.filter((_, idx) => idx !== i);
    const cmd = new ModifyHandlersCommand(id, oldHandlers, newHandlers, setEdges);
    caretaker.addCommand(cmd);
  };

  return (
    <>
      { segments.map((seg, idx) => (
        <ClickableBaseEdge
          key={ `${ id }-seg-${ idx }` }
          id={ `${ id }-seg-${ idx }` }
          path={ seg.path }
          style={ { ...style, stroke: strokeColor, strokeWidth } }
          markerEnd={ markerEnd }
          markerStart={ markerStart }
          onContextMenu={ (e) => handleContextMenu(idx, e) }
        />
      )) }

      { cost != null && (
        <EdgeLabelRenderer>
          <div
            className="px-1 py-0.5 bg-white rounded border shadow-subtle text-sm"
            style={ {
              position: 'absolute',
              transform: `translate(${ segments[Math.floor(segments.length / 2)].labelX }px, ${ segments[Math.floor(segments.length / 2)].labelY }px) translate(-50%, -150%)`,
              pointerEvents: 'none',
            } }
          >
            { cost }
          </div>
        </EdgeLabelRenderer>
      ) }

      { handlers.map((h, i) => (
        <EdgeLabelRenderer key={ `${ id }-handler-${ i }` }>
          <div
            className="positionHandlerContainer"
            style={ { transform: `translate(${ h.x }px, ${ h.y }px) translate(-50%, -50%)` } }
            onMouseDown={ (e) => {
              e.stopPropagation();
              startDrag(i);
            } }
            onContextMenu={ (e) => handleRemove(i, e) }
          >
            <button className="positionHandler"/>
          </div>
        </EdgeLabelRenderer>
      )) }
    </>
  );
};

export default PositionableEdge;
