import * as d3f from "d3-force";
import {
  PluginLayoutBase,
  PluginConfigLayout,
  // TODO Consider allowing d3 options to be passed in the config
  //  LayoutPluginConfig,
  LayoutLinkBase,
  LayoutNodeBase,
} from "@samantha-uk/zigzag-layout";

const D3_ALPHA_RESTART = 0.1;
const D3_ALPHA_MIN = 0.01;
const D3_ALPHA_DECAY = 0.02;
const D3_REPEL_RADIUS = 300;

type LayoutLinkD3 = LayoutLinkBase & d3f.SimulationLinkDatum<LayoutNodeD3>;
type LayoutNodeD3 = LayoutNodeBase & d3f.SimulationNodeDatum;

interface PluginConfigLayoutD3 extends PluginConfigLayout {
  fileUrl: string;
}
export class LayoutPlugin extends PluginLayoutBase {
  public readonly config: PluginConfigLayoutD3;

  public readonly fqpi = `${this.id}-d3`;

  private _engine!: d3f.Simulation<d3f.SimulationNodeDatum, undefined>;

  private _links: d3f.SimulationLinkDatum<d3f.SimulationNodeDatum>[] = [];

  private _nodes: d3f.SimulationNodeDatum[] = [];

  constructor(config: PluginConfigLayoutD3) {
    super();
    this.config = config;

    this._engine = d3f
      .forceSimulation()
      .alphaMin(D3_ALPHA_MIN)
      .alphaDecay(D3_ALPHA_DECAY)
      .force(`center`, d3f.forceCenter());
  }

  get isStable(): boolean {
    return this._engine.alpha() <= this._engine.alphaMin();
  }

  public injectLinks(links: LayoutLinkD3[]): void {
    this._links = [...links];
    this._engine.force(`link`, d3f.forceLink(this._links).distance(300));
  }

  public injectNodes(nodes: LayoutNodeD3[]): void {
    this._nodes = [...nodes];
    this._engine
      .nodes(this._nodes)
      .force(`repel`, d3f.forceCollide().radius(D3_REPEL_RADIUS).strength(1));
  }

  public lockNode(node: LayoutNodeBase): void {
    this._nodes[node.index].fx = node.x;
    this._nodes[node.index].fy = node.y;
    this._engine.tick();
  }

  public reset(): void {
    this._nodes.forEach((node) => {
      node.x = 0;
      node.y = 0;
    });
    this._engine.alpha(D3_ALPHA_RESTART).restart();
  }

  public restart(): void {
    this._engine.alpha(D3_ALPHA_RESTART).restart();
  }

  public step(count = 1): LayoutNodeBase[] {
    this._engine.tick(count);
    const _nodesChanged: LayoutNodeBase[] = [];
    if (!this.isStable) {
      this._nodes.forEach((node) =>
        _nodesChanged.push({
          index: node.index ?? 0,
          x: node.x ?? 0,
          y: node.y ?? 0,
          z: 0,
        })
      );
    }
    return _nodesChanged;
  }

  public stop(): void {
    this._engine.stop();
    this._links = [];
    this._nodes = [];
  }

  public unlockNode(index: number): void {
    this._nodes[index].fx = undefined;
    this._nodes[index].fy = undefined;
  }
}

export function createPlugin(config: PluginConfigLayoutD3): LayoutPlugin {
  return new LayoutPlugin(config);
}
