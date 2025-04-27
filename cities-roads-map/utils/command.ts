import type { Node, Edge } from '@xyflow/react';
import type { Dispatch, SetStateAction } from 'react';

type NodeSetter = Dispatch<SetStateAction<Node[]>>;
type EdgeSetter = Dispatch<SetStateAction<Edge[]>>;

export interface Command {
  execute(): void;

  undo(): void;

  serialize(): any;
}

// — Добавление узла —
export class AddNodeCommand implements Command {
  constructor(
    private node: Node,
    private setNodes: NodeSetter
  ) {
  }

  execute() {
    this.setNodes((nds) => [...nds, this.node]);
  }

  undo() {
    this.setNodes((nds) => nds.filter((n) => n.id !== this.node.id));
  }

  serialize() {
    return { type: 'AddNode', node: this.node };
  }
}

// — Удаление выделенных узлов и рёбер —
export class DeleteElementsCommand implements Command {
  constructor(
    private delNodes: Node[],
    private delEdges: Edge[],
    private setNodes: NodeSetter,
    private setEdges: EdgeSetter
  ) {
  }

  execute() {
    this.setNodes((nds) =>
      nds.filter((n) => !this.delNodes.some((dn) => dn.id === n.id))
    );
    this.setEdges((eds) =>
      eds.filter((e) => !this.delEdges.some((de) => de.id === e.id))
    );
  }

  undo() {
    this.setNodes((nds) => [...nds, ...this.delNodes]);
    this.setEdges((eds) => [...eds, ...this.delEdges]);
  }

  serialize() {
    return {
      type: 'DeleteElements',
      nodes: this.delNodes,
      edges: this.delEdges,
    };
  }
}

// — Добавление ребра —
export class AddEdgeCommand implements Command {
  constructor(
    private edge: Edge,
    private setEdges: EdgeSetter
  ) {
  }

  execute() {
    this.setEdges((eds) => [...eds, this.edge]);
  }

  undo() {
    this.setEdges((eds) => eds.filter((e) => e.id !== this.edge.id));
  }

  serialize() {
    return { type: 'AddEdge', edge: this.edge };
  }
}

// — Переименование узла —
export class RenameNodeCommand implements Command {
  constructor(
    private nodeId: string,
    private newLabel: string,
    private oldLabel: string,
    private setNodes: NodeSetter
  ) {
  }

  execute() {
    this.setNodes((nds) =>
      nds.map((n) =>
        n.id === this.nodeId
          ? { ...n, data: { ...n.data, label: this.newLabel } }
          : n
      )
    );
  }

  undo() {
    this.setNodes((nds) =>
      nds.map((n) =>
        n.id === this.nodeId
          ? { ...n, data: { ...n.data, label: this.oldLabel } }
          : n
      )
    );
  }

  serialize() {
    return {
      type: 'RenameNode',
      nodeId: this.nodeId,
      newLabel: this.newLabel,
      oldLabel: this.oldLabel,
    };
  }
}

// — Смена стоимости ребра —
export class ChangeEdgeCostCommand implements Command {
  constructor(
    private edgeId: string,
    private newCost: number,
    private oldCost: number,
    private setEdges: EdgeSetter
  ) {
  }

  execute() {
    this.setEdges((eds) =>
      eds.map((e) =>
        e.id === this.edgeId
          ? {
            ...e,
            label: String(this.newCost),
            data: { ...e.data, cost: this.newCost },
          }
          : e
      )
    );
  }

  undo() {
    this.setEdges((eds) =>
      eds.map((e) =>
        e.id === this.edgeId
          ? {
            ...e,
            label: String(this.oldCost),
            data: { ...e.data, cost: this.oldCost },
          }
          : e
      )
    );
  }

  serialize() {
    return {
      type: 'ChangeEdgeCost',
      edgeId: this.edgeId,
      newCost: this.newCost,
      oldCost: this.oldCost,
    };
  }
}

// фабрика для восстановления команд из JSON
export function deserializeCommand(
  raw: any,
  setNodes: NodeSetter,
  setEdges: EdgeSetter
): Command {
  switch (raw.type) {
    case 'AddNode':
      return new AddNodeCommand(raw.node, setNodes);
    case 'DeleteElements':
      return new DeleteElementsCommand(raw.nodes, raw.edges, setNodes, setEdges);
    case 'AddEdge':
      return new AddEdgeCommand(raw.edge, setEdges);
    case 'RenameNode':
      return new RenameNodeCommand(
        raw.nodeId,
        raw.newLabel,
        raw.oldLabel,
        setNodes
      );
    case 'ChangeEdgeCost':
      return new ChangeEdgeCostCommand(
        raw.edgeId,
        raw.newCost,
        raw.oldCost,
        setEdges
      );
    default:
      throw new Error(`Unknown command type "${ raw.type }"`);
  }
}
