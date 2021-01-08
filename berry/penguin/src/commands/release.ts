import { BaseCommand } from "@yarnpkg/cli";

export default class Release extends BaseCommand {
  @Command.String()
  commandName!: string;

  @Command.Proxy()
  args: Array<string> = [];

  static usage: Usage = Command.Usage({
    category: `Release-related commands`,
    description: `runs release on a workspace.`,
    details: `
      This command will release the current workspace; this includes:
      determining the next version number, building any release notes & publishing the package.
      release can be used with 'yarn workspaces foreach' to release some/all workspaces.
    `,
    examples: [[
      `Release current workspace package`,
      `yarn release`,
    ]],
  });

  @Command.Path(`release`)
  async execute() {
    // Find the configuration.
    const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
    const {project, workspace: cwdWorkspace} = await Project.find(configuration, this.context.cwd);


    if (!cwdWorkspace)
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd);

    const command = this.cli.process([this.commandName, ...this.args]) as {path: Array<string>, scriptName?: string};

    let commandCount = 0;
    let finalExitCode: number | null = null;

    const report = await StreamReport.start({
      configuration,
      stdout: this.context.stdout,
    }, async report => {
      const runCommand = async (workspace: Workspace, {commandIndex}: {commandIndex: number}) => {

        const prefix = getPrefix(workspace, {configuration, verbose: this.verbose, commandIndex});

        const [stdout, stdoutEnd] = createStream(report, {prefix, interlaced});
        const [stderr, stderrEnd] = createStream(report, {prefix, interlaced});

        try {
          const exitCode = (await this.cli.run([this.commandName, ...this.args], {
            cwd: workspace.cwd,
            stdout,
            stderr,
          })) || 0;

          stdout.end();
          stderr.end();

          const emptyStdout = await stdoutEnd;
          const emptyStderr = await stderrEnd;

          if (this.verbose && emptyStdout && emptyStderr)
            report.reportInfo(null, `${prefix} Process exited without output (exit code ${exitCode})`);


          return exitCode;
        } catch (err) {
          stdout.end();
          stderr.end();

          await stdoutEnd;
          await stderrEnd;

          throw err;
        }
      };

    });
      return report.exitCode();
    }
  }
}