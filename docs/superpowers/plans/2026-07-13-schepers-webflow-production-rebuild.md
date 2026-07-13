# Schepers Webflow Production Rebuild Implementation Plan


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the production Schepers business pages with the six-page read-only source website, preserve Client-First foundations, and load one repository-hosted page-scoped interaction script.

**Architecture:** The existing production Home page remains the root page but receives a new isolated `schepers_*` element tree. Five supporting pages are created, while Style Guide, Components, Client-First resources, 404, and Password remain intact. A single defensive browser script detects `data-page` values and initializes only the relevant page modules through jsDelivr.

**Tech Stack:** Webflow Data and Designer APIs, Finsweet Client-First, vanilla JavaScript, Lenis 1.1.18, GitHub, jsDelivr, Node.js built-in test runner.

---

## File Map

- Create: `schepers-webflow.js` — shared, page-scoped interactions for all six Schepers pages.
- Create: `tests/schepers-webflow.test.mjs` — static contract tests for isolation, accessibility hooks, and defensive initialization.
- Create: `package.json` — repository test command using Node's built-in test runner.
- Preserve: `script.js` — retained in repository history but no longer loaded by Webflow.
- Preserve: `lenis-scroll.js` — retained in repository history but no longer loaded by Webflow.
- Modify through Webflow: production Home page, five new static pages, site footer custom code, managed assets.
- Delete through Webflow: Home V2 only after replacement verification.

### Task 1: Capture Production Safety Baseline

**Files:**
- Reference: `docs/superpowers/specs/2026-07-13-schepers-webflow-rebuild-design.md`

- [ ] **Step 1: Record the protected production resources**

Use Webflow read actions to record:

```text
Site: 6961337bb2266dd4403fe69a
Preserve pages:
- Components: 69c14471521ea37da7faaf00
- Style Guide: 6961337db2266dd4403fe72c
- 404: 6961337db2266dd4403fe72b
- Password: 6961337db2266dd4403fe72a
Replace content:
- Home: 6961337db2266dd4403fe729
Delete after verification:
- Home V2: 6a2c628bc079a0735adfaa3d
```

- [ ] **Step 2: Read and preserve site custom code**

Expected head code contains the Phosphor stylesheet and font-smoothing rules. Expected footer code contains the old repository `script.js`, Lenis 1.1.18, and `lenis-scroll.js`.

- [ ] **Step 3: Inventory Client-First resources**

Read production styles, variables, and components. Confirm that no remove-style, remove-variable, or delete-component action appears anywhere in the execution log.

- [ ] **Step 4: Confirm the source remains read-only**

Run:

```powershell
Get-ChildItem -Recurse -File C:\Users\Lukah\springstall-schepers |
  Get-FileHash -Algorithm SHA256 |
  Sort-Object Path |
  Format-Table Path, Hash
```

Save the output in the task transcript and repeat the command after implementation. Expected: identical path/hash pairs.

### Task 2: Create the Script Contract Tests

**Files:**
- Create: `package.json`
- Create: `tests/schepers-webflow.test.mjs`

- [ ] **Step 1: Add the repository test command**

```json
{
  "name": "schepers-webflow",
  "private": true,
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  }
}
```

- [ ] **Step 2: Write failing static contract tests**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../schepers-webflow.js', import.meta.url), 'utf8')
  .catch(() => '');

test('is isolated to Schepers data-page roots', () => {
  assert.match(source, /\[data-page\^="schepers-"\]/);
  assert.match(source, /if \(!root\) return/);
});

test('respects reduced motion', () => {
  assert.match(source, /prefers-reduced-motion: reduce/);
});

test('supports accessible mobile navigation', () => {
  assert.match(source, /data-menu-open/);
  assert.match(source, /data-menu-close/);
  assert.match(source, /aria-hidden/);
  assert.match(source, /Escape/);
});

