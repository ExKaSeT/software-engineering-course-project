'use client';

import React, { FC } from 'react';
import type { EdgeProps } from '@xyflow/react';
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

interface Handler {
  x: number;
  y: number;
  active?: boolean;
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

const PositionableEdge: FC<EdgeProps> = ({
                                           id,
                                           selected,
                                           sourceX,
                                           sourceY,
                                           targetX,
                                           targetY,
                                           sourcePosition,
                                           targetPosition,
                                           style = {},
                                           markerEnd,
                                           markerStart,
                                           data,
                                         }) => {
  const rf = useReactFlow();
  const handlers = (data as any)?.positionHandlers as Handler[] || [];
  const type = (data as any)?.type as string || 'bezier';
  const cost = (data as any)?.cost;

  // Цвет и толщина линий
  const strokeColor = '#3A3A3C';
  const strokeWidth = selected ? 2 : 1;

  // Подбираем функцию построения пути
  const pathFn =
    type === 'straight'
      ? getStraightPath
      : type === 'smoothstep'
        ? getSmoothStepPath
        : getBezierPath;

  // Собираем все сегменты, вычисляя для каждого свои позиции
  const segments: { path: string; labelX: number; labelY: number }[] = [];
  const segmentCount = handlers.length + 1;
  for (let i = 0; i < segmentCount; i++) {
    const prev = i === 0
      ? { x: sourceX, y: sourceY }
      : { x: handlers[i - 1].x, y: handlers[i - 1].y };
    const next = i === segmentCount - 1
      ? { x: targetX, y: targetY }
      : { x: handlers[i].x, y: handlers[i].y };

    const segSourcePos =
      i === 0
        ? sourcePosition
        : getSegmentPosition(prev, next);

    const segTargetPos =
      i === segmentCount - 1
        ? targetPosition
        : getSegmentPosition(next, prev);

    const [d, lx, ly] = pathFn({
      sourceX: prev.x,
      sourceY: prev.y,
      sourcePosition: segSourcePos,
      targetX: next.x,
      targetY: next.y,
      targetPosition: segTargetPos,
    });

    segments.push({ path: d, labelX: lx, labelY: ly });
  }

  // Позиция для лейбла цены — середина всего пути
  const mid = Math.floor(segments.length / 2);
  const labelPos = segments[mid] ?? { labelX: 0, labelY: 0 };

  // Drag handlers
  const startDrag = (handlerIdx: number) => {
    rf.setEdges(eds =>
      eds.map(edge => {
        if (edge.id === id) {
          const newPh = (edge.data as any).positionHandlers.map((hh: Handler, idx: number) => ({
            x: hh.x, y: hh.y, active: idx === handlerIdx
          }));
          return { ...edge, data: { ...(edge.data as any), positionHandlers: newPh } };
        }
        return edge;
      })
    );

    const onMove = (e: MouseEvent) => {
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      rf.setEdges(eds =>
        eds.map(edge => {
          if (edge.id === id) {
            const ph = [...(edge.data as any).positionHandlers];
            const idx = ph.findIndex((h: Handler) => h.active);
            if (idx >= 0) ph[idx] = { x: pos.x, y: pos.y, active: true };
            return { ...edge, data: { ...(edge.data as any), positionHandlers: ph } };
          }
          return edge;
        })
      );
    };

    const onUp = () => {
      rf.setEdges(eds =>
        eds.map(edge => {
          if (edge.id === id) {
            const ph = (edge.data as any).positionHandlers.map((hh: Handler) => ({
              x: hh.x, y: hh.y
            }));
            return { ...edge, data: { ...(edge.data as any), positionHandlers: ph } };
          }
          return edge;
        })
      );
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
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
          onContextMenu={ e => {
            e.preventDefault();
            const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            rf.setEdges(eds =>
              eds.map(edge => {
                if (edge.id === id) {
                  const ph = [...(edge.data as any).positionHandlers];
                  ph.splice(idx, 0, { x: pos.x, y: pos.y });
                  return { ...edge, data: { ...(edge.data as any), positionHandlers: ph } };
                }
                return edge;
              })
            );
          } }
        />
      )) }

      { cost !== undefined && (
        <EdgeLabelRenderer>
          <div
            className="px-1 py-0.5 bg-white rounded border shadow-subtle text-sm"
            style={ {
              position: 'absolute',
              transform: `translate(${ labelPos.labelX }px, ${ labelPos.labelY }px) translate(-50%, -150%)`,
              whiteSpace: 'nowrap',
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
            style={ {
              transform: `translate(${ h.x }px, ${ h.y }px) translate(-50%, -50%)`
            } }
            onMouseDown={ e => {
              e.stopPropagation();
              startDrag(i);
            } }
            onContextMenu={ e => {
              e.preventDefault();
              e.stopPropagation();
              rf.setEdges(eds =>
                eds.map(edge => {
                  if (edge.id === id) {
                    const ph = [...(edge.data as any).positionHandlers];
                    ph.splice(i, 1);
                    return {
                      ...edge,
                      id: `${ id }-${ Date.now() }`,
                      data: { ...(edge.data as any), positionHandlers: ph },
                    };
                  }
                  return edge;
                })
              );
            } }
          >
            <button className="positionHandler"/>
          </div>
        </EdgeLabelRenderer>
      )) }
    </>
  );
};

export default PositionableEdge;