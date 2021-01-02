import { PluginConfigBaseSchema } from "@samantha-uk/utils-plugin";
import {
  PluginDataBase,
  ZHADevice,
  ZHA_UNKNOWN,
  Zag,
  Zig,
} from "@samantha-uk/zigzag-data";
import * as z from "zod";

// Add any plugin specific configuration elements.
export const PluginConfigSchema = PluginConfigBaseSchema.merge(
  z.object({
    filePath: z.string().nonempty(),
    count: z.number().positive(),
  })
);

type PluginConfig = z.infer<typeof PluginConfigSchema>;

interface ZHADevicesFile {
  result: ZHADevice[];
}
// Datasource used to read zigs & zags from a file and then generate more.
// The file format is the response json that a call to zha/devices produces.
// Can be created by copying the response from a web browser network trace.

export class DataPlugin extends PluginDataBase {
  public readonly fqpi = `${this.id}-gen`;

  public readonly config: PluginConfig;

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  // Fetch the device data using web sockets
  public async fetchData(): Promise<{ zigs: Zig[]; zags: Zag[] }> {
    const _zigs: Zig[] = [];
    const _zags: Zag[] = [];

    try {
      const zhaDevices = (await (
        await fetch(this.config.filePath)
      ).json()) as ZHADevicesFile;

      DataPlugin._generateMoreDevices(
        this.config.count - zhaDevices.result.length,
        zhaDevices.result
      );

      DataPlugin._mapDevices(zhaDevices.result, _zigs, _zags);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`Zigzag plugin-data-gen -> fetchData failed with ${error}`);
    }
    return { zigs: _zigs, zags: _zags };
  }

  private static _fixupDevices(zigs: Zig[], zags: Zag[]) {
    zags.forEach((zag: Zag) => {
      // Check to ensure the neighbor Zig exists
      const _zigToFind = zigs.find((zig: Zig) => zig.ieee === zag.ieee);
      // Absence means the neighbor scan reports a device that ZHA does not know about.
      // We will create a dummy Zig to reflect this.
      if (!_zigToFind) {
        zigs.push(({
          ieee: zag.ieee,
          name: `Unknown Neighbor`,
          device_type: zag.device_type,
          nwk: 0,
          lqi: zag.lqi,
          rssi: 0,
          last_seen: ZHA_UNKNOWN,
          manufacturer: ZHA_UNKNOWN,
          model: ZHA_UNKNOWN,
          quirk_applied: ZHA_UNKNOWN,
          quirk_class: ZHA_UNKNOWN,
          manufacturer_code: ZHA_UNKNOWN,
          device_reg_id: ZHA_UNKNOWN,
          power_source: ZHA_UNKNOWN,
          available: true,
        } as unknown) as Zig);
      }
    });
  }

  private static _generateMoreDevices(
    noOfDevicesToAdd: number,
    zhaDevices: ZHADevice[]
  ) {
    const deviceCount = zhaDevices.length;
    for (let genIndex = 0; genIndex <= noOfDevicesToAdd; genIndex++) {
      // Grab a random device from the original batch.
      const deviceToCopy = zhaDevices[Math.floor(Math.random() * deviceCount)];
      const newDevice = { ...deviceToCopy };
      newDevice.neighbors = { ...deviceToCopy.neighbors };
      newDevice.ieee = newDevice.ieee.split(``).reverse().join(``);
      newDevice.name = `g${newDevice.name}`; // reverse the ieee;
      zhaDevices.push(newDevice);
    }
  }

  // Map the data into the zig objects.
  private static _mapDevices(
    zhaDevices: ZHADevice[],
    zigs: Zig[],
    zags: Zag[]
  ): void {
    zigs.length = 0;
    for (const device of zhaDevices) {
      const newZig = ({ ...device } as unknown) as Zig;
      newZig.user_given_name = `${newZig.name} - ${newZig.ieee}`;
      zigs.push(newZig);

      // Map the device neighbor structure into Zags.
      DataPlugin._mapZags(device, zags);
    }

    // Ensure consistency between zigs & zags
    DataPlugin._fixupDevices(zigs, zags);
  }

  private static _mapZags(device: ZHADevice, zags: Zag[]): void {
    for (const neighbor of device.neighbors) {
      zags.push(({ from: device.ieee, ...neighbor } as unknown) as Zag);
    }
  }
}

export function createPlugin(config: PluginConfig): DataPlugin {
  return new DataPlugin(config);
}
