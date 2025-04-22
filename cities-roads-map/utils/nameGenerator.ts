import type { Node } from '@xyflow/react';

export function genCityName(nodes: Node[]): string {
  let name: string;
  do {
    name = `city-${Math.random().toString(36).substr(2, 5)}`;
  } while (nodes.some((n) => n.data.label === name));
  return name;
}
