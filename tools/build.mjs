#!/usr/bin/env node
/* ============================================================
   Site build — khxngLX
   ------------------------------------------------------------
   Reads content.json, turns any new photo in artwork/ into the
   sizes the site needs, and writes the two generated files the
   page loads.

   Run:  npm run build          normal
         npm run build -- -f    redo every image from scratch

   Nothing is written unless the content checks out, so a bad
   edit can't take the live site down.
   ============================================================ */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTWORK = path.join(ROOT, 'artwork');
const ART = path.join(ROOT, 'art');
const SCRIPTS = path.join(ROOT, 'scripts');
const CONTENT = path.join(ROOT, 'content.json');

const SIZES = { sm: 900, lg: 1700 };      // long edge, px
const QUALITY = { sm: 75, lg: 78 };
const SOURCE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'];

const FORCE = process.argv.includes('-f') || process.argv.includes('--force');

// ---- tiny console helpers ------------------------------------------
const c = {
  dim:  s => `\x1b[2m${s}\x1b[0m`,
  red:  s => `\x1b[31m${s}\x1b[0m`,
  green:s => `\x1b[32m${s}\x1b[0m`,
  amber:s => `\x1b[33m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
};

const problems = [];
const warnings = [];
const fail = (where, msg, hint) => problems.push({ where, msg, hint });
const warn = (msg) => warnings.push(msg);

// ---- sharp is optional-until-needed, so the error is friendly -------
let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error(c.red('\nCould not load sharp, which resizes the photos.\n'));
  console.error('Run this once, then try again:\n');
  console.error(c.bold('  npm install\n'));
  process.exit(1);
}

/** _DSC9303.jpg -> dsc9303 — the id you reference in content.json */
const idFor = (filename) =>
  path.basename(filename, path.extname(filename)).replace(/^_+/, '').toLowerCase();

/** Strip _readme / _note keys so they never reach the browser. */
function stripNotes(value) {
  if (Array.isArray(value)) return value.map(stripNotes);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (!k.startsWith('_')) out[k] = stripNotes(v);
    }
    return out;
  }
  return value;
}

// ---- 1. read content.json ------------------------------------------
let raw, content;
try {
  raw = await fs.readFile(CONTENT, 'utf8');
} catch {
  console.error(c.red(`\nNo content.json found at ${CONTENT}\n`));
  process.exit(1);
}

try {
  content = JSON.parse(raw);
} catch (e) {
  console.error(c.red('\ncontent.json is not valid JSON.\n'));

  // Node phrases these three different ways, and only some carry a
  // position. A stray comma — much the most likely mistake here — gets
  // only a snippet, so fall back to finding that snippet in the file.
  let line = null, col = null;

  const lineCol = /\(line (\d+) column (\d+)\)/.exec(e.message);
  const pos = /position (\d+)/.exec(e.message);
  const snippet = /\.\.\."([\s\S]*?)"\.\.\./.exec(e.message);

  if (lineCol) {
    line = Number(lineCol[1]);
    col = Number(lineCol[2]);
  } else if (pos) {
    const upto = raw.slice(0, Number(pos[1]));
    line = upto.split('\n').length;
    col = upto.length - upto.lastIndexOf('\n');
  } else if (snippet) {
    const at = raw.indexOf(snippet[1]);
    if (at !== -1) {
      const upto = raw.slice(0, at);
      line = upto.split('\n').length;
      col = upto.length - upto.lastIndexOf('\n');
    }
  }

  if (line) {
    const lines = raw.split('\n');
    const from = Math.max(0, line - 3);
    console.error(c.dim(`  line ${line}:\n`));
    for (let i = from; i < Math.min(lines.length, line + 2); i++) {
      const n = String(i + 1).padStart(5);
      const isBad = i === line - 1;
      console.error((isBad ? c.red(n) : c.dim(n)) + '  ' + lines[i]);
      if (isBad && col) console.error(' '.repeat(6 + col) + c.red('^'));
    }
    console.error('');
  } else {
    console.error('  ' + e.message + '\n');
  }

  console.error(c.dim('  Usually a missing comma, a trailing comma before } or ],\n' +
                      '  or a quote that was never closed.\n'));
  process.exit(1);
}

// ---- 2. index whatever is sitting in artwork/ ----------------------
const sources = new Map();   // id -> absolute path
if (existsSync(ARTWORK)) {
  for (const f of await fs.readdir(ARTWORK)) {
    if (!SOURCE_EXT.includes(path.extname(f).toLowerCase())) continue;
    const id = idFor(f);
    if (sources.has(id)) {
      warn(`Two photos both map to the id "${id}": ` +
           `${path.basename(sources.get(id))} and ${f}. Using the first.`);
      continue;
    }
    sources.set(id, path.join(ARTWORK, f));
  }
}

// ---- 3. what does the content actually ask for? --------------------
const referenced = new Map();   // id -> [ 'projects[0] "untitled"', ... ]
const noteRef = (id, where) => {
  if (!id) return;
  if (!referenced.has(id)) referenced.set(id, []);
  referenced.get(id).push(where);
};

const projects = Array.isArray(content.projects) ? content.projects : [];
const stills = Array.isArray(content.stills) ? content.stills : [];

if (!projects.length) warn('No projects in content.json — the index will be empty.');

const seenSlugs = new Map();
projects.forEach((p, i) => {
  const at = `projects[${i}]`;
  if (!p.slug) fail(at, 'missing "slug"', 'A short url-safe name, e.g. "night-sessions".');
  if (!p.title) fail(at, 'missing "title"');

  if (p.slug) {
    if (seenSlugs.has(p.slug)) {
      fail(at, `duplicate slug "${p.slug}"`,
           `Already used by projects[${seenSlugs.get(p.slug)}]. Slugs are the page urls, so they must be unique.`);
    } else {
      seenSlugs.set(p.slug, i);
    }
    if (!/^[a-z0-9-]+$/.test(p.slug)) {
      fail(at, `slug "${p.slug}" has characters that don't belong in a url`,
           'Lowercase letters, numbers and hyphens only.');
    }
  }
  noteRef(p.img, `${at} "${p.title || p.slug || '?'}"`);
});

