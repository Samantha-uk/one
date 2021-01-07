import {CommandContext, Plugin} from '@yarnpkg/core';
import {Command} from 'clipanion';

class PenguinCommand extends Command<CommandContext> {
  @Command.String(`--name`)
  name: string = `John Doe`;

  @Command.Path(`hello`, `world`)
  async execute() {
    console.log(`Hello ${this.name}!`);
  }
}

const plugin: Plugin = {
  commands: [
    PenguinCommand,
  ],
};

export default plugin;
