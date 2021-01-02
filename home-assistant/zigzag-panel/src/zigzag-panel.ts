import { ZigzagWC } from "@samantha-uk/zigzag-wc";
import { HomeAssistant } from "custom-card-helpers";
import { property, PropertyValues } from "lit-element";

export class ZigzagPanel extends ZigzagWC {
  @property({ attribute: false }) public hass!: HomeAssistant;

  protected async firstUpdated(
    changedProperties: PropertyValues
  ): Promise<void> {
    this.setConfiguration(
      {
        apiVersionRequired: `1.0.0`,
        id: `plugin-data-zha`,
        connection: this.hass.connection,
        // filePath: `/local/zigzag/zhadevices.json`,
        pluginPath: `/local/zigzag/plugins`,
      },
      {
        apiVersionRequired: `1.0.0`,
        id: `plugin-layout-d3`,
        pluginPath: `/local/zigzag/plugins`,
      },
      {
        apiVersionRequired: `1.0.0`,
        id: `plugin-render-pixi`,
        pluginPath: `/local/zigzag/plugins`,
      }
    );
    super.firstUpdated(changedProperties);
  }
}

customElements.define(`custom-panel-zigzag`, ZigzagPanel);