stills.forEach((s, i) => {
  const at = `stills[${i}]`;
  if (!s.img) fail(at, 'missing "img"', 'A still with no photo has nothing to show.');
  noteRef(s.img, `${at} "${s.cap || '?'}"`);
});

// the About headshot goes through the same image pipeline
if (content.about?.headshot) {
  noteRef(content.about.headshot, 'about.headshot');
}

// Placeholders I couldn't fill in — nag until they're real.
const todos = [];
for (const s of (content.resume?.sections || [])) {
  for (const e of (s.entries || [])) {
    for (const [k, v] of Object.entries(e)) {
      if (typeof v === 'string' && /\bTODO\b/.test(v)) {
        todos.push(`resume "${s.title}" → ${k}: "${v}"`);
      }
    }
  }
}
if (todos.length) {
  warn(`${todos.length} resume placeholder${todos.length > 1 ? 's' : ''} still to fill in:`);
  for (const t of todos) warn(`    ${t}`);
}

(content.links || []).forEach((l, i) => {
  const at = `links[${i}]`;
  if (!l || !l.url) {
    fail(at, 'missing "url"');
  } else if (!/^https?:\/\//i.test(l.url)) {
    fail(at, `"${l.url}" isn't a full web address`,
         'It needs to start with https:// or the browser treats it as a page on your own site.');
  }
  if (l && !l.label) warn(`${at} has no label — the raw url will be shown instead.`);
});

// equal-length checks for the two morphing wordmarks
const pairs = [
  ['intro', content.intro?.from, content.intro?.to],
  ['hero.lineOne', content.hero?.lineOne?.from, content.hero?.lineOne?.to],
  ['hero.lineTwo', content.hero?.lineTwo?.from, content.hero?.lineTwo?.to],
];
for (const [where, from, to] of pairs) {
  if (from == null || to == null) {
    fail(where, 'needs both "from" and "to"');
  } else if (from.length !== to.length) {
    fail(where, `"${from}" and "${to}" are different lengths (${from.length} vs ${to.length})`,
         'The letters swap in place, so both words must have the same number of characters.');
  }
}

// ---- 4. can every referenced photo be found? -----------------------
for (const [id, wheres] of referenced) {
  const hasSource = sources.has(id);
  const hasBuilt = existsSync(path.join(ART, 'sm', `${id}.webp`)) &&
                   existsSync(path.join(ART, 'lg', `${id}.webp`));
  if (!hasSource && !hasBuilt) {
    fail(wheres[0], `img "${id}" — no photo found`,
         `Looked for artwork/${id}.jpg (any of ${SOURCE_EXT.join(', ')}), ` +
         `or an already-built art/sm/${id}.webp.\n` +
         `      Remember _DSC9303.jpg becomes the id "dsc9303".`);
  }
}

