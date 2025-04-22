'use client';

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    ChangeEvent,
} from 'react';
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

//////////////////////////////////////////////
// MEMENTO (ХРАНИТЕЛЬ)
//////////////////////////////////////////////
type FlowState = { nodes: Node[]; edges: Edge[] };

class Memento {
    constructor(public state: FlowState) {}
    getState() {
        // Глубокая копия, чтобы сохранять снимок
        return {
            nodes: JSON.parse(JSON.stringify(this.state.nodes)),
            edges: JSON.parse(JSON.stringify(this.state.edges)),
        };
    }
}

class Caretaker {
    private mementos: Memento[] = [];
    private index = -1;

    save(state: FlowState) {
        // сбрасываем «будущее» при новой операции
        this.mementos.splice(this.index + 1);
        this.mementos.push(new Memento(state));
        this.index = this.mementos.length - 1;
    }

    undo(): FlowState | null {
        if (this.index > 0) {
            this.index--;
            return this.mementos[this.index].getState();
        }
        return null;
    }

    redo(): FlowState | null {
        if (this.index < this.mementos.length - 1) {
            this.index++;
            return this.mementos[this.index].getState();
        }
        return null;
    }
}

//////////////////////////////////////////////
// СТРАНДАРТНАЯ КОМАНДА (пример)
// паттерн «Команда» здесь выражен в виде отдельных функций,
// но можно оформить CreateCityCommand, DeleteCityCommand и т.д.
//////////////////////////////////////////////

export default function MapPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
    const caretaker = useRef(new Caretaker()).current;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Инициализация истории
    useEffect(() => {
        caretaker.save({ nodes, edges });
    }, []);

    // Генерация уникального названия
    const genCityName = () => {
        let name: string;
        do {
            name = `city-${Math.random().toString(36).substr(2, 5)}`;
        } while (nodes.some((n) => n.data.label === name));
        return name;
    };

    // Добавить город
    const handleAddCity = () => {
        const id = Date.now().toString();
        const name = genCityName();
        const newNode: Node = {
            id,
            data: { label: name },
            position: { x: 50 + Math.random() * 400, y: 50 + Math.random() * 400 },
        };
        setNodes((nds) => {
            const updated = [...nds, newNode];
            caretaker.save({ nodes: updated, edges });
            return updated;
        });
    };

    // Экспорт карты в JSON
    const handleExport = () => {
        const payload = {
            nodes,
            edges,
            // сохраняем всю историю для загрузки с undo/redo
            history: (caretaker as any).mementos.map((m: Memento) => m.getState()),
            index: (caretaker as any).index,
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

    // Импорт карты из JSON
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
                // восстанавливаем историю
                (caretaker as any).mementos = history.map(
                    (s: FlowState) => new Memento(s)
                );
                (caretaker as any).index = index;
            } catch {
                alert('Некорректный формат файла');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Добавление дороги с указанием стоимости
    const onConnect = useCallback(
        (params: Connection) => {
            const cost = prompt('Стоимость дороги:', '1');
            if (cost === null) return;
            const newEdge = {
                ...params,
                id: `${params.source}-${params.target}-${Date.now()}`,
                label: cost,
                data: { cost: Number(cost) },
            };
            setEdges((eds) => {
                const updated = addEdge(newEdge, eds);
                caretaker.save({ nodes, edges: updated });
                return updated;
            });
        },
        [nodes, edges, setEdges]
    );

    // Переименование города по двойному клику
    const onNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
        const newName = prompt('Новое имя города:', node.data.label as string)?.trim();
        if (!newName || newName === node.data.label) return;
        if (nodes.some((n) => n.data.label === newName)) {
            alert('Имя должно быть уникальным');
            return;
        }
        setNodes((nds) => {
            const updated = nds.map((n) =>
                n.id === node.id ? { ...n, data: { ...n.data, label: newName } } : n
            );
            caretaker.save({ nodes: updated, edges });
            return updated;
        });
    };

    // Изменение стоимости дороги
    const onEdgeDoubleClick = (_: React.MouseEvent, edge: Edge) => {
        const newCost = prompt('Новая стоимость:', edge.label as string)?.trim();
        if (!newCost || newCost === edge.label) return;
        setEdges((eds) => {
            const updated = eds.map((e) =>
                e.id === edge.id ? { ...e, label: newCost, data: { cost: Number(newCost) } } : e
            );
            caretaker.save({ nodes, edges: updated });
            return updated;
        });
    };

    // Undo / Redo (Ctrl+Z / Ctrl+Y)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                const prev = caretaker.undo();
                if (prev) {
                    setNodes(prev.nodes);
                    setEdges(prev.edges);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                const next = caretaker.redo();
                if (next) {
                    setNodes(next.nodes);
                    setEdges(next.edges);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [caretaker, setNodes, setEdges]);

    return (
        <div className="w-screen h-screen bg-neutral-50">
            {/* Фиксированный хэдер */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-100 shadow-card flex items-center px-4 z-10">
                <button
                    onClick={handleExport}
                    className="mr-2 px-3 py-1 rounded-xl shadow-subtle"
                >
                    Export
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mr-2 px-3 py-1 rounded-xl shadow-subtle"
                >
                    Import
                </button>
                <button
                    onClick={handleAddCity}
                    className="mr-2 px-3 py-1 bg-primary rounded-xl text-white shadow-subtle"
                >
                    Add city
                </button>
                {/* Скрытый input для импорта */}
                <input
                    type="file"
                    accept="application/json"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImport}
                />
            </header>

            {/* Область React Flow */}
            <div className="pt-16 w-full h-[calc(100vh-4rem)]">
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
