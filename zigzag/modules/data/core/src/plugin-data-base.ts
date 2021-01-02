import { PluginBase } from "@samantha-uk/utils-plugin";
import { Zag } from "./zag";
import { Zig } from "./zig";
/**
 * The set of data plugins officially supported
 */
export enum DataPluginID {
  // DECONZ = `deconz`,
  FILE = `file`,
  GEN = `gen`,
  // Z2M = `z2m`,
  ZHA = `zha`,
}

export abstract class PluginDataBase extends PluginBase {
  public readonly apiVersion = `1.0.0`;

  constructor() {
    super();
    this.id = `${this.id}-data`;
  }

  abstract fetchData(): Promise<{ zigs: Zig[]; zags: Zag[] }>;
}
