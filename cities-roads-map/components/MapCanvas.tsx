'use client';

import React, { useCallback, useEffect, ChangeEvent, useRef } from 'react';
import type { EdgeTypes } from '@xyflow/react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Node,
  Edge,
  Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Header from '@/components/Header';
import PositionableEdge from '@/components/edges/PositionableEdge';
import { Caretaker, Memento, FlowState } from '@/utils/memento';
import { genCityName } from '@/utils/nameGenerator';

const edgeTypes: EdgeTypes = {
  positionable: PositionableEdge,
};

export default function MapCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const caretakerRef = useRef(new Caretaker());

  useEffect(() => {
    caretakerRef.current.save({ nodes, edges });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCity = useCallback(() => {
    const id = Date.now().toString();
    const name = genCityName(nodes);
    const newNode: Node = {
      id,
      data: { label: name },
      position: { x: 50 + Math.random() * 400, y: 50 + Math.random() * 400 }
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    caretakerRef.current.save({ nodes: nextNodes, edges });
  }, [nodes, edges, setNodes]);

  const handleDelete = useCallback(() => {
    const delNodeIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
    const delEdgeIds = new Set(edges.filter(e => e.selected).map(e => e.id));

    const nextNodes = nodes.filter(n => !delNodeIds.has(n.id));
    const nextEdges = edges.filter(e => !delEdgeIds.has(e.id));

    setNodes(nextNodes);
    setEdges(nextEdges);
    caretakerRef.current.save({ nodes: nextNodes, edges: nextEdges });
  }, [nodes, edges, setNodes, setEdges]);

  const handleExport = useCallback(() => {
    const payload = {
      nodes,
      edges,
      history: caretakerRef.current.mementos.map((m: Memento) => m.getState()),
      index: caretakerRef.current.index
    };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { nodes: inNodes, edges: inEdges, history, index } = JSON.parse(reader.result as string);
        setNodes(inNodes);
        setEdges(inEdges);
        caretakerRef.current.mementos = history.map((s: FlowState) => new Memento(s));
        caretakerRef.current.index = index;
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    const cost = prompt('Enter road cost:', '1');
    if (cost == null) return;
    const newEdge: Edge = {
      ...params,
      id: `${ params.source }-${ params.target }-${ Date.now() }`,
      type: 'positionable',
      label: cost,
      data: { cost: Number(cost), positionHandlers: [] }
    };
    const nextEdges = addEdge(newEdge, edges);
    setEdges(nextEdges);
    caretakerRef.current.save({ nodes, edges: nextEdges });
  }, [nodes, edges, setEdges]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const newName = prompt('New city name:', node.data.label as string)?.trim();
    if (!newName || newName === node.data.label) return;
    if (nodes.some(n => n.data.label === newName)) {
      alert('Name must be unique');
      return;
    }
    const nextNodes = nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, label: newName } } : n);
    setNodes(nextNodes);
    caretakerRef.current.save({ nodes: nextNodes, edges });
  }, [nodes, edges, setNodes]);

  const onEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const newCost = prompt('New road cost:', edge.label as string)?.trim();
    if (!newCost || newCost === edge.label) return;
    const nextEdges = edges.map(e => e.id === edge.id ? {
      ...e,
      label: newCost,
      data: { ...(e.data as any), cost: Number(newCost) }
    } : e);
    setEdges(nextEdges);
    caretakerRef.current.save({ nodes, edges: nextEdges });
  }, [nodes, edges, setEdges]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
          edgeTypes={ edgeTypes }
          fitView
        >
          <Background/>
          <Controls/>
        </ReactFlow>
      </div>
    </div>
  );
}
