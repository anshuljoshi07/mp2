# Implementation Plan: Pokedex Explorer

## Product Goal
Build a single-page React app that lets users explore Pokemon through a searchable and sortable list, a type-filterable image gallery, and shareable detail routes. The app uses the public PokeAPI and must remain usable when API data or individual sprites are unavailable.

## API Choice
- **API:** [PokeAPI](https://pokeapi.co/)
- **Base URL:** `https://pokeapi.co/api/v2`
- **Authentication:** None; do not add API keys or secrets.
- **Collection scope:** The first 151 Pokemon, loaded from `/pokemon?limit=151&offset=0`. This keeps the interface responsive and makes the initial dataset manageable.
- **Data needed:** Pokemon name, id, image sprite, types, height, weight, and base stats. Use the list endpoint for names and detail endpoints for metadata; cache detail requests in memory and avoid starting duplicate requests.
- **Dependencies required by the assignment:** React, TypeScript, React Router, and Axios.

## Goals

| ID | Goal | Completion criteria |
| --- | --- | --- |
| G1 | Searchable list | Show the selected Pokemon collection and filter names immediately as the user types. Search is case-insensitive and handles an empty query. |
| G2 | Sortable results | Sort by at least two properties (name and Pokemon number/id) in ascending or descending order. Sorting works together with search. |
| G3 | Gallery and type filters | Show Pokemon sprites in a gallery. Let users filter by one or more types, and update the gallery when filters change. |
| G4 | Detail view and routes | Selecting a Pokemon from either list or gallery opens a unique route such as `/pokemon/pikachu`; show its available attributes. Directly opening or refreshing that route must work. |
| G5 | Previous and next navigation | Detail controls move through the same canonical 151-Pokemon collection in a stable order, wrap at both ends, and keep the URL and displayed Pokemon in sync. |
| G6 | Loading and failure states | Give clear loading and empty-result states. If the collection request fails, show a small local mock dataset with a retry action; missing artwork must not break the page. |
| G7 | Required stack and deployment | Use TypeScript, Axios, and React Router. Configure Vite’s base path and router basename for the repository’s GitHub Pages deployment. |
| G8 | Usable presentation | Keep list, gallery, filters, and detail controls usable on narrow and wide screens; use semantic controls and visible focus states. |

## Dealbreakers
A dealbreaker is a failure that blocks a goal or makes the app unreliable. The tests below explicitly check these conditions.

| ID | Dealbreaker | Impact |
| --- | --- | --- |
| D1 | Required stack is missing or bypassed | Fails the assignment requirement if React Router, TypeScript, or Axios is not used for its intended purpose. |
| D2 | API failure leaves a blank screen, endless spinner, or uncaught crash | Users cannot recover or tell what happened when PokeAPI is unavailable. |
| D3 | Unbounded or duplicate detail requests overload the page/API | Initial load becomes slow and fragile; repeated renders or navigation trigger unnecessary requests. |
| D4 | Late responses overwrite newer user intent | Search/filter changes or route navigation can show stale or mismatched data. |
| D5 | Search, sorting, or type filters produce inconsistent results | Required list and gallery interactions become incorrect, especially when combined. |
| D6 | Detail URL and rendered Pokemon diverge | Shared links, refreshes, and previous/next navigation may show the wrong item. |
| D7 | GitHub Pages base path breaks assets or deep links | The production deployment can be blank or detail routes can fail on refresh. |
| D8 | A missing/invalid sprite or incomplete API response breaks rendering | One bad field or image can prevent users from exploring other Pokemon. |
| D9 | Controls cannot be operated or understood on mobile/keyboard | Core tasks become inaccessible or unusable on common devices. |
| D10 | A secret is committed, inline styles/scripts are used, or HTML tables are used for layout | Violates API security or the assignment's implementation rules. PokeAPI needs no secret. |
| D11 | The Pages workflow cannot install or publish the app | A missing lockfile, overwritten deploy workflow, or incorrect Pages source prevents deployment. |

## Goal-to-Dealbreaker Test Matrix

| Goal | Tests and expected result | Dealbreakers checked |
| --- | --- | --- |
| G1 Searchable list | With a loaded collection, type `pi`, then `PI`; the same matching names remain. Clear the query and confirm all 151 return. Search a string with no match and confirm an explicit empty state. | D2, D4, D5 |
| G2 Sortable results | Sort by name and id in both directions; confirm order is correct. Apply a search, change sort, and confirm only matching items remain in the requested order. | D4, D5 |
| G3 Gallery and type filters | Confirm cards show sprites and type labels. Select one type, then two types; verify matching items follow the documented OR rule (match any selected type). Clear filters and confirm the full collection returns. | D3, D4, D5, D8 |
| G4 Detail view and routes | Open detail from a list row and gallery card; confirm both reach the same Pokemon route and attributes. Paste a detail URL into a fresh tab and refresh it; confirm it loads correctly. | D1, D2, D3, D6, D7, D8 |
| G5 Previous and next | From a detail route, use previous and next and verify both the displayed name and URL update. Verify the first item wraps to the last and the last wraps to the first. Repeat after directly loading a detail URL. | D4, D6, D7 |
| G6 Loading and failure states | Delay the API response and verify a loading state; simulate a failed collection request and verify the mock dataset appears and retry requests live data again. Simulate a failed detail request and verify a recoverable error. Return an item with no sprite and verify a fallback image/placeholder. | D2, D3, D4, D8 |
| G7 Required stack and deployment | Run `npm ci`, type-check, and run a production build. Inspect the app for React Router routes, typed data, and Axios API calls. Confirm there are no committed API secrets, inline styles/scripts, or HTML tables used for layout. Confirm `package-lock.json` and the deploy workflow are present, and Pages uses GitHub Actions. Deploy and test the home page, assets, and a refreshed detail URL under the repository path. | D1, D7, D10, D11 |
| G8 Usable presentation | At mobile and desktop widths, use search, filters, sorting, detail navigation, and back navigation. Keyboard-tab through controls and confirm visible focus and meaningful accessible names. | D9 |

## Implementation Notes

1. Define TypeScript types for the PokeAPI list response and the normalized Pokemon data used by the UI. Normalize API responses once so components do not depend on loosely shaped nested fields.
2. Keep API access in a small Axios-backed service. Load the first 151 names, fetch required metadata with bounded concurrency, cache successful detail responses, and expose loading/error states to the UI. Do not fetch details repeatedly when switching between list and gallery.
3. Keep search, sort, and selected types as UI state. Derive visible list/gallery data from the same normalized collection so each view applies consistent rules. Type selection uses OR semantics: an item is included if it has at least one selected type.
4. Use React Router for list/gallery and `/pokemon/:name` detail routes. Resolve a detail route from its URL rather than relying only on navigation state, so refresh and shared links work. Previous/next uses the stable collection order and updates the route.
5. Set Vite `base` and React Router `basename` from `import.meta.env.BASE_URL` before publishing to GitHub Pages. Use router links for internal navigation. Configure and test a GitHub Pages SPA fallback (or another compatible route strategy); `basename` alone does not ensure the server returns the app for a refreshed nested detail URL.
6. Use a small local mock dataset when the collection request fails, and a local placeholder when artwork is missing. Show a retry action for recoverable API failures and keep the rest of the app available if one Pokemon detail request fails.

## Assignment Compliance and Submission

- Create the public `mp2` repository from the class template. When scaffolding Vite in the existing repository, choose “Ignore files and continue” so `README.md` and `.github/workflows/deploy.yml` are preserved. Commit the generated `package-lock.json` so the workflow's `npm ci` step can run, and configure GitHub Pages to deploy from GitHub Actions.
- Declare all external code and reading sources used in the submission. If an LLM is used to generate application code, submit the chat logs and answer the related survey questions as required by the README.
- Record a demo video of no more than three minutes. Show the deployed URL and all completed requirements, upload it to Google Drive, share it with the address in the README, and include the share link in the submission form. If deployment fails, follow the README's local-demo instructions and run `git status` and `git log` first.

## Acceptance Gate
The implementation is ready when all goals pass their matrix checks, `npm ci` and `npm run build` succeed, and the deployed GitHub Pages URL can load both the main view and a refreshed Pokemon detail route. Complete the assignment compliance and submission checklist before submitting. No API key is required or committed.
