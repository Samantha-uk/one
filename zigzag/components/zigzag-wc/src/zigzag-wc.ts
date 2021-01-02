import {
  css,
  CSSResult,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit-element";
import { PluginLoader, PluginConfigBase } from "@samantha-uk/utils-plugin";
import { PluginDataBase } from "@samantha-uk/zigzag-data";
import { PluginLayoutBase } from "@samantha-uk/zigzag-layout";
import { PluginRenderBase } from "@samantha-uk/zigzag-render";
import { Grapher, ZigEvent } from "@samantha-uk/zigzag-grapher";
import JSONFormatter from "json-formatter-js";
import "weightless/button";

export class ZigzagWC extends LitElement {
  protected _grapher?: Grapher;

  protected _jsonViewer?: JSONFormatter;

  private _pluginConfigData?: PluginConfigBase;

  private _pluginConfigLayout?: PluginConfigBase;

  private _pluginConfigRender?: PluginConfigBase;

  public async connectedCallback(): Promise<void> {
    super.connectedCallback();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._grapher?.stop();
  }

  protected async firstUpdated(
    changedProperties: PropertyValues
  ): Promise<void> {
    super.firstUpdated(changedProperties);
    await this._createGrapher();
    await this._startGrapher();
    await this.requestUpdate();
  }

  protected render(): TemplateResult | void {
    return html`
      <div
        class="zigzag"
        @zigClicked=${(event: CustomEvent) => this._onZigClicked(event)}
      ></div>
      <div class="buttonBox">
        <wl-button flat inverted @click=${() => this._grapher?.zoomToFit()}
          >Zoom to fit</wl-button
        >
        <wl-button flat inverted @click=${() => this._grapher?.agitate()}
          >Auto Layout</wl-button
        >
        <wl-button flat inverted @click=${() => this._grapher?.unlockAll()}
          >Unlock All</wl-button
        >
      </div>
      <div id="zigViewer">
        <wl-button
          flat
          inverted
          @click=${() => {
            const _zigViewer:
              | HTMLDivElement
              | undefined
              | null = this.shadowRoot?.querySelector(`#zigViewer`);
            if (_zigViewer) {
              _zigViewer.hidden = true;
            }
          }}
          >Close</wl-button
        >
      </div>
    `;
  }

  private _onZigClicked(event: CustomEvent<ZigEvent>): void {
    const _zigViewer:
      | HTMLDivElement
      | undefined
      | null = this.shadowRoot?.querySelector(`#zigViewer`);

    this._jsonViewer = new JSONFormatter(event.detail.zig, 1, {
      hoverPreviewEnabled: true,
      hoverPreviewArrayCount: 100,
      hoverPreviewFieldCount: 5,
      theme: `dark`,
      animateOpen: true,
      animateClose: true,
      useToJSON: true,
    });

    if (_zigViewer) {
      _zigViewer.hidden = true;
      _zigViewer.append(this._jsonViewer.render());
    }
  }

  public setConfiguration(
    dataConfig: PluginConfigBase,
    layoutConfig: PluginConfigBase,
    renderConfig: PluginConfigBase
  ): void {
    this._pluginConfigData = dataConfig;

    this._pluginConfigLayout = layoutConfig;

    this._pluginConfigRender = renderConfig;
  }

  // eslint-disable-next-line class-methods-use-this
  private async _createGrapher(): Promise<boolean> {
    if (
      this._pluginConfigData &&
      this._pluginConfigLayout &&
      this._pluginConfigRender
    ) {
      // Load the data plugin
      const _dataPlugin: PluginDataBase = await PluginLoader<PluginDataBase>(
        this._pluginConfigData
      );

      // Load the layout plugin
      const _layoutPlugin: PluginLayoutBase = await PluginLoader<PluginLayoutBase>(
        this._pluginConfigLayout
      );

      // Load the render plugin
      const _renderPlugin: PluginRenderBase = await PluginLoader<PluginRenderBase>(
        this._pluginConfigRender
      );

      // Once all the plugins are loaded, create the grapher.
      this._grapher = new Grapher(_dataPlugin, _layoutPlugin, _renderPlugin);
      return !!this._grapher;
    }
    return false;
  }

  private async _startGrapher() {
    this._grapher?.start(this.renderRoot.firstElementChild as HTMLDivElement);
  }

  public static get styles(): CSSResult {
    return css`
      div.zigzag {
        width: 100%;
        height: 95%;
        position: absolute;
      }

      .buttonBox {
        height: auto;
      }
    `;
  }
}

customElements.define(`zigzag-wc`, ZigzagWC);
