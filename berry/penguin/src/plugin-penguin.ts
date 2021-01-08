import {Plugin} from '@yarnpkg/core';
import release from './commands/release';

const plugin: Plugin = {
  commands: [
    release,
  ],
};

// eslint-disable-next-line arca/no-default-export
export default plugin;