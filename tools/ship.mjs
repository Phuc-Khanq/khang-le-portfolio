#!/usr/bin/env node
/* ============================================================
   Build, commit, push — khxngLX
   ------------------------------------------------------------
   Run:  npm run ship
         npm run ship -- "added the new single"

   The build runs first and has to pass. If the content has a
   problem, nothing is committed and nothing is pushed — the
   live site keeps working while you fix it.
   ============================================================ */

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const dim = s => `\x1b[2m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;
const bold = s => `\x1b[1m${s}\x1b[0m`;

const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });

const runLoud = (cmd, args) => run(cmd, args, { stdio: 'inherit' });

// ---- 1. build must pass ----------------------------------------------
const build = runLoud(process.execPath, [path.join(ROOT, 'tools', 'build.mjs')]);
if (build.status !== 0) {
  console.error(red('\n  Build failed — nothing committed, nothing pushed.'));
  console.error(dim('  Fix what it reported above and run it again.\n'));
  process.exit(1);
}

// ---- 2. is this even a git repo, with somewhere to push? -------------
if (run('git', ['rev-parse', '--is-inside-work-tree']).status !== 0) {
  console.error(red('\n  This folder is not a git repository.\n'));
  process.exit(1);
}

const remote = run('git', ['remote']).stdout.trim();
if (!remote) {
  console.error(red('\n  No git remote is set, so there is nowhere to push.'));
  console.error(dim('  Add one with:  git remote add origin <url>\n'));
  process.exit(1);
}

// ---- 3. anything to commit? -------------------------------------------
const status = run('git', ['status', '--porcelain']).stdout.trim();
if (!status) {
  console.log(dim('\n  Nothing has changed since the last push. Done.\n'));
  process.exit(0);
}

console.log(bold('\n  About to commit:'));
for (const line of status.split('\n').slice(0, 20)) console.log(dim('    ' + line));
if (status.split('\n').length > 20) {
  console.log(dim(`    …and ${status.split('\n').length - 20} more`));
}

// ---- 4. commit and push ------------------------------------------------
const message = process.argv.slice(2).join(' ').trim() || 'Update site content';

if (runLoud('git', ['add', '-A']).status !== 0) {
  console.error(red('\n  git add failed.\n'));
  process.exit(1);
}

if (runLoud('git', ['commit', '-m', message]).status !== 0) {
  console.error(red('\n  git commit failed — see above.\n'));
  process.exit(1);
}

const push = runLoud('git', ['push']);
if (push.status !== 0) {
  console.error(red('\n  Push failed. The commit is saved locally, so nothing is lost.'));
  console.error(dim('  If this is the first push on a new branch, try:  git push -u origin main\n'));
  process.exit(1);
}

console.log(green(`\n  ✓ Pushed — "${message}"`));
console.log(dim('  GitHub Pages usually takes a minute or two to update.\n'));
