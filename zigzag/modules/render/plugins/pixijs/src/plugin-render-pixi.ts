import { PluginConfigBaseSchema } from "@samantha-uk/utils-plugin";
import * as glm from "gl-matrix"; // http://glmatrix.net/docs/
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import ResizeObserver from "resize-observer-polyfill";
// eslint-disable-next-line import/no-cycle
import {
  IconHelper,
  RenderDictionary,
  RenderIcon,
  RenderLabel,
  RenderLink,
  RenderNode,
  RenderPerformanceInfo,
  RenderPoint,
  RenderWidget,
  PluginRenderBase,
} from "@samantha-uk/zigzag-render";
import * as z from "zod";

const LINK_WIDTH = 5;
const ICON_SCALE = 14;
const NS = `http://www.w3.org/2000/svg`;

interface RenderIconPIXI extends RenderIcon {
  path: SVGPathElement;
  radius: number;
  svg: SVGSVGElement;
}

interface RenderLabelPIXI extends RenderLabel {
  html: HTMLDivElement;
  rotation: number;
}

interface RenderNodePIXI extends RenderNode {
  color: number;
  gfx: PIXI.Graphics;
  html: HTMLDivElement;
  icons: RenderIconPIXI[];
  labels: RenderLabelPIXI[];
  position: RenderPoint;
  radius: number;
}
interface RenderLinkPIXI extends RenderLink {
  color: number;
  from: glm.vec2;
  gfx: PIXI.Graphics;
  labels: RenderLabelPIXI[];
  length: glm.vec2;
  to: glm.vec2;
}

// Add any plugin specific configuration elements.
export const PluginConfigSchema = PluginConfigBaseSchema;

// TODO Investigate allowing PIXI JS options to be passed into the config
type PluginConfig = z.infer<typeof PluginConfigSchema>;
/**
 * Used to render the display.
 * Uses pixi.js for the Zag lines and HTML for the Zigs and all labels.
 */
export class RenderPlugin extends PluginRenderBase {
  public readonly fqpi: string;

  public readonly config: PluginConfig;

  private _colorCSS: RenderDictionary<string> = {};

  private _dragStartPosition = new PIXI.Point();

  private _dragWidget?: RenderWidget;

  private _filterBlurUnfocussed: PIXI.filters.BlurFilter;

  private _fontCSS: RenderDictionary<string> = {};

  private _gfxViewport: Viewport;

  private _hasChanged = true;

  private _height = 0;

  private _htmlViewport: HTMLDivElement;

  private _linkLayer: PIXI.Graphics;

  private _linkLayerHighlight: PIXI.Graphics;

  private _primaryBackgroundColor = 0;

  private _nodeLayer: HTMLDivElement;

  private _parentDivElement?: HTMLDivElement;

  private _renderer: PIXI.Renderer;

  private _stage: PIXI.Container;

  private _width = 0;

  private _resizeObserver?: ResizeObserver;

  constructor(config: PluginConfig) {
    super();
    this.fqpi = `${this.id}-pixi`;
    this.config = config;

    // Create the HTML things we need
    this._htmlViewport = document.createElement(`div`);
    this._htmlViewport.style.setProperty(`position`, `absolute`);
    this._htmlViewport.style.setProperty(`overflow`, `visible`);
    this._htmlViewport.style.setProperty(`z-index`, `3`);
    this._htmlViewport.classList.add(`zigzag-viewport`);

    this._nodeLayer = document.createElement(`div`);
    this._nodeLayer.style.setProperty(`position`, `absolute`);
    this._nodeLayer.style.setProperty(`overflow`, `visible`);
    this._nodeLayer.style.setProperty(`z-index`, `4`);
    this._nodeLayer.classList.add(`nodes`);
    this._htmlViewport.append(this._nodeLayer);

    // Create the PIXI things we need.
    this._renderer = PIXI.autoDetectRenderer({
      antialias: true,
      transparent: true,
      resolution: window.devicePixelRatio,
    });

    this._gfxViewport = this._gfxViewportSetup();
    this._stage = new PIXI.Container();
    this._stage.addChild(this._gfxViewport);
    this._linkLayer = new PIXI.Graphics();
    this._linkLayerHighlight = new PIXI.Graphics();
    this._linkLayer.alpha = 0.4;
    this._linkLayerHighlight.alpha = 0.4;
    this._gfxViewport.addChild(this._linkLayer, this._linkLayerHighlight);

    // Add blur filter to the "background" layers, this is used to focus zigs/zags.
    this._filterBlurUnfocussed = new PIXI.filters.BlurFilter();
    this._filterBlurUnfocussed.blur = 20;
    this._filterBlurUnfocussed.enabled = false;

    this._linkLayer.filters = [this._filterBlurUnfocussed];
  }

