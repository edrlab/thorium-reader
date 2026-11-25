# Standalone customization profile CLI

Standalone profile packer/verifier for Node.js 24+. [Bash usage](../../docs/customization-profile-cli.md).

## Build and check

From the repository root, with development dependencies installed:

```bash
npm run build:customization-profile-cli
npm run check:customization-profile-cli
npm run test:customization-profile-cli
```

Build output: `scripts/thorium-profile.cjs` (generated and Git-ignored). Tests cover standalone execution and legacy profiles.

## Constraints

`build.mjs` emits one esbuild CommonJS bundle, rejecting external npm dependencies and Thorium runtime imports. Use `#profile-cli/*` internally and `readium-desktop/*` for shared schema/types; relative source imports are prohibited.

Keys live under [resources/customization-profile-keys](../../resources/customization-profile-keys/). The development pair is public test data. Production `public.pem` is tracked; `prod/private.pem` is Git-ignored. Docker excludes private PEMs. The CLI requires explicit key paths; the app build embeds only the selected public key and excludes the key directory from copied assets.

## Format compatibility

- ECDSA/SHA-256 over `JSON.stringify(manifest)` with `signature` omitted; public PEM, hex signature, and the existing `ECKeyValue` identifier are stored in `signature`.
- `contentHash`: SHA-1 of `|<crc32-hex>|...` in ZIP order, excluding `manifest.json`. An empty resource set hashes `|`.
- Verify the temporary archive before exclusive destination creation. Recompute entry CRC32 values and reject duplicate ZIP entries.
