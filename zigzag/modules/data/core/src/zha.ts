import type { HassEntity } from "home-assistant-js-websocket";

export const ZHA_UNKNOWN = `Unknown`;

export interface ZHAEntityReference extends HassEntity {
  name: string;
  original_name?: string;
}

export interface ZHADevice {
  name: string;
  ieee: string;
  nwk: string;
  lqi: string;
  rssi: string;
  last_seen: string;
  manufacturer: string;
  model: string;
  quirk_applied: boolean;
  quirk_class: string;
  entities: ZHAEntityReference[];
  manufacturer_code: number;
  neighbors: ZHANeighbor[];
  device_reg_id: string;
  user_given_name?: string;
  power_source?: string;
  area_id?: string;
  device_type: string;
  available: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signature: any;
}

export interface ZHANeighbor {
  depth: number;
  device_type: string;
  ieee: string;
  lqi: number;
  permit_joining: string;
  nwk: string;
  extended_pan_id: string;
  relationship: string;
  rx_on_when_idle: string;
}
