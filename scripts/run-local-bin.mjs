import { spawnSync } from 'node:child_process';
import path from 'node:path';

const [, , binName, ...args] = process.argv;

if (!binName) {
  console.error('Usage: node scripts/run-local-bin.mjs <bin> [...args]');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const binFile = isWindows ? `${binName}.cmd` : binName;
const binPath = path.join(process.cwd(), 'node_modules', '.bin', binFile);
const escapedArgs = args.map((arg) => {
  if (/^[A-Za-z0-9_./:-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
});

const result = spawnSync(
  isWindows ? `"${binPath}" ${escapedArgs.join(' ')}` : binPath,
  isWindows ? [] : args,
  {
    stdio: 'inherit',
    shell: isWindows,
    env: process.env,
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
