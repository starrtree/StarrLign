import fs from 'node:fs';
import path from 'node:path';

function copyDir(source, destination) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = process.cwd();
const standaloneRoot = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standaloneRoot)) {
  console.error('Standalone output not found. Run the build first.');
  process.exit(1);
}

copyDir(path.join(root, '.next', 'static'), path.join(standaloneRoot, '.next', 'static'));
copyDir(path.join(root, 'public'), path.join(standaloneRoot, 'public'));
