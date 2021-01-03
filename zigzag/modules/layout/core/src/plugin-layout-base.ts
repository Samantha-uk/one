import { PluginBase } from "@samantha-uk/utils-plugin";

export enum LayoutPluginID {
  D3 = `d3`,
}

export interface LayoutNodeBase {
  index: number;
  position: {
    x?: number;
    y?: number;
    z?: number;
  };
}
export interface LayoutLinkBase {
  source: number;
  target: number;
}

export abstract class PluginLayoutBase extends PluginBase {
  public readonly apiVersion = `1.0.0`;

  constructor() {
    super();
    this.id = `${this.id}-layout`;
  }

  abstract isStable: boolean;

  abstract injectLinks(links: LayoutLinkBase[]): void;

  abstract injectNodes(nodes: LayoutNodeBase[]): void;

  abstract lockNode(node: LayoutNodeBase): void;

  abstract restart(): void;

  abstract step(count?: number): LayoutNodeBase[];

  abstract stop(): void;

  abstract unlockNode(index: number): void;
}
