import { ZigzagWC } from "@samantha-uk/zigzag-wc";
import { HomeAssistant, Panel } from "custom-card-helpers";
import { property, PropertyValues } from "lit-element";

export class ZigzagPanel extends ZigzagWC {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public panel!: Panel;

  protected async firstUpdated(
    changedProperties: PropertyValues
  ): Promise<void> {
    this.viewState = await this.restoreViewstate();

    const zzc = this.panel.config?.zigzag;

    // Set the plugin configuration we will use.
    this.setConfiguration(
      {
        apiVersionRequired: `1.0.0`,
        id: `plugin-data-${zzc[`plugin-data`].type}`,
        connection: this.hass.connection,
        pluginPath: zzc[`plugin-path`],
        filePath: zzc[`plugin-data`].filePath ?? undefined,
      },
      {
        apiVersionRequired: `1.0.0`,
        id: `plugin-layout-${zzc[`plugin-layout`].type}`,
        pluginPath: zzc[`plugin-path`],
      },
      {
        apiVersionRequired: `1.0.0`,
        id: `plugin-render-${zzc[`plugin-render`].type}`,
        pluginPath: zzc[`plugin-path`],
      }
    );
    super.firstUpdated(changedProperties);
  }

  public async disconnectedCallback(): Promise<void> {
    await this.storeViewstate(this.viewState);
    super.disconnectedCallback();
  }

  protected async restoreViewstate(): Promise<string> {
    // Request a saved viewState
    const _result = await this.hass!.callWS<{
      value: string;
    }>({
      type: `frontend/get_user_data`,
      key: `zigzag-panel-viewstate`,
    });

    return _result.value;
  }

  protected async storeViewstate(viewState: string): Promise<void> {
    // Store Zigzag data
    await this.hass!.callWS({
      type: `frontend/set_user_data`,
      key: `zigzag-panel-viewstate`,
      value: viewState,
    });
  }
}

customElements.define(`custom-panel-zigzag`, ZigzagPanel);