// ---- 5. stop here if anything is wrong -----------------------------
if (problems.length) {
  console.error(c.red(`\n✗ content.json — ${problems.length} problem${problems.length > 1 ? 's' : ''}\n`));
  for (const p of problems) {
    console.error(`  ${c.bold(p.where)}`);
    console.error(`    ${p.msg}`);
    if (p.hint) console.error(c.dim(`      ${p.hint}`));
    console.error('');
  }
  console.error(c.dim('  Nothing was written. The site on disk is untouched.\n'));
  process.exit(1);
}

// ---- 6. build the images -------------------------------------------
await fs.mkdir(path.join(ART, 'sm'), { recursive: true });
await fs.mkdir(path.join(ART, 'lg'), { recursive: true });

const media = {};
let built = 0, reused = 0;

for (const id of [...referenced.keys()].sort()) {
  const srcPath = sources.get(id);
  const out = {
    sm: path.join(ART, 'sm', `${id}.webp`),
    lg: path.join(ART, 'lg', `${id}.webp`),
  };
  const metaPath = path.join(ART, `${id}.json`);

  // Up to date already? Skip the expensive part.
  let fresh = false;
  if (!FORCE && existsSync(out.sm) && existsSync(out.lg) && existsSync(metaPath)) {
    if (!srcPath) {
      fresh = true;                       // original not on this machine; derivatives are all we have
    } else {
      const srcStat = await fs.stat(srcPath);
      const smStat = await fs.stat(out.sm);
      fresh = smStat.mtimeMs >= srcStat.mtimeMs;
    }
  }

  if (fresh) {
    media[id] = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    reused++;
    continue;
  }

  if (!srcPath) {
    // Derivatives exist but no metadata and no original — rebuild what we can.
    const probe = sharp(out.lg);
    const meta = await probe.metadata();
    media[id] = {
      w: meta.width, h: meta.height,
      ratio: Number((meta.width / meta.height).toFixed(4)),
      orient: meta.height > meta.width ? 'portrait' : 'landscape',
      lqip: await makeLqip(out.lg),
    };
    await fs.writeFile(metaPath, JSON.stringify(media[id]));
    reused++;
    continue;
  }

  const img = sharp(srcPath, { failOn: 'none' }).rotate();   // honour EXIF, then drop it
  const meta = await img.metadata();
  const w = meta.width, h = meta.height;

  for (const [key, edge] of Object.entries(SIZES)) {
    const scale = Math.min(1, edge / Math.max(w, h));
    await sharp(srcPath, { failOn: 'none' })
      .rotate()
      .resize(Math.round(w * scale), Math.round(h * scale), { fit: 'inside' })
      .webp({ quality: QUALITY[key], effort: 5 })
      .toFile(out[key]);
  }

  media[id] = {
    w, h,
    ratio: Number((w / h).toFixed(4)),
    orient: h > w ? 'portrait' : 'landscape',
    lqip: await makeLqip(srcPath),
  };
  await fs.writeFile(metaPath, JSON.stringify(media[id]));

  const kb = (await fs.stat(out.sm)).size + (await fs.stat(out.lg)).size;
  console.log(`  ${c.green('+')} ${id.padEnd(12)} ${String(w)}x${h} ${c.dim('→ ' + Math.round(kb / 1024) + ' KB')}`);
  built++;
}

async function makeLqip(file) {
  const buf = await sharp(file, { failOn: 'none' })
    .rotate()
    .resize(24, 24, { fit: 'inside' })
    .webp({ quality: 40 })
    .toBuffer();
  return 'data:image/webp;base64,' + buf.toString('base64');
}

// ---- 7. write the generated files ----------------------------------
const banner = (src) =>
  `/* Generated by tools/build.mjs from ${src} — do not edit by hand.\n` +
  `   Change ${src} and run: npm run build */\n`;

const mediaLines = Object.keys(media).sort().map(id => {
  const m = media[id];
  return `    '${id}': { w: ${m.w}, h: ${m.h}, ratio: ${m.ratio}, ` +
         `orient: '${m.orient}', lqip: '${m.lqip}' },`;
});

