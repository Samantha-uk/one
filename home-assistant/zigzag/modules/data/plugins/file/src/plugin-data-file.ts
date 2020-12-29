import {
  PluginDataBase,
  PluginConfigData,
  ZHADevice,
  ZHA_UNKNOWN,
  Zag,
  Zig,
} from "@samantha-uk/zigzag-data";

interface ZHADevicesFile {
  result: ZHADevice[];
}

interface PluginConfigDataFile extends PluginConfigData {
  fileUrl: string;
}
// DataPlugin to read zigs & zags from a file.
// The file format is that of the response json that a call to zha/devices produces.
// Can be created by copying the response from a web browser network trace.
export class DataPlugin extends PluginDataBase {
  public readonly fqpi: string;

  public readonly config: PluginConfigDataFile;

  constructor(config: PluginConfigDataFile) {
    super();
    this.fqpi = `${this.id}-file`;
    this.config = config;
  }

  // Fetch the device data from a file
  public async fetchData(): Promise<{ zigs: Zig[]; zags: Zag[] }> {
    const _zigs: Zig[] = [];
    const _zags: Zag[] = [];

    try {
      const zhaDevices = (await (
        await fetch(this.config.fileUrl as string)
      ).json()) as ZHADevicesFile;

      DataPlugin._mapDevices(zhaDevices.result, _zigs, _zags);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`Zigzag plugin-data-file -> fetchData failed:`, error);
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
          name: ZHA_UNKNOWN,
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

  // Map the data into the zig objects.
  private static _mapDevices(
    zhaDevices: ZHADevice[],
    zigs: Zig[],
    zags: Zag[]
  ): void {
    zigs.length = 0;
    for (const device of zhaDevices) {
      zigs.push(({ ...device } as unknown) as Zig);

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

export function createPlugin(config: PluginConfigDataFile): DataPlugin {
  return new DataPlugin(config);
}
