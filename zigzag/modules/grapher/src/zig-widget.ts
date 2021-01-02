import {
  PluginRenderBase,
  //  RenderEvents,
  RenderIcon,
  RenderLabel,
  RenderNode,
  RenderPoint,
  RenderWidget,
} from "@samantha-uk/zigzag-render";
// eslint-disable-next-line import/no-cycle
import { Grapher, ZigDatum } from "./grapher";

export const ZIG_RADIUS = 32;
export const ZIG_HEIGHT = 32;
const ICON_RADIUS = 3;
const MINI_ICON_RADIUS = 1;
const ICON_THICKNESS = 2;

export class ZigWidget implements RenderWidget {
  private _grapher?: Grapher;

  private _height = ZIG_HEIGHT;

  private _info?: RenderLabel;

  private _isLocked = false;

  private _label?: RenderLabel;

  private _miniIcons: (RenderIcon | undefined)[] = [];

  private _node: RenderNode;

  private _position: RenderPoint;

  private readonly _renderPlugin: PluginRenderBase;

  private _zigD: ZigDatum;

  constructor(renderPlugin: PluginRenderBase, zigD: ZigDatum) {
    this._position = { x: 0, y: 0, z: 0 };
    this._renderPlugin = renderPlugin;
    this._zigD = zigD;
    this._height += Math.abs(zigD.zig.rssi) * 2;

    // Create Zig node.
    this._node = this._renderPlugin.addNode(
      this._position,
      ZIG_RADIUS,
      this._height,
      this._zigD.zig.available ? `success_color` : `error_color`,
      [`zig`],
      this
    );

    // Device type & power type icons.
    this._setIcon(zigD.zig.device_type)

      ._setMiniIcon(
        0,
        zigD.zig.power_source ? zigD.zig.power_source : `Unknown`,
        true
      )
      ._setMiniIcon(9, `Lock`, false);

    let _miniIconSlot = 1;
    let _endpoints = ``;
    if (zigD.zig.endpoint_names) {
      zigD.zig.endpoint_names.forEach((endpoint: { name: string }) => {
        this._setMiniIcon(_miniIconSlot++, endpoint.name, true);
        _endpoints += `[${endpoint.name}]\n`;
      });
    }

    this._setLabel(
      `${zigD.zig.user_given_name ? zigD.zig.user_given_name : zigD.zig.name}`
    )._setInfo(
      `IEEE: ${zigD.zig.ieee}\nEndpoints:\n${
        _endpoints.length > 0 ? _endpoints : `None`
      }\nLast Seen:\n${zigD.zig.last_seen}`
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public get isVisible(): boolean {
    return true;
  }

  public get grapher(): Grapher | undefined {
    return this._grapher;
  }

  public set grapher(grapher: Grapher | undefined) {
    this._grapher = grapher;
  }

  public get isLocked(): boolean {
    return this._isLocked;
  }

  public set isLocked(lock: boolean) {
    this._isLocked = lock;
    if (this._isLocked) {
      this._renderPlugin.setIconVisibility(this._miniIcons[9]!, true);
    } else {
      this._renderPlugin.setIconVisibility(this._miniIcons[9]!, true);
    }
  }

  public position(position: RenderPoint): this {
    this._renderPlugin.setNodePosition(this._node, position);
    this._position = position;
    return this;
  }

  // There are 10 slots (0-9).
  private _getSlotPosition(slot: number): RenderPoint {
    const _slotAngle = ((Math.PI * 2) / 10) * slot - Math.PI / 2;
    const x = ZIG_RADIUS * 1.5 * Math.cos(_slotAngle);
    const y = ZIG_RADIUS * 1.5 * Math.sin(_slotAngle);
    return { x, y, z: this._height };
  }

  public onClicked(): void {
    this._grapher?.zigClicked(this._zigD.zig);
  }

  public onHoverOff(): void {
    this._showInfo(false);
  }

  public onHoverOn(): void {
    this._showInfo(true);
  }

  public onMoved(position: RenderPoint): void {
    this._grapher?.setPositionZigWithZags(this._zigD, position);
    this.isLocked = true;
  }

  private _setIcon(iconName: string, color = `state_icon_color`): this {
    this._renderPlugin.addNodeIcon(
      this._node,
      {
        x: 0,
        y: 0,
        z: this._height,
      },
      ICON_RADIUS,
      ICON_THICKNESS * 2,
      iconName,
      color,
      true,
      [`zig-icon`]
    );

    return this;
  }

  private _setInfo(text: string): this {
    if (this._info) {
      this._renderPlugin.setLabelText(this._info, text);
    } else {
      this._info = this._renderPlugin.addNodeLabel(
        this._node,
        {
          x: 0,
          y: ZIG_RADIUS * 2,
          z: this._height + ZIG_RADIUS,
        },
        0,
        text,
        12,
        false,
        [`zig-info`]
      );
    }
    return this;
  }

  private _setLabel(text: string): this {
    if (this._label) {
      this._renderPlugin.setLabelText(this._label, text);
    } else {
      this._label = this._renderPlugin.addNodeLabel(
        this._node,
        {
          x: 0,
          y: -ZIG_RADIUS * 2.5,
          z: this._height + ZIG_RADIUS,
        },
        0,
        text,
        36,
        true,
        [`zig-label`]
      );
    }
    return this;
  }

  private _setMiniIcon(
    slot: number,
    iconName: string,
    visible: boolean,
    color = `state_icon_color`
  ): this {
    if (iconName && color) {
      this._miniIcons[slot] = this._renderPlugin.addNodeIcon(
        this._node,
        this._getSlotPosition(slot),
        MINI_ICON_RADIUS,
        ICON_THICKNESS,
        iconName,
        color,
        visible,
        [`zig-mini-icon`]
      );
    }
    return this;
  }

  private _showInfo(visible: boolean): this {
    if (this._info) {
      this._renderPlugin.setLabelVisibility(this._info, visible);
    }
    return this;
  }
}
