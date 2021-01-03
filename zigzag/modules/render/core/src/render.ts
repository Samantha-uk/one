export type RenderElement = RenderIcon | RenderLabel | RenderLink | RenderNode;
export interface RenderIcon {
  offset?: number | RenderPoint;
}
export interface RenderLabel {
  offset?: number | RenderPoint;
}
export interface RenderLink {
  widget: RenderWidget;
}
export interface RenderNode {
  widget: RenderWidget;
}
export type RenderPerformanceInfo = { drawCalls: number };
export type RenderPoint = { x: number; y: number; z: number };
export interface RenderDictionary<T> {
  [Key: string]: T;
}

/**
 * Interface defining the various events that may be emitted by the Render Plugin.
 *
 *
 * @public
 */
export interface RenderEvents {
  clicked: (widget: RenderWidget) => void;
  hoverOff: (widget: RenderWidget) => void;
  hoverOn: (widget: RenderWidget) => void;
  moved: (widget: RenderWidget, position: RenderPoint) => void;
  removed: (widget: RenderWidget) => void;
}

/**
 * @public
 */
export interface RenderWidget {
  isVisible: boolean;
  onClicked(): void;
  onHold(): void;
  onHoverOff(): void;
  onHoverOn(): void;
  onMoved(position: RenderPoint): void;
}
