'use client';

import React, { useCallback, useEffect, ChangeEvent, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Header from '@/components/Header';
import { Caretaker, Memento, FlowState } from '@/utils/memento';
import { genCityName } from '@/utils/nameGenerator';

export default function MapCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const caretakerRef = useRef(new Caretaker());

  // Initialize history on mount
  useEffect(() => {
    caretakerRef.current.save({ nodes, edges });
  }, []);

  const handleAddCity = () => {
    const id = Date.now().toString();
    const name = genCityName(nodes);
    const newNode: Node = {
      id,
      data: { label: name },
      position: { x: 50 + Math.random() * 400, y: 50 + Math.random() * 400 },
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      caretakerRef.current.save({ nodes: updated, edges });
      return updated;
    });
  };

  const handleExport = () => {
    const payload = {
      nodes,
      edges,
      history: caretakerRef.current.mementos.map((m: Memento) => m.getState()),
      index: caretakerRef.current.index,
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
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { nodes: inNodes, edges: inEdges, history, index } =
          JSON.parse(reader.result as string);
        setNodes(inNodes);
        setEdges(inEdges);
        caretakerRef.current.mementos = history.map(
          (s: FlowState) => new Memento(s)
        );
        caretakerRef.current.index = index;
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const cost = prompt('Enter road cost:', '1');
      if (cost === null) return;
      const newEdge: Edge = {
        ...params,
        id: `${params.source}-${params.target}-${Date.now()}`,
        label: cost,
        data: { cost: Number(cost) },
      };
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        caretakerRef.current.save({ nodes, edges: updated });
        return updated;
      });
    },
    [nodes, edges]
  );

  const onNodeDoubleClick = (_evt: React.MouseEvent, node: Node) => {
    const newName = prompt('New city name:', node.data.label as string)?.trim();
    if (!newName || newName === node.data.label) return;
    if (nodes.some((n) => n.data.label === newName)) {
      alert('Name must be unique');
      return;
    }
    setNodes((nds) => {
      const updated = nds.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, label: newName } } : n
      );
      caretakerRef.current.save({ nodes: updated, edges });
      return updated;
    });
  };

  const onEdgeDoubleClick = (_evt: React.MouseEvent, edge: Edge) => {
    const newCost = prompt('New road cost:', edge.label as string)?.trim();
    if (!newCost || newCost === edge.label) return;
    setEdges((eds) => {
      const updated = eds.map((e) =>
        e.id === edge.id ? { ...e, label: newCost, data: { cost: Number(newCost) } } : e
      );
      caretakerRef.current.save({ nodes, edges: updated });
      return updated;
    });
  };

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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="w-screen h-screen">
      <Header
        onExport={handleExport}
        onImport={handleImport}
        onAddCity={handleAddCity}
      />
      <div className="pt-16 w-full h-[calc(100vh-4rem)] bg-neutral-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
);
}
