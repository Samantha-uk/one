import { PluginBase } from "@samantha-uk/utils-plugin";
import {
  RenderDictionary,
  RenderIcon,
  RenderLabel,
  RenderLink,
  RenderNode,
  RenderPerformanceInfo,
  RenderPoint,
  RenderWidget,
} from "./render";
/**
 * The set of render plugins officially supported.
 */
export enum RenderPluginID {
  BABYLON = `babylon`,
  PIXI = `pixi`,
  THREE = `three`,
}
export abstract class PluginRenderBase extends PluginBase {
  public readonly apiVersion = `1.0.0`;

  constructor() {
    super();
    this.id = `${this.id}-render`;
  }

  public abstract get hasChanged(): boolean;

  public abstract get viewSize(): RenderPoint;

  public abstract set viewSize(newDimensions: RenderPoint);

  public abstract get viewPosition(): RenderPoint;

  public abstract set viewPosition(center: RenderPoint);

  public abstract get viewZoom(): number;

  public abstract set viewZoom(scale: number);

  /**
   * @public
   */
  public abstract addLink(
    from: RenderPoint,
    to: RenderPoint,
    radius: number,
    color: string,
    widget: RenderWidget
  ): RenderLink;

  /**
   * @public
   */
  public abstract addLinkLabel(
    link: RenderLink,
    offset: number,
    rotation: number,
    text: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabel;

  /**
   * @public
   */
  public abstract addNode(
    position: RenderPoint,
    radius: number,
    height: number,
    color: string,
    id: string[],
    widget: RenderWidget
  ): RenderNode;

  /**
   * @public
   */
  public abstract addNodeIcon(
    node: RenderNode,
    offset: RenderPoint,
    radius: number,
    height: number,
    iconName: string,
    color: string,
    visible: boolean,
    id: string[]
  ): RenderIcon;

  /**
   * @public
   */
  public abstract addNodeLabel(
    node: RenderNode,
    offset: RenderPoint,
    rotation: number,
    text: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabel;

  /**
   * @public
   */
  public abstract dispose(): void;

  /**
   * @public
   */
  public abstract init(
    parentHTMLElement: HTMLDivElement,
    font: RenderDictionary<string>,
    color: RenderDictionary<string>
  ): boolean;

  /**
   * @public
   */
  public abstract render(): RenderPerformanceInfo | undefined;

  /**
   * @public
   */
  public abstract setIconColor(icon: RenderIcon, color: string): void;

  /**
   * @public
   */
  public abstract setIconVisibility(icon: RenderIcon, visible: boolean): void;

  /**
   * @public
   */
  public abstract setLabelText(label: RenderLabel, text: string): void;

  /**
   * @public
   */
  public abstract setLabelRotation(
    label: RenderLabel,
    rotation: number
  ): RenderLabel;

  /**
   * @public
   */
  public abstract setLabelVisibility(
    label: RenderLabel,
    visible: boolean
  ): void;

  /**
   * @public
   */
  public abstract setLinkColor(link: RenderLink, color: string): void;

  /**
   * @public
   */
  public abstract setLinkLabelOffset(
    link: RenderLink,
    label: RenderLabel,
    offset: number
  ): void;

  /**
   * @public
   */
  public abstract setLinkPosition(
    link: RenderLink,
    from: RenderPoint,
    to: RenderPoint
  ): void;

  /**
   * @public
   */
  public abstract setNodeColor(node: RenderNode, color: string): void;

  /**
   * @public
   */
  public abstract setNodeIconOffset(
    node: RenderNode,
    icon: RenderIcon,
    offset: RenderPoint
  ): RenderIcon;

  /**
   * @public
   */
  public abstract setNodeLabelOffset(
    node: RenderNode,
    label: RenderLabel,
    offset: RenderPoint
  ): RenderLabel;

  /**
   * @public
   */
  public abstract setNodePosition(
    node: RenderNode,
    position: RenderPoint
  ): void;

  /**
   * @public
   */
  public abstract toWorld(mouse: RenderPoint): RenderPoint;

  /**
   * @public
   */
  public abstract zoomToFit(x: number, y: number, zoom: number): void;
}
