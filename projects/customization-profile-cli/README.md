# Standalone customization profile CLI

Build the distributable from the repository with its development dependencies installed:

```sh
npm run build:customization-profile-cli
```

The result is `projects/customization-profile-cli/dist/thorium-profile.cjs`. Copy this single file wherever you want to run it. It requires Node.js 22.2 or newer, with no Thorium installation, Electron, additional npm packages, environment variables, or adjacent configuration files. All runtime dependencies and the shared manifest schema are bundled. The `.cjs` extension also works inside directories whose `package.json` declares `"type": "module"`.

## Pack and sign

```sh
node thorium-profile.cjs pack --input ./my-profile --output ./my-profile.thorium --private-key ./keys/private.pem --public-key ./keys/public.pem
```

The input directory contains a version 1 `manifest.json` and the local resources referenced by its images, links, and publications. Paths inside the manifest use forward slashes; `./` prefixes are optional. Resources must resolve inside the input directory. Remote URLs are left unchanged and are not downloaded. Files that are not referenced in the manifest are not packaged, including assets referenced only from HTML or CSS: declare these assets in the manifest as well.

Both key files are required. Supply an unencrypted PEM EC private key and a matching PEM public key using curve P-521 (`secp521r1`). The tool does not generate keys, use environment keys, or fall back to the repository's development key pair. Only the public key is embedded in the resulting archive.

The output is an explicit filename ending in `.thorium`. Its parent directory must exist, and existing files are never overwritten. The tool verifies the temporary archive before copying it to the requested destination. Success prints `OUTPUT= <absolute filename>`; errors go to stderr and return exit code 1.

From the repository, the npm entry point builds and runs the same CLI:

```sh
npm run package-customization-profile -- pack --input ./my-profile --output ./my-profile.thorium --private-key ./keys/private.pem --public-key ./keys/public.pem
```

This replaces the former positional `--signed=true|false inputDirectory outputDirectory` interface. Packaging now always signs with explicitly supplied key files. The shell script in `scripts/package-customization-profile.sh` forwards the same new arguments; the npm command works without a shell script on Windows.

## Verify

```sh
node thorium-profile.cjs verify --input ./my-profile.thorium --public-key ./keys/public.pem
```

Supply the public key you trust. Verification checks it against the embedded key, validates the manifest signature, reads every archive entry to check its CRC32, checks the resource content hash, and confirms that referenced local resources are present. Success prints `VERIFIED= <filename>` and returns exit code 0. Unsigned profiles are rejected.

The on-disk format remains compatible with Thorium: ECDSA/SHA-256 over `JSON.stringify(manifest)` with `signature` omitted, a hex-encoded signature, and a SHA-1 content hash of `|` followed by the ZIP-order hexadecimal resource CRC32 values separated by `|`. `manifest.json` is excluded from that content hash. A manifest-only profile hashes `|`. Thorium still requires the embedded public key to match the key shipped in that Thorium build.

## Development checks

```sh
npm run check:customization-profile-cli
npm run test:customization-profile-cli
```

The tests build a bundle outside the repository, invoke it as a separate process with PEM files, and check compatibility with existing signed profiles. The build rejects unbundled npm dependencies and unexpected Thorium runtime imports.

Source imports use named aliases rather than relative module paths. The local `package.json` defines Node's private `#profile-cli/*` imports for CLI modules; the shared schema and types use the repository's `readium-desktop/*` TypeScript alias. TypeScript and esbuild resolve these aliases during development and bundling. The distributed `.cjs` file does not need this `package.json`.
