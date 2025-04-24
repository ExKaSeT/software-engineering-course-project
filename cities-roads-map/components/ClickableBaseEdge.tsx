'use client';
import React from 'react';

interface ClickableBaseEdgeProps {
  id: string;
  path: string;
  style?: React.CSSProperties;
  markerEnd?: string;
  markerStart?: string;
  interactionWidth?: number;
  onClick?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
  onContextMenu?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
}

const ClickableBaseEdge: React.FC<ClickableBaseEdgeProps> = ({
                                                               id,
                                                               path,
                                                               style,
                                                               markerEnd,
                                                               markerStart,
                                                               interactionWidth = 20,
                                                               onClick,
                                                               onContextMenu,
                                                             }) => {
  return (
    <>
      <path
        id={ id }
        style={ style }
        d={ path }
        fill="none"
        className="react-flow__edge-path"
        markerEnd={ markerEnd }
        markerStart={ markerStart }
      />
      { interactionWidth > 0 && (
        <path
          d={ path }
          fill="none"
          strokeOpacity={ 0 }
          strokeWidth={ interactionWidth }
          className="react-flow__edge-interaction"
          onClick={ onClick }
          onContextMenu={ onContextMenu }
        />
      ) }
    </>
  );
};

ClickableBaseEdge.displayName = 'BaseEdge';
export default ClickableBaseEdge;