test('initializes page-specific modules defensively', () => {
  assert.match(source, /schepers-home/);
  assert.match(source, /schepers-training/);
  assert.match(source, /schepers-stallungen/);
  assert.match(source, /schepers-privatunterricht/);
  assert.match(source, /querySelector/);
});
```

- [ ] **Step 3: Verify the tests fail before implementation**

Run:

```powershell
npm test
```

Expected: four failing tests because `schepers-webflow.js` does not exist.

- [ ] **Step 4: Commit the failing tests**

```powershell
git add package.json tests/schepers-webflow.test.mjs
git commit -m "test: define Schepers Webflow script contracts"
```

### Task 3: Implement the Shared Page-Scoped Script

**Files:**
- Create: `schepers-webflow.js`

- [ ] **Step 1: Add the complete defensive interaction script**

```javascript
(() => {
  'use strict';

  const root = document.querySelector('[data-page^="schepers-"]');
  if (!root) return;

  const page = root.getAttribute('data-page') || '';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups = [];

  const on = (target, event, handler, options) => {
    if (!target) return;
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  };

  const initLenis = () => {
    if (reducedMotion || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5
    });
    let frame = 0;
    const raf = time => {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    };
    frame = window.requestAnimationFrame(raf);
    cleanups.push(() => {
      window.cancelAnimationFrame(frame);
      lenis.destroy();
    });
  };

  const initSmoothAnchors = () => {
    root.querySelectorAll('a[href^="#"]').forEach(link => {
      on(link, 'click', event => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  };

  const initMobileMenu = () => {
    const panel = root.querySelector('[data-module="mobile-menu"]');
    const openButton = root.querySelector('[data-menu-open]');
    const closeButton = root.querySelector('[data-menu-close]');
    if (!panel || !openButton || !closeButton) return;

    const setOpen = open => {
      panel.setAttribute('aria-hidden', String(!open));
      panel.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('is-menu-open', open);
      (open ? closeButton : openButton).focus();
    };

    on(openButton, 'click', event => {
      event.preventDefault();
      setOpen(true);
    });
    on(closeButton, 'click', event => {
      event.preventDefault();
      setOpen(false);
    });
    panel.querySelectorAll('a[href^="#"]').forEach(link => {
      on(link, 'click', () => setOpen(false));
    });
    on(document, 'keydown', event => {
      if (event.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') {
        setOpen(false);
      }
    });
  };

  const initReveals = () => {
    const items = [...root.querySelectorAll('[data-reveal]')];
    if (!items.length || reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    items.forEach(item => observer.observe(item));
    cleanups.push(() => observer.disconnect());
  };

  const initActiveNavigation = () => {
    const links = [...root.querySelectorAll('[data-nav]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const sections = links
      .map(link => document.querySelector(link.getAttribute('data-nav')))
      .filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          link.classList.toggle(
            'is-current',
            link.getAttribute('data-nav') === `#${entry.target.id}`
          );
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => observer.observe(section));
    cleanups.push(() => observer.disconnect());
  };

  const initParallax = () => {
    if (reducedMotion) return;
    const items = [...root.querySelectorAll('[data-parallax]')];
    if (!items.length) return;
    let ticking = false;
    const render = () => {
      const viewport = window.innerHeight;
      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const progress = (viewport - rect.top) / (viewport + rect.height);
        const offset = Math.max(-1, Math.min(1, progress - 0.5)) * 18;
        item.style.setProperty('--schepers-parallax-y', `${offset}px`);
      });
      ticking = false;
    };
    const requestRender = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    };
    on(window, 'scroll', requestRender, { passive: true });
    on(window, 'resize', requestRender);
    requestRender();
  };

  const initHorizontalGallery = () => {
    const section = root.querySelector('[data-module="horizontal-gallery"]');
    if (!section) return;
    const track = section.querySelector('.schepers_gallery-track');
    if (!track) return;
    on(section, 'wheel', event => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      const next = track.scrollLeft + event.deltaY;
      if ((next <= 0 && event.deltaY < 0) || (next >= max && event.deltaY > 0)) return;
      event.preventDefault();
      track.scrollLeft = next;
    }, { passive: false });
  };

  const initDetailPage = () => {
    const image = root.querySelector('[data-parallax="image"]');
    if (!image || reducedMotion) return;
    image.classList.add('is-ready');
  };

  initLenis();
  initSmoothAnchors();
  initReveals();

  if (page === 'schepers-home') {
    initMobileMenu();
    initActiveNavigation();
    initParallax();
    initHorizontalGallery();
  }

  if ([
    'schepers-training',
    'schepers-stallungen',
    'schepers-privatunterricht'
  ].includes(page)) {
    initDetailPage();
    initParallax();
  }

  on(window, 'pagehide', () => {
    cleanups.splice(0).forEach(cleanup => cleanup());
  }, { once: true });
})();
```

- [ ] **Step 2: Run contract tests**

Run:

```powershell
npm test
```

Expected: four tests pass, zero fail.

- [ ] **Step 3: Commit the script**

```powershell
git add schepers-webflow.js
git commit -m "feat: add page-scoped Schepers Webflow interactions"
```

### Task 4: Build Production Home Before Removing Old Content

**Files:**
- Modify through Webflow: Home page `6961337db2266dd4403fe729`

- [ ] **Step 1: Read the complete Home element tree**

Identify the page Body root and all current direct children. Record their composite element IDs before removal.

- [ ] **Step 2: Insert the replacement Home as a sibling-safe isolated tree**

Insert one `page-wrapper schepers_page` wrapper with `data-page="schepers-home"`. Its direct children, in order, are the `schepers_nav` header with `data-module="site-nav"`, the `schepers_menu` overlay with `data-module="mobile-menu"` and `aria-hidden="true"`, the `main-wrapper`, and the `schepers_footer` with DOM ID `kontakt`.

The navigation contains links to `#stallungen`, `#leistungen`, `#geschichte`, `#gut`, and `#kontakt`, plus the logo link to `#top`. The main wrapper contains the hero, statement, Stallungen bento, Leistungen, Geschichte, Gut gallery, statistics, quote, and contact-map sections in the exact source order. The footer contains the source address, telephone, email, `/impressum`, and `/datenschutz` links. Service cards use `/training`, `/stallungen`, and `/privatunterricht`.

