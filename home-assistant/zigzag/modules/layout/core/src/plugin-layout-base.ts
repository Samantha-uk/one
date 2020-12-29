import { PluginBase, PluginConfigBase } from "@samantha-uk/utils-plugin";

export enum LayoutPluginID {
  D3 = `d3`,
}

export interface PluginConfigLayout extends PluginConfigBase {
  [key: string]: string | number | boolean;
}

export interface LayoutNodeBase {
  index: number;
  x?: number;
  y?: number;
  z?: number;
}
export interface LayoutLinkBase {
  source: number;
  target: number;
}

export abstract class PluginLayoutBase extends PluginBase {
  public readonly apiVersion = `1.0.0`;

  abstract isStable: boolean;

  abstract injectLinks(links: LayoutLinkBase[]): void;

  abstract injectNodes(nodes: LayoutNodeBase[]): void;

  abstract lockNode(node: LayoutNodeBase): void;

  abstract reset(): void;

  abstract restart(): void;

  abstract step(count?: number): LayoutNodeBase[];

  abstract stop(): void;

  abstract unlockNode(index: number): void;

  constructor() {
    super();
    this.id = `${this.id}-layout`;
  }
}
