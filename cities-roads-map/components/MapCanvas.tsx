'use client';

import React, {
  useCallback,
  useEffect,
  ChangeEvent,
  useRef,
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
  EdgeTypes, ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Header from '@/components/Header';
import PositionableEdge from '@/components/PositionableEdge';
import CustomNode from '@/components/CustomNode';
import { Caretaker, Memento, FlowState } from '@/utils/memento';
import { genCityName } from '@/utils/nameGenerator';

const edgeTypes: EdgeTypes = {
  positionable: PositionableEdge,
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export default function MapCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const caretakerRef = useRef(new Caretaker());

  // Инициализация истории
  useEffect(() => {
    caretakerRef.current.save({ nodes, edges });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Добавить город
  const handleAddCity = useCallback(() => {
    const id = Date.now().toString();
    const name = genCityName(nodes);
    const newNode: Node = {
      id,
      type: 'custom',
      data: { label: name },
      position: {
        x: 50 + Math.random() * 400,
        y: 50 + Math.random() * 400,
      },
    };
    const next = [...nodes, newNode];
    setNodes(next);
    caretakerRef.current.save({ nodes: next, edges });
  }, [nodes, edges, setNodes]);

  // Удалить выделенные
  const handleDelete = useCallback(() => {
    const delNodes = new Set(nodes.filter(n => n.selected).map(n => n.id));
    const delEdges = new Set(edges.filter(e => e.selected).map(e => e.id));
    const nextNodes = nodes.filter(n => !delNodes.has(n.id));
    const nextEdges = edges.filter(e => !delEdges.has(e.id));
    setNodes(nextNodes);
    setEdges(nextEdges);
    caretakerRef.current.save({ nodes: nextNodes, edges: nextEdges });
  }, [nodes, edges, setNodes, setEdges]);

  // Экспорт
  const handleExport = useCallback(() => {
    const payload = {
      nodes,
      edges,
      history: caretakerRef.current.mementos.map((m: Memento) => m.getState()),
      index: caretakerRef.current.index,
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Импорт
  const handleImport = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { nodes: inN, edges: inE, history, index } = JSON.parse(reader.result as string);
        setNodes(inN);
        setEdges(inE);
        caretakerRef.current.mementos = history.map((s: FlowState) => new Memento(s));
        caretakerRef.current.index = index;
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setNodes, setEdges]);

// Добавление дороги — просто пушим новый Edge, чтобы дубликаты всегда работали
  const onConnect = useCallback((params: Connection) => {
    const cost = prompt('Enter road cost:', '1');
    if (cost == null) return;
    // Генерируем уникальный id, чтобы React Flow мог отрисовать несколько одинаковых связей
    const newEdge: Edge = {
      ...params,
      id: `${ params.source }-${ params.sourceHandle }_to_${ params.target }-${ params.targetHandle }_${ Date.now() }`,
      type: 'positionable',
      label: cost,
      data: {
        cost: Number(cost),
        positionHandlers: [] as { x: number; y: number }[],
      },
    };
    // Вместо addEdge — просто пушим новый элемент в массив
    setEdges((eds) => {
      const next = [...eds, newEdge];
      caretakerRef.current.save({ nodes, edges: next });
      return next;
    });
  }, [nodes, edges, setEdges]);

  // Переименование города
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const name = prompt('New city name:', node.data.label as string)?.trim();
      if (!name || name === node.data.label) return;
      if (nodes.some(n => n.data.label === name)) {
        alert('Name must be unique');
        return;
      }
      const next = nodes.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, label: name } } : n
      );
      setNodes(next);
      caretakerRef.current.save({ nodes: next, edges });
    },
    [nodes, edges, setNodes]
  );

  // Изменение стоимости дороги
  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const input = prompt('New road cost:', edge.label as string);
      if (input == null) {
        // пользователь отменил prompt
        return;
      }
      const cost = input.trim();
      if (!cost || cost === edge.label) {
        // пустая строка или без изменений
        return;
      }
      // проверяем, что в cost только цифры
      if (!/^\d+$/.test(cost)) {
        alert('Cost must contain only digits');
        return;
      }
      const numericCost = Number(cost);
      const next = edges.map(e =>
        e.id === edge.id
          ? {
            ...e,
            label: cost,
            data: { ...e.data, cost: numericCost },
          }
          : e
      );
      setEdges(next);
      caretakerRef.current.save({ nodes, edges: next });
    },
    [nodes, edges, setEdges]
  );

  // Хоткеи
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const prev = caretakerRef.current.undo();
        if (prev) {
          setNodes(prev.nodes);
          setEdges(prev.edges);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        const next = caretakerRef.current.redo();
        if (next) {
          setNodes(next.nodes);
          setEdges(next.edges);
        }
      }
      if (e.key === 'Delete') handleDelete();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleDelete, setNodes, setEdges]);

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
