import { Logger } from "@samantha-uk/utils-logger";
import { red, green, bold } from "kleur/colors";
import * as SemVer from "semver";
import * as z from "zod";
import {
  PluginBase,
  PluginConfigBase,
  PluginConfigBaseSchema,
} from "./plugin-base";

const log = new Logger(`plugin`);

export function PluginLoader<PluginClassType extends PluginBase>(
  config: PluginConfigBase
): Promise<PluginClassType> {
  let fqpp = `undefined`;

  return new Promise<PluginClassType>((resolve, reject) => {
    try {
      // Check the config has the basic fields in it.
      PluginConfigBaseSchema.check(config);

      // Construct a fully qualified plugin path.
      fqpp = `${config.pluginPath}/${config.id}.esm.js`;

      log.info(`Looking for ${fqpp}.`);

      // Try to load the specified plugin
      import(fqpp)
        .then((pluginModule) => {
          const plugin = pluginModule.createPlugin(config);

          // Check that the plugin is of the specified type.
          if (plugin.fqpi !== config.id) {
            const message = `${plugin} ${red(`is not a recognised plugin`)}`;
            log.error(message);
            return reject(new Error(message));
          }

          // Check the plugin supports the API version specified.
          if (!SemVer.satisfies(plugin.apiVersion, config.apiVersionRequired)) {
            const message = `${plugin} API v${plugin.apiVersionProvided} does not provide the required API v${config.apiVersionRequired}}`;
            log.error(message);
            return reject(new Error(message));
          }
          log.success(`loaded ${green(bold(fqpp))}.`);

          return resolve(plugin);
        })
        .catch((error) => {
          log.fatal(`unable to load plugin ${fqpp} due to ${error}.`);
          reject(error);
        });
    } catch (error) {
      log.fatal(`unable to load plugin ${fqpp} due to ${error}.`);
    }
  });
}