  public get hasChanged(): boolean {
    return this._hasChanged;
  }

  public get viewSize(): RenderPoint {
    return { x: this._width, y: this._height, z: 0 };
  }

  public set viewSize(newDimensions: RenderPoint) {
    this._hasChanged = true;

    this._width = newDimensions.x;
    this._height = newDimensions.y;
    this._renderer.resize(this._width, this._height);
    this._gfxViewport.resize(this._width, this._height);
  }

  public get viewPosition(): RenderPoint {
    return { x: this._gfxViewport.left, y: this._gfxViewport.top, z: 0 };
  }

  public set viewPosition(center: RenderPoint) {
    this._hasChanged = true;

    this._gfxViewport.moveCenter(new PIXI.Point(center.x, center.y));
  }

  public get viewZoom(): number {
    return this._gfxViewport.scaled;
  }

  public set viewZoom(scale: number) {
    this._hasChanged = true;

    this._gfxViewport.setZoom(scale);
  }

  public addLink(
    from: RenderPoint,
    to: RenderPoint,
    _radius: number,
    color: string,
    widget: RenderWidget
  ): RenderLinkPIXI {
    const RLnk: RenderLinkPIXI = {
      color: PIXI.utils.string2hex(this._colorCSS[color]),
      from: glm.vec2.fromValues(from.x, from.y),
      gfx: new PIXI.Graphics(),
      labels: [],
      length: glm.vec2.create(),
      to: glm.vec2.fromValues(to.x, to.y),
      widget,
    };
    glm.vec2.subtract(RLnk.length, RLnk.to, RLnk.from);
    this._linkLayer.addChild(RLnk.gfx);
    this._drawLinkLine(RLnk);
    return RLnk;
  }

