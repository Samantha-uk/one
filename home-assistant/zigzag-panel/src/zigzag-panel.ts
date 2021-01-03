import { ZigzagWC } from "@samantha-uk/zigzag-wc";
import { HomeAssistant, Panel } from "custom-card-helpers";
import { property, PropertyValues } from "lit-element";

export class ZigzagPanel extends ZigzagWC {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public panel!: Panel;

  protected async firstUpdated(
    changedProperties: PropertyValues
  ): Promise<void> {
    const zzc = this.panel.config?.zigzag;

    // Set the configuration in this web component.
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
}

customElements.define(`custom-panel-zigzag`, ZigzagPanel);
