# Authenticated OPDS cover refresh regression (#1981)

A local-only fixture reproducing a cover which loads in the catalogue but breaks
when publication details finish loading. No real credentials or ebooks are needed.

## Manual Electron check

1. Build Thorium using the repository's documented installation and build steps.
2. Run `node projects/opds-cover-refresh/server.cjs`.
3. On macOS, double-click `run-thorium.command` in this folder, or start Thorium
   with a **separate absolute user-data directory**, for example:
   ```sh
   node_modules/.bin/electron . --user-data-dir="$HOME/Library/Caches/lipu-thorium-cover-test"
   ```
4. Add the catalogue `http://127.0.0.1:9123/opds`. Username and password are both `test`.
5. Verify the green cover is visible in the catalogue, then open the publication.
6. Wait at least two seconds: the fixture deliberately delays the detail response.

Before the fix, the detail cover becomes a broken image after the response arrives.
The catalogue image retains its authenticated `opds-media://` URL, but the detail
image resets to HTTP and has `naturalWidth === 0`. After the fix, both images retain
working authenticated URLs and have `naturalWidth === 300`.

The server logs paths and whether authentication was supplied, never header values.
The download link is a placeholder; this fixture only tests covers/detail refresh.
Stop the fixture with Ctrl-C after testing.

## Component regression tests

```sh
npm run testFile -- test/renderer/common/cover.test.ts
```

These check unchanged-URL refresh, changed-URL retry, switching cover/thumbnail,
removing/restoring a cover, and preventing infinite fallback retries. They exercise
the component lifecycle with synchronous state updates, not DOM/network behavior;
the Electron fixture above supplies that verification.

## Local validation (2026-09-10)

- Base: `31012075`, Thorium `3.5.2-beta.1`, macOS arm64.
- Reproduced the broken detail image in the unmodified Electron build.
- Patched build retains both authenticated images after the delayed response.
- Verified real HTTPS/Basic-auth catalogue: Lipu, The Hobbit; list and detail
  images both loaded at 567 × 764 after the detail refresh.
- Five cover regression tests pass; four failed before the behavior fix.
- Full Webpack build and targeted ESLint pass (three pre-existing main-bundle warnings).
- Full Jest run: 153 passed, three failed in unrelated PDF annotation and LPF
  conversion tests. The same three failures were reproduced in a detached,
  unmodified baseline worktree using the same installed dependencies.

No changes to server authentication, public cover access, or URL signing.
The launcher uses a dedicated test profile, not the installed application's library.