- [ ] **Step 3: Insert responsive project styles**

Reuse the verified `schepers_*` class system from the test migration, changing only internal production slugs. Reuse existing Client-First container, padding, and utility classes when they already exist.

- [ ] **Step 4: Verify replacement structure before removal**

Query the replacement wrapper and require:

```text
Exactly 1 h1
At least 4 h2 headings
17 image elements
Required section IDs: top, stallungen, leistungen, geschichte, gut, kontakt
Required data modules: site-nav, mobile-menu, hero-depth, history-timeline, horizontal-gallery
```

- [ ] **Step 5: Remove only the old Home direct children**

Delete the recorded old direct children. Do not delete the page Body, replacement wrapper, classes, variables, components, Style Guide content, or Components content.

### Task 5: Create the Five Supporting Pages

**Files:**
- Create through Webflow: Training, Stallungen, Privatunterricht, Impressum, Datenschutz

- [ ] **Step 1: Create pages with exact settings**

```text
Training
slug: training
SEO title: Training — Springstall Schepers
description: Turniervorbereitung und Beritt, vom ersten Parcours bis zum Championat.

Stallungen
slug: stallungen
SEO title: Stallungen — Springstall Schepers
description: Großzügige Boxen, tägliche Pflege und Weidegang auf dem Gut bei Schwerte.

Privatunterricht
slug: privatunterricht
SEO title: Privatunterricht — Springstall Schepers
description: Springen und Dressur im Einzelunterricht, abgestimmt auf Pferd und Reiter.

Impressum
slug: impressum
SEO title: Impressum — Springstall Schepers
description: Impressum und Anbieterinformationen von Springstall Schepers.

Datenschutz
slug: datenschutz
SEO title: Datenschutz — Springstall Schepers
description: Informationen zur Verarbeitung personenbezogener Daten bei Springstall Schepers.
```

- [ ] **Step 2: Build service pages**

