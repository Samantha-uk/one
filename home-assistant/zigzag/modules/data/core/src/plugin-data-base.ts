import { PluginBase, PluginConfigBase } from "@samantha-uk/utils-plugin";
import { Zag } from "./zag";
import { Zig } from "./zig";
/**
 * The set of data plugins officially supported
 */
export enum DataPluginID {
  BASE = `plugin-data`,
  // DECONZ = `deconz`,
  FILE = `file`,
  GEN = `gen`,
  // Z2M = `z2m`,
  ZHA = `zha`,
}

export interface PluginConfigData extends PluginConfigBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: string | number | boolean | any;
}
export abstract class PluginDataBase extends PluginBase {
  public readonly apiVersion = `1.0.0`;

  abstract config: PluginConfigData;

  abstract fetchData(): Promise<{ zigs: Zig[]; zags: Zag[] }>;

  constructor() {
    super();
    this.id = `${this.id}-data`;
  }
}
