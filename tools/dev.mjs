#!/usr/bin/env node
/* ============================================================
   Local preview — khxngLX
   ------------------------------------------------------------
   Serves the site and rebuilds whenever content.json or a photo
   in artwork/ changes. Look at it here before you push.

   Run:  npm run dev        then open the url it prints

   Serving over http rather than opening index.html from disk
   also matters: browsers treat file:// pages as their own
   origin, which breaks things the real site does fine.
   ============================================================ */

import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const dim = s => `\x1b[2m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;

// ---- build, serialised so two saves can't overlap -------------------
let building = false;
let queued = false;

function build(reason) {
  if (building) { queued = true; return; }
  building = true;

  if (reason) console.log(dim(`\n  ${reason} — rebuilding`));

  const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'build.mjs')], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    building = false;
    if (code !== 0) console.log(red('  build failed — the last good files are still being served'));
    if (queued) { queued = false; build('another change'); }
  });
}

// ---- static server ---------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';

    // keep requests inside the project folder
    const full = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!full.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    if (!existsSync(full)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + rel);
      return;
    }

    const body = await fs.readFile(full);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',      // always see the newest build
    }).end(body);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end(String(e));
  }
});

server.listen(PORT, () => {
  console.log(`\n  ${green('khxngLX')} running at ${green(`http://localhost:${PORT}`)}`);
  console.log(dim('  watching content.json and artwork/ — Ctrl+C to stop\n'));
  build();
});

// ---- watch ------------------------------------------------------------
let timer = null;
const nudge = (reason) => {
  clearTimeout(timer);                 // editors write in bursts; wait for quiet
  timer = setTimeout(() => build(reason), 250);
};

if (existsSync(path.join(ROOT, 'content.json'))) {
  watch(path.join(ROOT, 'content.json'), () => nudge('content.json changed'));
}

const artwork = path.join(ROOT, 'artwork');
if (existsSync(artwork)) {
  watch(artwork, (_e, file) => nudge(file ? `artwork/${file} changed` : 'artwork changed'));
} else {
  console.log(dim('  (no artwork/ folder yet — create one and drop photos in)\n'));
}
