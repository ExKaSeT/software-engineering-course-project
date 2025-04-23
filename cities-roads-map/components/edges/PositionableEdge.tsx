'use client';

import React, { FC } from 'react';
import type { EdgeProps } from '@xyflow/react';
import {
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';
import ClickableBaseEdge from './ClickableBaseEdge';
import './PositionableEdge.css';

interface Handler {
  x: number;
  y: number;
  active?: boolean;
}

const PositionableEdge: FC<EdgeProps> = ({
                                           id,
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
  const segmentCount = handlers.length + 1;
  const segments: { path: string }[] = [];

  const getPathFn = () => {
    switch (type) {
      case 'straight':
        return getStraightPath;
      case 'smoothstep':
        return getSmoothStepPath;
      default:
        return getBezierPath;
    }
  };
  const pathFn = getPathFn();

  // build segments
  for (let i = 0; i < segmentCount; i++) {
    const sX = i === 0 ? sourceX : handlers[i - 1].x;
    const sY = i === 0 ? sourceY : handlers[i - 1].y;
    const tX = i === segmentCount - 1 ? targetX : handlers[i].x;
    const tY = i === segmentCount - 1 ? targetY : handlers[i].y;
    const [d] = pathFn({ sourceX: sX, sourceY: sY, sourcePosition, targetX: tX, targetY: tY, targetPosition });
    segments.push({ path: d });
  }

  const startDrag = (handlerIdx: number) => {
    // activate this handler
    rf.setEdges(eds =>
      eds.map(edge => {
        if (edge.id === id) {
          const ph = (edge.data as any).positionHandlers.map((hh: Handler, idx: number) => ({
            x: hh.x,
            y: hh.y,
            active: idx === handlerIdx
          }));
          return { ...edge, data: { ...(edge.data as any), positionHandlers: ph } };
        }
        return edge;
      })
    );

    const onMove = (e: MouseEvent) => {
      const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      rf.setEdges(eds =>
        eds.map(edge => {
          if (edge.id === id) {
            const ph = (edge.data as any).positionHandlers.slice();
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
            const ph = (edge.data as any).positionHandlers.map((hh: Handler) => ({ x: hh.x, y: hh.y }));
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
          style={ style }
          markerEnd={ markerEnd }
          markerStart={ markerStart }
          onClick={ e => {
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

      { handlers.map((h, i) => (
        <EdgeLabelRenderer key={ `${ id }-handler-${ i }` }>
          <div
            className="positionHandlerContainer"
            style={ { transform: `translate(${ h.x }px, ${ h.y }px) translate(-50%, -50%)` } }
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
                      data: { ...(edge.data as any), positionHandlers: ph }
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