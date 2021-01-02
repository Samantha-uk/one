import * as z from "zod";

const PluginConfigBaseSchema = z
  .object({
    apiVersionRequired: z.string(),
    pluginPath: z.string(),
    id: z.string(),
  })
  .catchall(z.unknown());

type PluginConfigBase = z.infer<typeof PluginConfigBaseSchema>;

abstract class PluginBase {
  public id = `plugin`;

  constructor(readonly apiVersionProvided?: string) {}
}

export { PluginConfigBase, PluginConfigBaseSchema, PluginBase };
