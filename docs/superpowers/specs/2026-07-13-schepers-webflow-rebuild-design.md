# Schepers Webflow Production Rebuild Design

Date: 2026-07-13  
Repository: `iam-Solace/schepers`  
Webflow site: `Schepers` (`6961337bb2266dd4403fe69a`)  
Source baseline: `C:\Users\Lukah\springstall-schepers` (read-only)

## Objective

Replace the existing Schepers business-page content with the six-page website from the read-only source folder, preserve the site's Finsweet Client-First foundation, and connect all rebuilt pages to one repository-hosted JavaScript file. No site publish is part of this work.

## Preserved Webflow Resources

- Style Guide page
- Components page
- Client-First classes, variables, components, and utility structure
- Required 404 and Password utility pages
- Existing unrelated site-wide head code, including icon styles and font smoothing
- Webflow site configuration that is not specific to the old business-page content

## Removed or Replaced Resources

- Delete the obsolete Home V2 page after the rebuilt Home is structurally verified.
- Remove the existing business content from the current Home page and rebuild that page at the root URL.
- Replace the old site-wide repository script references to `script.js` and `lenis-scroll.js`.
- Preserve the external Lenis library dependency when the new shared script uses it.
- Do not remove Style Guide, Components, Client-First resources, 404, or Password.

## Rebuilt Page Set

| Page | Slug |
| --- | --- |
| Home | `/` |
| Training | `/training` |
| Stallungen | `/stallungen` |
| Privatunterricht | `/privatunterricht` |
| Impressum | `/impressum` |
| Datenschutz | `/datenschutz` |

The existing Home page record remains the homepage so the root URL is preserved. Its old child content is removed and replaced. The five supporting pages are created as new production pages.

## Structure and Styling

- Use Client-First layout foundations and existing site variables where compatible.
- Use project-specific `schepers_*` classes for unique visual modules and interaction hooks.
- Preserve semantic heading order, accessible link text, alternative text, and keyboard-operable navigation.
- Recreate responsive behavior at desktop, tablet, and mobile breakpoints.
- Do not edit files in the source folder.

## Assets

- Upload the source folder's local assets into the production Webflow asset library.
- Import the source site's remote editorial images into Webflow so pages do not depend directly on Picsum URLs.
- Bind every image element to a managed Webflow asset and retain meaningful alt text.
- Do not delete existing shared assets unless they are proven to belong exclusively to removed business content; asset deletion is outside this rebuild.

## Repository JavaScript

Create `schepers-webflow.js` on the repository's `main` branch. Load it through:

`https://cdn.jsdelivr.net/gh/iam-Solace/schepers@main/schepers-webflow.js`

The script:

- detects pages using `data-page="schepers-*"`;
- initializes shared smooth scrolling and reduced-motion behavior;
- controls the home mobile menu, active navigation, reveal effects, history timeline, horizontal gallery, and lightweight parallax;
- initializes detail-page image movement and entrance transitions;
- applies only minimal behavior on legal pages;
- checks for every required DOM element and dependency before use;
- does not affect Style Guide, Components, 404, Password, or unrelated Webflow pages.

## Webflow Custom Code

Read existing site freeform code before writing. Preserve the current head code unchanged. Update only the repository-backed footer portion:

- retain the external Lenis library;
- remove the old `script.js` and `lenis-scroll.js` tags;
- add the new `schepers-webflow.js` jsDelivr tag;
- preserve any unrelated footer code discovered immediately before the update.

## Legal and SEO

- Preserve the source legal-template warning on Impressum and Datenschutz.
- Add `noindex, nofollow` to both legal pages.
- Do not publish legal templates until their placeholder fields and wording have been professionally reviewed.
- Set page titles and descriptions from the source migration specification.

## Execution Safety

1. Read production pages, code, assets, styles, variables, and components.
2. Build and verify the replacement Home structure before deleting Home V2.
3. Create and verify all supporting pages.
4. Upload and bind managed assets.
5. Create and verify the repository script.
6. Update site custom code while preserving unrelated code.
7. Remove Home V2 and old Home child content only after replacement structures exist.
8. Verify page trees, links, asset bindings, script URL, and custom-code readback.
9. Leave the entire site unpublished.

## Verification Criteria

- The six required pages exist at their intended slugs.
- Style Guide, Components, Client-First resources, 404, and Password remain.
- Home V2 is removed.
- Old Home business content is absent.
- Every migrated image has a managed Webflow asset reference.
- Internal links target production slugs.
- The repository contains `schepers-webflow.js`.
- Production Webflow footer code loads the new jsDelivr URL and no longer loads the two old repository files.
- Legal pages contain noindex directives.
- Desktop, tablet, and mobile visual checks identify no horizontal overflow or broken navigation.
- No publish action occurs.
