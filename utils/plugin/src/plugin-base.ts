export interface PluginConfigBase {
  apiVersionRequired: string;
  id: string;
}

export abstract class PluginBase {
  public id = `plugin`;

  constructor(readonly apiVersionProvided?: string) {}
}
