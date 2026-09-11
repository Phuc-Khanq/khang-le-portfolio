# Updating the site

Everything you'd normally change — projects, photos, all the text — lives in
one file: **`content.json`**. You never need to touch the HTML, CSS or
JavaScript.

## One-time setup

```
npm install
```

Run that once, in this folder. It downloads the image tool. If you ever move
the project to another computer, run it again there.

## The three commands

```
npm run dev      preview at http://localhost:5173, updates as you save
npm run build    process photos + check the content for mistakes
npm run ship     build, then commit and push — the site goes live
```

`npm run ship` takes a message:

```
npm run ship -- "added the new single"
```

The build always runs first. If something's wrong with your content, nothing
gets committed and nothing gets pushed — the live site keeps working while you
fix it.

---

## Add a new project

**1. Put the photo in `artwork/`.**

The filename becomes its id: `_DSC1234.jpg` → `dsc1234`. The leading underscore
is dropped and it's lowercased. You can rename the file to something friendlier
first — `bloom.jpg` → `bloom` — as long as you use that same name below.

**2. Add an entry to the `projects` list in `content.json`:**

```json
{
  "slug": "bloom",
  "title": "bloom",
  "status": "out now",
  "year": "2026",
  "role": "write · produce · mix",
  "img": "bloom",
  "note": "One line about the track."
}
```

`slug` is the page's url (`yoursite.com/#/project/bloom`) — lowercase letters,
numbers and hyphens only, and no two projects can share one.

**3. `npm run ship`.**

Order in the file is the order on the page. Move an entry up to move the
project up.

## Add photos to the stills gallery

Drop them in `artwork/`, then add to the `stills` list:

```json
{ "img": "bloom", "cap": "what it is" }
```

Portrait and landscape are detected automatically — you don't set that. The
same photo can appear as both a project cover and a still.

## Change any of the text

It's all in `content.json`:

- **`site`** — your name, tagline, email, the description search engines show
- **`hero`** — the line above your name, and the statement under it
- **`about`** — the About page paragraphs and the four highlights
- **`marquee`** — the scrolling words
- **`intro`** / **`hero.lineOne`** / **`hero.lineTwo`** — the animated wordmark

Write plain text. Apostrophes, ampersands and dashes are handled for you — don't
write `&amp;` or `&rsquo;`, just type `&` and `'`.

### The one rule about the wordmark

`from` and `to` must be the **same number of characters**:

```json
"intro": { "from": "khangLE", "to": "khxngLX" }
```

Both are 7. Letters that differ animate; letters that match stay put. If the
lengths don't match, the build stops and tells you.

---

## If something goes wrong

The build tries to tell you exactly what and where. A typo in the JSON gets you
the line number and a pointer at the character:

```
content.json is not valid JSON.

  line 124:

  122    "stills": [
  123      { "img": "dsc9303", "cap": "blue hour" }
  124      { "img": "dsc9592", "cap": "long exposure" },
           ^
```

A missing photo gets you the project it belongs to and where it looked.

Nothing is ever written when there's a problem, so a bad edit can't take the
live site down. Fix it and run again.

**`npm run build -- -f`** redoes every photo from scratch, if you ever think a
derivative went stale.

---

## What's generated, what's yours

Don't hand-edit these — the build overwrites them:

- `scripts/content.js` and `scripts/media.js`
- `art/sm/`, `art/lg/`, and the `art/*.json` files
- the marked regions inside `index.html` (title, intro word, footer)

Yours to edit freely: `content.json`, `styles/main.css`, and everything else.

`artwork/` holds your full-size originals. It's deliberately excluded from git —
they're huge, and the site only ever serves the resized copies in `art/`. Keep
them backed up somewhere separate; they're the source everything else is made
from.
