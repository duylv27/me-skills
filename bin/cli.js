#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const [, , command] = process.argv;

if (command !== 'install') {
  console.error('Usage: npx javme-skills install');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const copilotDir = path.join(os.homedir(), '.copilot');

const targets = [
  { src: path.join(root, 'skills'), dest: path.join(copilotDir, 'skills') },
  { src: path.join(root, 'agents'), dest: path.join(copilotDir, 'agents') },
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const { src, dest } of targets) {
  copyDir(src, dest);
  console.log(`✔ Installed ${path.basename(src)}/ → ${dest}`);
}

console.log('\nDone. Restart VS Code to pick up the new skills and agents.');
