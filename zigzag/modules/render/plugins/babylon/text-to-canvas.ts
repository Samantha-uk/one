// Class to render text onto a canvas.
// Slight modification of https://github.com/vasturiano/three-spritetex
export class TextToCanvas {
  _backgroundColor?: string;

  _borderColor: string;

  _borderWidth: number | number[];

  _canvas: HTMLCanvasElement;

  _color: string;

  _fontFace: string;

  _fontSize: number;

  _fontWeight: string;

  _lineHeight: number;

  _padding: number | number[];

  _strokeColor: string;

  _strokeWidth: number;

  _text: string;

  _wordWrap: number;

  constructor(text: string, lineHeight: number, color: string) {
    this._borderColor = `white`;
    this._borderWidth = 0;
    this._canvas = document.createElement(`canvas`);
    this._color = color;
    this._fontFace = `Arial`;
    this._fontSize = 90; // defines text resolution
    this._fontWeight = `normal`;
    this._lineHeight = lineHeight;
    this._padding = 0;
    this._strokeColor = `white`;
    this._strokeWidth = 0;
    this._text = `${text}`;
    this._wordWrap = 0; // No wrap.
  }

  get text(): string {
    return this._text;
  }

  set text(text: string) {
    this._text = text;
  }

  get lineHeight(): number {
    return this._lineHeight;
  }

  set lineHeight(lineHeight: number) {
    this._lineHeight = lineHeight;
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get color(): string {
    return this._color;
  }

  set color(color: string) {
    this._color = color;
  }

  get backgroundColor(): string | undefined {
    return this._backgroundColor;
  }

  set backgroundColor(color: string | undefined) {
    this._backgroundColor = color;
  }

  get padding(): number | number[] {
    return this._padding;
  }

  set padding(padding: number | number[]) {
    this._padding = padding;
  }

  get borderWidth(): number | number[] {
    return this._borderWidth;
  }

  set borderWidth(borderWidth: number | number[]) {
    this._borderWidth = borderWidth;
  }

  get borderColor(): string {
    return this._borderColor;
  }

  set borderColor(borderColor: string) {
    this._borderColor = borderColor;
  }

  get fontFace(): string {
    return this._fontFace;
  }

  set fontFace(fontFace: string) {
    this._fontFace = fontFace;
  }

  get fontSize(): number {
    return this._fontSize;
  }

  set fontSize(fontSize: number) {
    this._fontSize = fontSize;
  }

  get fontWeight(): string {
    return this._fontWeight;
  }

  set fontWeight(fontWeight: string) {
    this._fontWeight = fontWeight;
  }

  get strokeWidth(): number {
    return this._strokeWidth;
  }

  set strokeWidth(strokeWidth: number) {
    this._strokeWidth = strokeWidth;
  }

  get strokeColor(): string {
    return this._strokeColor;
  }

  set strokeColor(strokeColor: string) {
    this._strokeColor = strokeColor;
  }

  genCanvas(): void {
    const canvas = this._canvas;
    const context = canvas.getContext(`2d`);

    const border = Array.isArray(this._borderWidth)
      ? this._borderWidth
      : [this._borderWidth, this._borderWidth]; // x,y border
    const relativeBorder = border.map((b) => b * this._fontSize * 0.1); // border in canvas units

    const padding = Array.isArray(this._padding)
      ? this._padding
      : [this._padding, this._padding]; // x,y padding
    const relativePadding = padding.map((p) => p * this.fontSize * 0.1); // padding in canvas units

    // Wrap?
    if (this._wordWrap) {
      this._text = TextToCanvas._wordwrap2(this._text, this._wordWrap);
    }

    const lines = this.text.split(`\n`);
    const font = `${this._fontWeight} ${this._fontSize}px ${this._fontFace}`;

    context!.font = font; // measure canvas with appropriate font
    const innerWidth = Math.max(
      ...lines.map((line) => context!.measureText(line).width)
    );
    const innerHeight = this._fontSize * lines.length;
    canvas.width = innerWidth + relativeBorder[0] * 2 + relativePadding[0] * 2;
    canvas.height =
      innerHeight + relativeBorder[1] * 2 + relativePadding[1] * 2;

    // paint border
    if (this._borderWidth) {
      context!.strokeStyle = this._borderColor;

      if (relativeBorder[0]) {
        context!.lineWidth = relativeBorder[0] * 2;
        context!.beginPath();
        context!.moveTo(0, 0);
        context!.lineTo(0, canvas.height);
        context!.moveTo(canvas.width, 0);
        context!.lineTo(canvas.width, canvas.height);
        context!.stroke();
      }

      if (relativeBorder[1]) {
        context!.lineWidth = relativeBorder[1] * 2;
        context!.beginPath();
        context!.moveTo(relativeBorder[0], 0);
        context!.lineTo(canvas.width - relativeBorder[0], 0);
        context!.moveTo(relativeBorder[0], canvas.height);
        context!.lineTo(canvas.width - relativeBorder[0], canvas.height);
        context!.stroke();
      }
    }

    context!.translate(relativeBorder[0], relativeBorder[1]);

    // paint background
    if (this._backgroundColor) {
      context!.fillStyle = this._backgroundColor;
      context!.fillRect(
        0,
        0,
        canvas.width - relativeBorder[0] * 2,
        canvas.height - relativeBorder[1] * 2
      );
    }

    context!.translate(relativePadding[0], relativePadding[1]);

    // paint text
    context!.font = font; // Set font again after canvas is resized, as context properties are reset
    context!.fillStyle = this.color;
    context!.textBaseline = `bottom`;

    const drawTextStroke = this.strokeWidth > 0;
    if (drawTextStroke) {
      context!.lineWidth = (this.strokeWidth * this.fontSize) / 10;
      context!.strokeStyle = this.strokeColor;
    }

    lines.forEach((line, index) => {
      const lineX = (innerWidth - context!.measureText(line).width) / 2;
      const lineY = (index + 1) * this.fontSize;

      if (drawTextStroke) {
        context!.strokeText(line, lineX, lineY);
      }
      context!.fillText(line, lineX, lineY);
    });
  }

  private static _wordwrap2(
    string: string,
    width: number,
    brk?: string,
    cut?: boolean
  ): string {
    brk = brk || `\n`;
    width = width || 75;
    cut = cut || false;
    if (!string) {
      return string;
    }

    const regex =
      // eslint-disable-next-line prefer-template
      `.{1,` +
      width +
      `}(\\s|$)` +
      // eslint-disable-next-line prefer-template
      (cut ? `|.{` + width + `}|.+$` : `|\\S+?(\\s|$)`);
    return string.match(new RegExp(regex, `g`))!.join(brk);
  }
}