Use one shared detail-page class family and the exact source copy. Each wrapper must set its corresponding `data-page` value and link back to `/#leistungen`.

- [ ] **Step 3: Build legal pages**

Use one shared legal-page class family, preserve the legal-review warning, and link to production routes.

- [ ] **Step 4: Add legal noindex directives**

Set page-level head code on both legal pages:

```html
<meta name="robots" content="noindex, nofollow">
```

- [ ] **Step 5: Verify all supporting pages**

Require one h1 per page, valid internal links, correct `data-page`, and no missing source copy.

### Task 6: Upload and Bind Production Assets

**Files:**
- Read only: `C:\Users\Lukah\springstall-schepers\assets\*`
- Modify through Webflow: production asset library and page image bindings

- [ ] **Step 1: Register and upload all 12 local source assets**

Use SHA-256 file hashes, preserve SVG files, and use descriptive `schepers-*` asset names.

- [ ] **Step 2: Import the seven used remote editorial images**

Import the longierhalle, first history image, and five gallery images from their exact source URLs into the production asset library.

- [ ] **Step 3: Bind every page image**

Set native asset IDs on every image element. Decorative logo marks and depth maps use null alt text; content images retain meaningful German alt text.

- [ ] **Step 4: Verify asset bindings**

Query all six pages. Expected: every Image element has an `assetId`; zero source image elements depend directly on Picsum.

### Task 7: Connect the Repository Script to Production Webflow

**Files:**
- Modify through Webflow: site footer freeform code

- [ ] **Step 1: Push repository commits**

Run:

```powershell
git push origin main
```

Expected: remote `main` advances and contains `schepers-webflow.js`.

- [ ] **Step 2: Verify the jsDelivr file**

Open:

```text
https://cdn.jsdelivr.net/gh/iam-Solace/schepers@main/schepers-webflow.js
```

Expected: HTTP 200 and content begins with `(() => {`.

- [ ] **Step 3: Read site freeform code again**

Use the fresh read as the only basis for the update.

- [ ] **Step 4: Preserve head code and replace only repository footer tags**

Expected footer:

```html
<script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/iam-Solace/schepers@main/schepers-webflow.js"></script>
```

Retain any unrelated footer code found during Step 3.

- [ ] **Step 5: Read custom code back**

Confirm the new script appears exactly once and the old `script.js` and `lenis-scroll.js` links appear zero times.

### Task 8: Remove Obsolete Home V2

**Files:**
- Delete through Webflow: Home V2 `6a2c628bc079a0735adfaa3d`

- [ ] **Step 1: Re-run replacement-page structural checks**

Do not continue unless Home and all five supporting pages pass Task 4 and Task 5 verification.

- [ ] **Step 2: Delete Home V2**

Delete only page ID `6a2c628bc079a0735adfaa3d`.

- [ ] **Step 3: List pages and verify preservation**

Expected retained page set:

```text
Home
Training
Stallungen
Privatunterricht
Impressum
Datenschutz
Components
Style Guide
404
Password
```

### Task 9: Final Unpublished Verification

**Files:**
- Verify: repository and Webflow production site

- [ ] **Step 1: Run repository tests**

Run:

```powershell
npm test
git status --short --branch
```

Expected: all tests pass and working tree is clean.

- [ ] **Step 2: Verify source-folder hashes**

Repeat the Task 1 hash command. Expected: identical path/hash pairs.

- [ ] **Step 3: Inspect desktop, tablet, and mobile**

Verify Home at 1280px, 991px, 767px, and 390px widths. Require no horizontal document overflow, visible focus states, working mobile-menu state, and readable legal content.

- [ ] **Step 4: Verify publication state**

Read site metadata and activity. Confirm that no publish action was issued during this plan.

- [ ] **Step 5: Commit verification evidence**

If verification required repository-only corrections, commit them with:

```powershell
git add schepers-webflow.js tests/schepers-webflow.test.mjs package.json
git commit -m "fix: complete Schepers Webflow verification"
git push origin main
```

If no corrections were needed, do not create an empty commit.
