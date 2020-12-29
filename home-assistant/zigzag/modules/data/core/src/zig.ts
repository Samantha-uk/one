export enum ZigRole {
  Coordinator = `Coordinator`,
  EndDevice = `EndDevice`,
  Router = `Router`,
  Unknown = `Unknown`,
}

export interface Zig {
  area_id?: string;
  available: boolean;
  device_reg_id: string;
  device_type: string;
  endpoint_names: { name: string }[];
  entities?: string[];
  id: string;
  ieee: string;
  last_seen: string;
  lqi: number;
  manufacturer_code: string;
  manufacturer: string;
  model: string;
  name: string;
  nwk?: string;
  power_source?: string;
  primary_entity?: string;
  quirk_applied: boolean;
  quirk_class: string;
  role: ZigRole.Unknown;
  rssi: number;
  signature?: string;
  user_given_name?: string;
}
