import { loadConfig } from './config.js';
import { push } from './commands/push.js';
import { pull } from './commands/pull.js';
import { diff } from './commands/diff.js';
import { error } from './logger.js';

const VERSION = '0.1.0';

const HELP = `
Usage: vela <command> [options]

Commands:
  push    Sync local schema files to the remote Vela API
  pull    Download remote schemas to local JSON files
  diff    Show pending changes without pushing

Options:
  --app <slug>      App slug or ID (overrides vela.config.json)
  --dir <path>      Schemas directory (overrides vela.config.json)
  --base-url <url>  API base URL (overrides vela.config.json)
  --help            Show this help message
  --version         Show version
`.trim();

function parseArgs(argv: string[]) {
  const command = argv[0];
  const overrides: { app?: string; dir?: string; baseUrl?: string } = {};

  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--app' && argv[i + 1]) {
      overrides.app = argv[++i];
    } else if (argv[i] === '--dir' && argv[i + 1]) {
      overrides.dir = argv[++i];
    } else if (argv[i] === '--base-url' && argv[i + 1]) {
      overrides.baseUrl = argv[++i];
    }
  }

  return { command, overrides };
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.length === 0) {
    console.log(HELP);
    return;
  }

  if (argv.includes('--version')) {
    console.log(VERSION);
    return;
  }

  const { command, overrides } = parseArgs(argv);

  const config = loadConfig(overrides);

  switch (command) {
    case 'push':
      await push(config);
      break;
    case 'pull':
      await pull(config);
      break;
    case 'diff':
      await diff(config);
      break;
    default:
      error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((err: Error) => {
  error(err.message || String(err));
  process.exitCode = 1;
});