await fs.writeFile(
  path.join(SCRIPTS, 'media.js'),
  banner('the photos in artwork/') +
  `window.KLMedia = {\n  base: 'art/',\n  images: {\n${mediaLines.join('\n')}\n  }\n};\n`
);

await fs.writeFile(
  path.join(SCRIPTS, 'content.js'),
  banner('content.json') +
  `window.KLContent = ${JSON.stringify(stripNotes(content), null, 2)};\n`
);

// ---- 7b. fill the generated regions of index.html -------------------
// The intro word has to be in the HTML itself rather than built by JS,
// or the site paints first and the overlay drops on top of it. These
// markers let content.json stay the single source of truth anyway.
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function glyphSpans(from, to) {
  let out = '', n = 0;
  for (let i = 0; i < from.length; i++) {
    const a = from[i], b = to[i];
    out += a === b
      ? `<span class="g">${esc(a)}</span>`
      : `<span class="g g--swap" style="--n:${n++}"><i>${esc(a)}</i><i>${esc(b)}</i></span>`;
  }
  return out;
}

const site = content.site || {};
const artist = site.artistName || '';
const given = site.givenName || '';
const headline = `${artist}${site.tagline ? ' — ' + site.tagline : ''}`;

const regions = {
  head: [
    `  <title>${esc(headline)}</title>`,
    `  <meta name="description" content="${esc(site.description || '')}">`,
    `  <meta property="og:title" content="${esc(artist)}">`,
    `  <meta property="og:description" content="${esc(site.description || '')}">`,
    `  <meta property="og:type" content="website">`,
  ].join('\n'),

  intro: '      ' + glyphSpans(content.intro.from, content.intro.to),

  mark: `    <a class="mark" href="#/" data-magnetic aria-label="${esc(artist)} — home">${esc(artist)}</a>`,

  foot: (() => {
    const middle = [];
    if (site.email) {
      middle.push(`<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>`);
    }
    for (const l of (content.links || [])) {
      if (!l || !l.url) continue;
      middle.push(
        `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">` +
        `${esc(l.label || l.url)}</a>`
      );
    }
    return [
      `    <span>${esc(site.footerNote || '')}</span>`,
      `    <span>${middle.join(' &middot; ')}</span>`,
      `    <span>&copy; <span id="year">${new Date().getFullYear()}</span> ` +
        `${esc(artist)}${given ? ' &middot; ' + esc(given) : ''}</span>`,
    ].join('\n');
  })(),
};

const indexPath = path.join(ROOT, 'index.html');
let html = await fs.readFile(indexPath, 'utf8');
let injected = 0;

for (const [name, body] of Object.entries(regions)) {
  const re = new RegExp(
    `(<!-- build:${name}:start[^>]*-->)[\\s\\S]*?(<!-- build:${name}:end -->)`
  );
  if (!re.test(html)) {
    warn(`index.html has no "build:${name}" markers — that region was left alone.`);
    continue;
  }
  html = html.replace(re, `$1\n${body}\n    $2`);
  injected++;
}

if (injected) await fs.writeFile(indexPath, html);

// ---- 8. housekeeping warnings --------------------------------------
for (const id of sources.keys()) {
  if (!referenced.has(id)) {
    warn(`artwork/${path.basename(sources.get(id))} isn't used by anything in content.json.`);
  }
}
for (const dir of ['sm', 'lg']) {
  const d = path.join(ART, dir);
  if (!existsSync(d)) continue;
  for (const f of await fs.readdir(d)) {
    if (!f.endsWith('.webp')) continue;
    const id = path.basename(f, '.webp');
    if (!referenced.has(id)) warn(`art/${dir}/${f} is left over — nothing references "${id}".`);
  }
}

// ---- 9. report ------------------------------------------------------
if (warnings.length) {
  console.log(c.amber(`\n  ${warnings.length} thing${warnings.length > 1 ? 's' : ''} worth a look:`));
  for (const w of warnings) console.log(c.dim(`    · ${w}`));
}

console.log(
  `\n${c.green('✓')} ${projects.length} projects, ${stills.length} stills, ` +
  `${Object.keys(media).length} photos ` +
  c.dim(`(${built} built, ${reused} already current)`) + '\n'
);
