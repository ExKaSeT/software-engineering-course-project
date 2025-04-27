// components/MapCanvas.tsx
'use client';

import React, {
  useCallback,
  useEffect,
  ChangeEvent,
  useRef,
  useMemo,
} from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Node,
  Edge,
  Connection,
  NodeTypes,
  EdgeTypes,
  ConnectionMode, EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Header from '@/components/Header';
import PositionableEdge from '@/components/PositionableEdge';
import CustomNode from '@/components/CustomNode';

import {
  AddNodeCommand,
  DeleteElementsCommand,
  AddEdgeCommand,
  RenameNodeCommand,
  ChangeEdgeCostCommand,
  MoveNodeCommand,
} from '@/utils/command';
import { Caretaker } from '@/utils/caretaker';
import { genCityName } from '@/utils/nameGenerator';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function MapCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const caretakerRef = useRef(new Caretaker());

  // Ref для хранения позиции узла в момент начала перетаскивания
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const edgeTypes: EdgeTypes = useMemo(() => ({
    positionable: (props: EdgeProps) => (
      <PositionableEdge
        { ...props }
        setEdges={ setEdges }
        caretaker={ caretakerRef.current }
      />
    ),
  }), [setEdges]);

  // Добавить город
  const handleAddCity = useCallback(() => {
    const id = Date.now().toString();
    const name = genCityName(nodes);
    const cmd = new AddNodeCommand(
      {
        id,
        type: 'custom',
        data: { label: name },
        position: {
          x: 50 + Math.random() * 200,
          y: 50 + Math.random() * 200,
        },
      },
      setNodes
    );
    caretakerRef.current.executeCommand(cmd);
  }, [nodes, setNodes]);

  // Удалить выбранные
  const handleDelete = useCallback(() => {
    const delNodes = nodes.filter((n) => n.selected);
    const delEdges = edges.filter((e) => e.selected);
    const cmd = new DeleteElementsCommand(
      delNodes,
      delEdges,
      setNodes,
      setEdges
    );
    caretakerRef.current.executeCommand(cmd);
  }, [nodes, edges, setNodes, setEdges]);

  // Экспорт/Импорт: скачиваем или загружаем JSON с initialState+history
  const handleExport = useCallback(() => {
    const payload = {
      history: caretakerRef.current.export(),
    };
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result as string);
          caretakerRef.current.import(
            payload.history,
            setNodes,
            setEdges
          );
        } catch {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [setNodes, setEdges]
  );

  // Добавление ребра
  const onConnect = useCallback(
    (params: Connection) => {
      const costStr = prompt('Enter road cost:', '1');
      if (costStr == null) return;
      const cost = Number(costStr);
      const edge: Edge = {
        ...params,
        id: `${ params.source }-${ params.sourceHandle }_to_${ params.target }-${ params.targetHandle }_${ Date.now() }`,
        type: 'positionable',
        label: String(cost),
        data: { cost, positionHandlers: [] },
      };
      const cmd = new AddEdgeCommand(edge, setEdges);
      caretakerRef.current.executeCommand(cmd);
    },
    [setEdges]
  );

  // Переименование узла
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const oldLabel = node.data.label as string;
      const newLabel = prompt('New city name:', oldLabel)?.trim();
      if (!newLabel || newLabel === oldLabel) return;
      const cmd = new RenameNodeCommand(
        node.id,
        newLabel,
        oldLabel,
        setNodes
      );
      caretakerRef.current.executeCommand(cmd);
    },
    [setNodes]
  );

  // Изменение стоимости ребра
  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const oldCost = edge.data?.cost as number;
      if (oldCost == null) return;
      const input = prompt('New road cost:', String(oldCost));
      if (input == null) return;
      const newCost = Number(input.trim());
      if (isNaN(newCost)) {
        alert('Cost must be a number');
        return;
      }
      const cmd = new ChangeEdgeCostCommand(
        edge.id,
        newCost,
        oldCost,
        setEdges
      );
      caretakerRef.current.executeCommand(cmd);
    },
    [setEdges]
  );

// Перехватываем старт перетаскивания, сохраняем oldPos
  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      dragStartPos.current = { x: node.position.x, y: node.position.y };
    },
    []
  );

  // Перетаскивание закончено — если сместился, создаём MoveNodeCommand
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const oldPos = dragStartPos.current;
      if (!oldPos) return;
      const newPos = { x: node.position.x, y: node.position.y };
      if (oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
        const cmd = new MoveNodeCommand(node.id, oldPos, newPos, setNodes);
        caretakerRef.current.executeCommand(cmd);
      }
      dragStartPos.current = null;
    },
    [setNodes]
  );

  // Хоткеи undo/redo/delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        caretakerRef.current.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        caretakerRef.current.redo();
      }
      if (e.key === 'Delete') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDelete]);

  return (
    <div className="w-screen h-screen bg-neutral-50">
      <Header
        onExport={ handleExport }
        onImport={ handleImport }
        onAddCity={ handleAddCity }
        onDelete={ handleDelete }
      />

      <div className="pt-16 w-full h-[calc(100vh-4rem)]">
        <ReactFlow
          nodes={ nodes }
          edges={ edges }
          onNodesChange={ onNodesChange }
          onEdgesChange={ onEdgesChange }
          onConnect={ onConnect }
          onNodeDoubleClick={ onNodeDoubleClick }
          onEdgeDoubleClick={ onEdgeDoubleClick }
          onNodeDragStart={ onNodeDragStart }
          onNodeDragStop={ onNodeDragStop }
          nodeTypes={ nodeTypes }
          edgeTypes={ edgeTypes }
          connectionMode={ ConnectionMode.Loose }
          fitView
        >
          <Background/>
          <Controls/>
        </ReactFlow>
      </div>
    </div>
  );
}