  public addLinkLabel(
    RLnk: RenderLinkPIXI,
    offset: number,
    rotation: number,
    content: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabelPIXI {
    const RLbl: RenderLabelPIXI = this._addLabel(
      rotation,
      content,
      size,
      visible,
      id
    );
    RLbl.offset = offset;
    this.setLinkLabelOffset(RLnk, RLbl, offset);
    RLbl.html.style.setProperty(
      `min-width`,
      `${glm.vec2.length(RLnk.length) / 3}px`
    );
    this._nodeLayer.append(RLbl.html);
    RLnk.labels.push(RLbl);
    return RLbl;
  }

  public addNode(
    position: RenderPoint,
    radius: number,
    _height: number,
    color: string,
    id: string[],
    widget: RenderWidget
  ): RenderNodePIXI {
    this._hasChanged = true;
    const RNde: RenderNodePIXI = {
      color: PIXI.utils.string2hex(this._colorCSS[color]),
      html: document.createElement(`div`),
      gfx: new PIXI.Graphics(),
      icons: [],
      labels: [],
      position,
      radius,
      widget,
    };

    id.forEach((className: string) =>
      className.length > 0 ? RNde.html.classList.add(className) : undefined
    );

    RNde.html.style.setProperty(`display`, `block`);
    RNde.html.style.setProperty(`fill`, `${this._colorCSS[color]}`);
    RNde.html.style.setProperty(`overflow`, `visible`);
    RNde.html.style.setProperty(`position`, `absolute`);
    RNde.html.style.setProperty(`z-index`, `7`);
    RNde.html.style.setProperty(`pointer-events`, `none`);

    this.setNodePosition(RNde, position);
    this.setNodeColor(RNde, color);

    this._nodeLayer.append(RNde.html);

    RNde.gfx.x = position.x;
    RNde.gfx.y = position.y;

    // Wire up pointer Events
    RNde.gfx.interactive = true;
    RNde.gfx.buttonMode = true;

    RNde.gfx
      .on(`mouseover`, () => RNde.widget.onHoverOn())
      .on(`mouseout`, () => RNde.widget.onHoverOff())
      .on(`pointerdown`, (event: PIXI.InteractionEvent) =>
        this._onDragStart(event, RNde.widget)
      )
      .on(`pointermove`, (event: PIXI.InteractionEvent) => this._onDrag(event))
      .on(`pointerup`, (event: PIXI.InteractionEvent) => this._onDragEnd(event))
      .on(`pointerupoutside`, (event: PIXI.InteractionEvent) =>
        this._onDragEnd(event)
      );

    this._gfxViewport.addChild(RNde.gfx);

    return RNde;
  }

  private _onDragStart(
    event: PIXI.InteractionEvent,
    widget: RenderWidget
  ): void {
    this._dragWidget = widget;
    this._gfxViewport.pause = true;
    this._dragStartPosition.copyFrom(event.data.global);
  }

  private _onDrag(event: PIXI.InteractionEvent): void {
    if (this._dragWidget) {
      this._dragWidget.onMoved({
        x: this._gfxViewport.toWorld(event.data.global).x,
        y: this._gfxViewport.toWorld(event.data.global).y,
        z: 0,
      });
    }
  }

  private _onDragEnd(event: PIXI.InteractionEvent): void {
    // If the cursor has not moved, then we actually clicked.
    if (this._dragStartPosition.equals(event.data.global)) {
      this._dragWidget?.onClicked();
    }
    this._dragWidget = undefined;
    this._gfxViewport.pause = false;
  }

  public addNodeIcon(
    RNde: RenderNodePIXI,
    offset: RenderPoint,
    radius: number,
    _height: number,
    iconName: string,
    color: string,
    _visible: boolean,
    id: string[]
  ): RenderIconPIXI {
    this._hasChanged = true;
    const RIcn: RenderIconPIXI = {
      path: document.createElementNS(NS, `path`),
      radius,
      svg: document.createElementNS(NS, `svg`),
    };

    id.forEach((className: string) =>
      className.length > 0 ? RIcn.svg.classList.add(className) : undefined
    );
    RIcn.svg.setAttribute(`height`, `${radius * ICON_SCALE}`);
    RIcn.svg.setAttribute(`viewBox`, `0 0 10 10`);
    RIcn.svg.setAttribute(`width`, `${radius * ICON_SCALE}`);

    RIcn.svg.style.setProperty(`pointer-events`, `none`);
    RIcn.svg.style.setProperty(`position`, `absolute`);
    RIcn.path.style.setProperty(`transform-origin`, `center`);

    RIcn.svg.append(RIcn.path);
    RIcn.path.setAttribute(`d`, IconHelper.getNormalizedIconPath(iconName));

    this.setIconColor(RIcn, color);
    this.setNodeIconOffset(RNde, RIcn, offset);
    this.setIconVisibility(RIcn, _visible);

    RNde.html.append(RIcn.svg);
    return RIcn;
  }

  public addNodeLabel(
    RNde: RenderNodePIXI,
    offset: RenderPoint,
    rotation: number,
    content: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabelPIXI {
    const RLbl: RenderLabelPIXI = this._addLabel(
      rotation,
      content,
      size,
      visible,
      id
    );
    RLbl.offset = offset;
    this.setNodeLabelOffset(RNde, RLbl, offset);
    RLbl.html.style.setProperty(`min-width`, `${RNde.radius * 4}px`);
    RNde.html.append(RLbl.html);
    RNde.labels.push(RLbl);
    return RLbl;
  }

  public dispose(): void {
    this._resizeObserver?.disconnect();
  }

  public init(
    parentDivElement: HTMLDivElement,
    font: RenderDictionary<string>,
    color: RenderDictionary<string>
  ): boolean {
    this._fontCSS = font;
    this._colorCSS = color;
    this._primaryBackgroundColor = PIXI.utils.string2hex(
      this._colorCSS.background_primary_color
    );

    this._parentDivElement = parentDivElement;
    this._width = this._parentDivElement.getBoundingClientRect().width;
    this._height = this._parentDivElement.getBoundingClientRect().height;

    // Resize
    this._resize();

    // Add all the elements we created earlier.
    this._parentDivElement.append(this._htmlViewport);
    this._parentDivElement.append(this._renderer.view);
    this._resizeObserver = new ResizeObserver(() => this._resize());
    this._resizeObserver.observe(this._parentDivElement);
    return true;
  }

  public render(): RenderPerformanceInfo {
    // Update zoom & pan if required.
    if (this._gfxViewport.dirty) {
      this._htmlViewport.style.setProperty(`transform-origin`, `0 0`);
      this._htmlViewport.style.setProperty(
        `transform`,
        `scale(${this._gfxViewport.scaled}) translate(${-this._gfxViewport
          .left}px,${-this._gfxViewport.top}px)`
      );
    }

    if (this._gfxViewport.dirty || this._hasChanged) {
      this._renderer.render(this._stage);
    }
    this._gfxViewport.dirty = false;
    this._hasChanged = false;

    return {
      drawCalls: 0,
    } as RenderPerformanceInfo;
  }

  public setIconColor(RIcn: RenderIconPIXI, color: string): void {
    RIcn.svg.style.fill = `${this._colorCSS[color]}`;
  }

  public setIconVisibility(RIcn: RenderIconPIXI, _visible: boolean): void {
    this._hasChanged = true;
    RIcn.svg.style.visibility = `${_visible ? `visible` : `hidden`}`;
  }

  public setLabelRotation(
    RLbl: RenderLabelPIXI,
    rotation: number
  ): RenderLabelPIXI {
    this._hasChanged = true;
    RLbl.html.style.setProperty(
      `transform`,
      `translate(${(RLbl.offset as RenderPoint)?.x ?? 0}px, ${
        (RLbl.offset as RenderPoint)?.y ?? 0
      }px) rotate(${rotation}deg)`
    );
    RLbl.rotation = rotation;
    return RLbl;
  }

  public setLabelText(RLbl: RenderLabelPIXI, text: string): void {
    this._hasChanged = true;
    RLbl.html.textContent = text;
  }

  setLabelVisibility(RLbl: RenderLabelPIXI, visible: boolean): void {
    this._hasChanged = true;
    RLbl.html.style.visibility = `${visible ? `visible` : `hidden`}`;
  }

  public setLinkColor(link: RenderLinkPIXI, color: string): void {
    this._hasChanged = true;
    link.color = PIXI.utils.string2hex(this._colorCSS[color]);
    this._drawLinkLine(link);
  }

  public setLinkLabelOffset(
    RLnk: RenderLinkPIXI,
    RLbl: RenderLabelPIXI,
    offset: number
  ): void {
    this._hasChanged = true;
    // Cache the length of the link.
    const _offset = glm.vec2.create();
    glm.vec2.scale(_offset, RLnk.length, offset);
    glm.vec2.add(_offset, RLnk.from, _offset);
    RLbl.html.style.transform = `translate(${_offset[0]}px, ${_offset[1]}px) rotate(${RLbl.rotation})`;
    RLbl.offset = offset;
  }

  public setLinkPosition(
    RLnk: RenderLinkPIXI,
    from: RenderPoint,
    to: RenderPoint
  ): void {
    RLnk.from = glm.vec2.fromValues(from.x, from.y);
    RLnk.to = glm.vec2.fromValues(to.x, to.y);
    glm.vec2.subtract(RLnk.length, RLnk.to, RLnk.from);
    this._drawLinkLine(RLnk);
  }

  public setNodeColor(RNde: RenderNodePIXI, color: string): void {
    this._hasChanged = true;
    RNde.html.style.setProperty(`fill`, `${this._colorCSS[color]}`);
    RNde.color = PIXI.utils.string2hex(this._colorCSS[color]);

    RNde.gfx
      .clear()
      .lineStyle(RNde.radius / 4, RNde.color, 1)
      .beginFill(this._primaryBackgroundColor)
      .drawCircle(RNde.position.x, RNde.position.y, RNde.radius * 1.5)
      .endFill();
  }

  public setNodeIconOffset(
    _RNde: RenderNodePIXI,
    RIcn: RenderIconPIXI,
    offset: RenderPoint
  ): RenderIconPIXI {
    this._hasChanged = true;
    RIcn.svg.style.setProperty(
      `transform`,
      `translate(${offset.x * 0.7 - RIcn.radius * 0.5 * ICON_SCALE}px, ${
        offset.y * 0.7 - RIcn.radius * 0.5 * ICON_SCALE
      }px)`
    );
    return RIcn;
  }

  public setNodeLabelOffset(
    _RNde: RenderNodePIXI,
    RLbl: RenderLabelPIXI,
    offset: RenderPoint
  ): RenderLabelPIXI {
    this._hasChanged = true;

    RLbl.html.style.setProperty(
      `transform`,
      `translateX(-50%) translateY(${offset.y}px) rotate(${RLbl.rotation}deg)`
    );
    RLbl.offset = offset;
    return RLbl;
  }

  public setNodePosition(RNde: RenderNodePIXI, position: RenderPoint): void {
    this._hasChanged = true;
    RNde.html.style.setProperty(
      `transform`,
      `translate(${position.x}px, ${position.y}px)`
    );

    RNde.gfx.x = position.x;
    RNde.gfx.y = position.y;
  }

  public toWorld(mouse: RenderPoint): RenderPoint {
    const { x, y } = this._gfxViewport.toWorld(mouse.x, mouse.y);
    return { x, y, z: 0 };
  }

  zoomToFit(x: number, y: number, zoom: number): void {
    this._gfxViewport.animate({
      time: 750,
      position: new PIXI.Point(x, y),
      scale: zoom,
      ease: `easeInOutQuart`,
    });
  }

  private _addLabel(
    rotation: number,
    content: string,
    size: number,
    visible: boolean,
    id: string[]
  ): RenderLabelPIXI {
    this._hasChanged = true;

    const RLbl: RenderLabelPIXI = {
      html: document.createElement(`div`),
      rotation,
    };

    id.forEach((className: string) =>
      className.length > 0 ? RLbl.html.classList.add(className) : undefined
    );
    RLbl.html.textContent = content;
    RLbl.html.style.setProperty(
      `background-color`,
      `${this._colorCSS.background_primary_color}`
    );
    RLbl.html.style.setProperty(
      `border`,
      `3px solid ${this._colorCSS.background_secondary_color}`
    );

    RLbl.html.style.setProperty(`display`, `inline-block`);
    RLbl.html.style.setProperty(`border-radius`, `5%`);
    RLbl.html.style.setProperty(
      `color`,
      `${this._colorCSS.text_primary_color}`
    );
    RLbl.html.style.setProperty(`font-family`, this._fontCSS.family);
    RLbl.html.style.setProperty(`font-size`, `${size}`);
    RLbl.html.style.setProperty(`pointer-events`, `none`);
    RLbl.html.style.setProperty(`position`, `absolute`);
    RLbl.html.style.setProperty(`text-align`, `center`);
    RLbl.html.style.setProperty(`user-select`, `none`);
    RLbl.html.style.setProperty(`transform-origin`, `-50% -50%`);
    RLbl.html.style.visibility = visible ? `visible` : `hidden`;

    return RLbl;
  }

  private _gfxViewportSetup(): Viewport {
    const _viewport = new Viewport({
      screenWidth: this._width,
      screenHeight: this._height,
      interaction: this._renderer.plugins.interaction,
    });

    _viewport.drag().pinch().wheel().decelerate();

    this._renderer.view.addEventListener(`wheel`, (event) => {
      event.preventDefault();
    });

    return _viewport;
  }

  private _drawLinkLine(RLnk: RenderLinkPIXI): void {
    this._hasChanged = true;

    RLnk.gfx
      .clear()
      .lineStyle(LINK_WIDTH, RLnk.color)
      .moveTo(RLnk.from[0], RLnk.from[1])
      .lineTo(RLnk.to[0], RLnk.to[1]);
  }

  private _resize(): void {
    this.viewSize = {
      x: this._parentDivElement?.getBoundingClientRect().width ?? 0,
      y: this._parentDivElement?.getBoundingClientRect().height ?? 0,
      z: 0,
    };
  }
}

export function createPlugin(config: PluginConfig): RenderPlugin {
  return new RenderPlugin(config);
}
