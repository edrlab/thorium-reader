# Standalone customization profile editor

Open [`scripts/thorium-profile-editor.html`](../../scripts/thorium-profile-editor.html) directly in a browser. Copy that one file anywhere; it works offline without Node.js, Thorium, a server, or external assets. See the [user guide](../../docs/customization-profile-editor.md).

## Build and check

From the repository root, with development dependencies installed:

```bash
npm run build:customization-profile-editor
npm run check:customization-profile-editor
npm run test:customization-profile-editor
```

Commit the regenerated `scripts/thorium-profile-editor.html` with changes to the editor or shared manifest schema. The build can take an alternative output filename as its first argument.

The test command also rebuilds the CLI used by the packing checks.

Browser tests require Playwright Chromium. To use an already installed Chrome or Edge instead, set `PROFILE_EDITOR_BROWSER_CHANNEL` to `chrome` or `msedge`. Tests copy the generated HTML to a temporary folder, run with networking disabled, check import/export, validation, resource and publication ordering, nested-field preservation, advanced JSON transitions, and directory selection. They also pack and verify an exported manifest with local books, covers, and other resources using the standalone CLI.

## Runtime boundary

This is a separate browser runtime under `projects/customization-profile-editor`, built with esbuild. It must not import Electron, Thorium runtime code, Node.js modules, or signing keys. The build generates a standalone Ajv validator from `src/common/readium/customization/profile.schema.ts` and embeds it with all JavaScript and CSS in the output HTML. No schema compilation or dynamic evaluation occurs in the browser. The build rejects Thorium runtime imports and external dependencies.

The form edits metadata, the eight colors in each theme, and ordered images, links, and publications. `text.ts` supplies the shared plain/multilingual text editor; `resources.ts` owns resource cards, presets, optional catalog authentication, and resource validation. `publications.ts` supplies guided metadata, nested resource editors, and an advanced JSON mode. Unedited complex metadata is preserved; contributor objects retain additional properties when changing their names. Unsupported guided structures remain editable in JSON. Invalid advanced JSON blocks export without replacing the last parseable preview. The preview and export omit `signature` and `contentHash`, which the CLI regenerates.

Import uses the CLI's minimal schema and version check, then checks the types of editable resource fields before replacing the draft. Export also checks required text, duplicate language keys and language tag syntax, browser-supported CSS colors, resource paths, HTTP(S) catalog/authentication URLs, and media types. Path traversal checks follow the CLI's normalization rules. Logos, welcome images, and HTML pages require local paths because Thorium resolves them within the package. The CLI remains responsible for checking that local files exist and do not resolve outside the input folder during packaging.

`paths.ts` normalizes relative references without Node.js; `folder.ts` compares the same top-level and publication resource groups as the CLI with `File.webkitRelativePath` values from the browser's directory input. It reads names only, deduplicates normalized references, requires exact filename case, and never fetches remote URLs. Folder results are advisory snapshots and reset on manifest import or New. They do not parse HTML/CSS dependencies, inspect file contents, or replace the CLI's regular-file and symlink containment checks.
