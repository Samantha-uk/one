#!/bin/env node
/* eslint-disable no-console, import/first */
import { readFileSync } from "fs";
import chalk from "chalk";
import commonjs from "@rollup/plugin-commonjs";
import del from "rollup-plugin-delete";
import meow from "meow";
import nodeResolve from "@rollup/plugin-node-resolve";
import * as rollup from "rollup";
import serve from "rollup-plugin-serve";
import ts from "@rollup/plugin-typescript";
import { Signale } from "signale";
import figures from "figures";

const log = new Signale({
  scope: `builder`,
  stream: process.stdout,
  types: {
    complete: {
      badge: figures.checkboxOn,
      color: `cyan`,
      label: ``,
    },
    error: {
      badge: figures.cross,
      color: `red`,
      label: ``,
      stream: [process.stdout, process.stderr],
    },
    fatal: {
      badge: `‼`,
      color: `red`,
      label: ``,
      stream: [process.stdout, process.stderr],
    },
    info: {
      badge: figures.info,
      color: `blue`,
      label: ``,
    },
    start: {
      badge: figures.play,
      color: `green`,
      label: ``,
    },
    success: {
      badge: figures.tick,
      color: `green`,
      label: ``,
    },
    warn: {
      badge: figures.warning,
      color: `yellow`,
      label: ``,
      stream: [process.stdout, process.stderr],
    },
  },
});
let isCleanBuild = true;

interface CommandLineFlags {
  watch: boolean;
  serve: boolean;
}
const box = {
  topLeft: `┌`,
  topRight: `┐`,
  bottomRight: `┘`,
  bottomLeft: `└`,
  vertical: `│`,
  horizontal: `─`,
};
const tsInclude = [`src/**/*.ts`];
const tsExclude = [`dist`];
const nodeExtensions = [`.ts`, `.js`, `.jsx`, `.es6`, `.es`, `.mjs`];

let watchOptions: false | rollup.WatcherOptions = false;
// Setup progress reporting
const monitorProgress = () => ({
  name: `monitorProgress`,
  buildStart() {
    log.start(`Building`);
  },
  buildEnd(error?: Error) {
    if (error) {
      log.error(`${error.message}`);
      isCleanBuild = false;
    }
  },

  renderError(error?: Error) {
    log.error(`${error.message}`);
  },
  writeBundle(
    options: rollup.NormalizedOutputOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _bundle: rollup.OutputBundle
  ) {
    log.info(`writeBundle ${options.file}`);
  },
});

const plugins = [
  del({
    targets: `dist/*`,
    runOnce: true,
  }),
  monitorProgress(),
  commonjs(),
  nodeResolve({ extensions: nodeExtensions, preferBuiltins: false }),
  ts({
    include: tsInclude,
    exclude: tsExclude,
    tsconfig: false,
    allowSyntheticDefaultImports: true,
    declaration: true,
    declarationDir: `dist`,
    declarationMap: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    forceConsistentCasingInFileNames: true,
    lib: [`dom`, `DOM.Iterable`, `ESNext`],
    moduleResolution: `node`,
    noEmitOnError: false,
    noErrorTruncation: true,
    noFallthroughCasesInSwitch: false,
    noImplicitReturns: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    outDir: `dist`,
    resolveJsonModule: true,
    skipLibCheck: true,
    strict: true,
    target: `ESNext`,
  }),
];

function onwarn(
  warning: rollup.RollupWarning,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _defaultHandler: rollup.WarningHandler
) {
  if (warning.code === `CIRCULAR_DEPENDENCY`) {
    return;
  }
  log.warn(
    `${box.topLeft}${chalk.yellow(
      warning.code ?? ``
    )} ${`${chalk.blueBright`File`}:[${warning.loc?.file ?? ``
    }]`} ${`${chalk.blueBright(`Line`)}:[${warning.loc?.line ?? ``}]`}`
  );
  log.warn(`${box.bottomLeft}${warning.message}`);
  isCleanBuild = false;
}

async function bundleIt(
  bundle: rollup.RollupBuild,
  outputOptions: rollup.OutputOptions[]
) {
  log.start(`Bundling started`);
  // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
  return Promise.all(outputOptions.map(bundle.write)).catch((error) => {
    log.error(`${error}`);
    isCleanBuild = false;
  });
}

async function buildIt(flags: CommandLineFlags): Promise<boolean> {
  if (flags.watch) {
    watchOptions = {
      buildDelay: 0,
      clearScreen: false,
      include: tsInclude,
    } as rollup.WatcherOptions;
    log.info(`watch mode selected`);
  }

  if (flags.serve) {
    plugins.push(
      serve({
        verbose: true,
        host: `0.0.0.0`,
        port: 8000,
        allowCrossOrigin: true,
        headers: {
          "Access-Control-Allow-Origin": `*`,
        },
      })
    );
    log.info(`serve mode selected`);
  }

  let packageName = ``;
  try {
    const packageJSON = JSON.parse(readFileSync(`./package.json`, `utf8`));
    packageName = packageJSON.name;
    log.start(`Processing ${chalk.cyan(packageName)}`);

    const inputOptions: rollup.InputOptions = {
      input: packageJSON.source,
      watch: watchOptions,
      external: packageJSON.external,
      treeshake: true,
      plugins,
      onwarn,
    };

    const outputOptions: rollup.OutputOptions[] = [
      {
        file: packageJSON.main,
        format: `cjs`,
        sourcemap: true,
      },
      {
        file: packageJSON.module,
        format: `es`,
        sourcemap: true,
      },
    ];

    // Are we doing a one off run?
    if (!watchOptions) {
      const bundle = await rollup.rollup(inputOptions).catch((error) => {
        log.error(`${error}`);
        isCleanBuild = false;
      });

      if (isCleanBuild && bundle) {
        log.success(`Building complete`);
        await bundleIt(bundle, outputOptions).catch((error) => {
          log.error(`${error}`);
          isCleanBuild = false;
        });
      } else {
        log.error(`Building failed`);
      }
    } else {
      const watcher = rollup.watch({
        input: inputOptions,
        output: outputOptions,
        watch: watchOptions,
      } as rollup.RollupWatchOptions);

      watcher.on(`event`, (event) => {
        switch (event.code) {
          case `START`:
            log.info(`start`);

            break;
          case `BUNDLE_START`:
            log.info(`bundle start`);
            break;
          case `BUNDLE_END`:
            log.info(`bundle end`);
            break;
          case `END`:
            log.info(`end`);
            break;
          case `ERROR`:
            log.info(`error`);
            log.info(`${event.error}`);
            isCleanBuild = false;
          // no default
        }
      });
    }
  } catch (error) {
    log.fatal(`${error.code} ${error.frame} ${error.id} ${error.message} `);
    isCleanBuild = false;
  }
  return isCleanBuild;
}

const cli = meow(
  `
	Usage
	  $ builder

	Options
    --watch      Watch files in bundle and rebuild on changes.
    --serve      Serve the bundle.
`,
  {
    flags: {
      watch: { type: `boolean` },
      serve: { type: `boolean` },
    },
  }
);

async function main(flags: CommandLineFlags) {
  const startTime = Date.now();

  const isBuildSuccessful = await buildIt(flags);

  if (isBuildSuccessful) {
    log.success(
      `Finished after: ${chalk.greenBright((Date.now() - startTime) / 1000)}s`
    );
  } else {
    log.fatal(
      `Failed after: ${chalk.redBright((Date.now() - startTime) / 1000)}s`
    );
    process.exitCode = 1;
  }
}

main(cli.flags as CommandLineFlags);
/* eslint-enable no-console, import/first */
