import {
  PluginRenderBase,
  //  RenderEvents,
  RenderLabel,
  RenderLink,
  RenderPoint,
  RenderWidget,
} from "@samantha-uk/zigzag-render";
import { Zag } from "@samantha-uk/zigzag-data";
// eslint-disable-next-line import/no-cycle
import { ZagDatum } from "./grapher";

const ZAG_RADIUS = 2;
const LQIThresholdLower = 100;
const LQIThresholdUpper = 200;

export class ZagWidget implements RenderWidget {
  public zags: Zag[] = [];

  private _labelOne?: RenderLabel;

  private _labelTwo?: RenderLabel;

  private _link: RenderLink;

  private _renderPlugin: PluginRenderBase;

  private _zagD: ZagDatum;

  constructor(renderPlugin: PluginRenderBase, zagD: ZagDatum) {
    this._renderPlugin = renderPlugin;
    this._zagD = zagD;

    this._link = this._renderPlugin.addLink(
      this._zagD.source.position,
      this._zagD.target.position,
      ZAG_RADIUS,
      `background_secondary_color`,
      this
    );

    this.labelOne(`${zagD.zags[0].relationship} LQI:${zagD.zags[0].lqi}`)
      .color(
        // eslint-disable-next-line no-nested-ternary
        zagD.zags[0].lqi < LQIThresholdLower
          ? `error_color`
          : zagD.zags[0].lqi > LQIThresholdUpper
          ? `success_color`
          : `warning_color`
      )
      .source(zagD.source.position)
      .target(zagD.target.position);

    if (zagD.zags.length === 2) {
      this.labelTwo(`${zagD.zags[1].relationship} LQI:${zagD.zags[1].lqi}`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public get isVisible(): boolean {
    return true;
  }

  public color(color: string): this {
    this._renderPlugin.setLinkColor(this._link, color);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public highlight(_isHighlighted: boolean): this {
    return this;
  }

  public labelOne(labelText: string): this {
    if (!this._labelOne) {
      this._labelOne = this._renderPlugin.addLinkLabel(
        this._link,
        0.3,
        0,
        labelText,
        8,
        true,
        [`zag-label`]
      );
      return this;
    }
    this._renderPlugin.setLabelText(this._labelOne, labelText);
    return this;
  }

  public labelTwo(labelText: string): this {
    if (!this._labelTwo) {
      this._labelTwo = this._renderPlugin.addLinkLabel(
        this._link,
        0.7,
        0,
        labelText,
        8,
        true,
        [`zag-label`]
      );
      return this;
    }
    this._renderPlugin.setLabelText(this._labelTwo, labelText);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public source(_position: RenderPoint): this {
    this._renderPlugin.setLinkPosition(
      this._link,
      this._zagD.source.position,
      this._zagD.target.position
    );
    if (this._labelOne) {
      this._renderPlugin.setLinkLabelOffset(this._link, this._labelOne, 0.3);
    }
    if (this._labelTwo) {
      this._renderPlugin.setLinkLabelOffset(this._link, this._labelTwo, 0.7);
    }
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public target(_position: RenderPoint): this {
    this._renderPlugin.setLinkPosition(
      this._link,
      this._zagD.source.position,
      this._zagD.target.position
    );
    if (this._labelOne) {
      this._renderPlugin.setLinkLabelOffset(this._link, this._labelOne, 0.3);
    }
    if (this._labelTwo) {
      this._renderPlugin.setLinkLabelOffset(this._link, this._labelTwo, 0.7);
    }
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  public onClicked(): void {}

  // eslint-disable-next-line class-methods-use-this
  public onHold(): void {}

  // eslint-disable-next-line class-methods-use-this
  public onHoverOff(): void {}

  // eslint-disable-next-line class-methods-use-this
  public onHoverOn(): void {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  public onMoved(_position: RenderPoint): void {}
}
