import type { Node, Edge } from '@xyflow/react';

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
}

export class Memento {
  constructor(public state: FlowState) {}

  getState(): FlowState {
    return {
      nodes: this.state.nodes,
      edges: this.state.edges
    };
  }
}

export class Caretaker {
  public mementos: Memento[] = [];
  public index = -1;

  save(state: FlowState) {
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
