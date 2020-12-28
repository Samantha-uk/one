/* eslint-disable no-console */
import { grey } from "kleur/colors";

const bee = `\u{1F41D}`;
const debug = `\u{1F3F7}`;
const tick = `\u{2705}`;
const error = `\u{2757}`;
const warning = `\u{26A0}`;
const info = `\u{2139}`;
const fatal = `\u{203C}`;
const play = `\u{1F41D}`;

export class Logger {
  private _prefix: string;

  constructor(module: string) {
    this._prefix = `${grey(`Zig${bee}Zag`)} ${grey(`[${module}]`)}`;
  }

  public debug(message: string): void {
    console.log(`${this._prefix} ${debug} ${message}`);
  }

  public error(message: string): void {
    console.log(`${this._prefix} ${error} ${message}`);
  }

  public fatal(message: string): void {
    console.log(`${this._prefix} ${fatal} ${message}`);
  }

  public info(message: string): void {
    console.log(`${this._prefix} ${info} ${message}`);
  }

  public success(message: string): void {
    console.log(`${this._prefix} ${tick} ${message}`);
  }

  public start(message: string): void {
    console.log(`${this._prefix} ${play} ${message}`);
  }

  public warn(message: string): void {
    console.log(`${this._prefix} ${warning} ${message}`);
  }
}
/* eslint-enable no-console */
