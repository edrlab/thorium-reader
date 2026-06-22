import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(harnessDir, "../../..");
const entryPoint = resolve(harnessDir, "standaloneAnnotationHarness.ts");
const outfile = resolve(harnessDir, "dist", "standaloneAnnotationHarness.js");

await mkdir(dirname(outfile), { recursive: true });
const entryContents = await readFile(entryPoint, "utf8");

await esbuild.build({
    absWorkingDir: harnessDir,
    bundle: true,
    format: "esm",
    logLevel: "info",
    outfile,
    platform: "browser",
    stdin: {
        contents: entryContents,
        loader: "ts",
        resolveDir: harnessDir,
        sourcefile: "standaloneAnnotationHarness.ts",
    },
    plugins: [
        {
            name: "readium-desktop-alias",
            setup(build) {
                build.onResolve({ filter: /^readium-desktop\// }, (args) => {
                    const withoutAlias = args.path.slice("readium-desktop/".length);
                    let sourcePath = resolve(repoRoot, "src", withoutAlias);
                    if (!existsSync(sourcePath) && existsSync(`${sourcePath}.ts`)) {
                        sourcePath = `${sourcePath}.ts`;
                    }

                    return {
                        path: sourcePath,
                        namespace: "thorium-src",
                    };
                });

                build.onResolve({ filter: /^\.\.?\//, namespace: "thorium-src" }, (args) => {
                    let sourcePath = resolve(args.resolveDir, args.path);
                    if (!existsSync(sourcePath) && existsSync(`${sourcePath}.ts`)) {
                        sourcePath = `${sourcePath}.ts`;
                    }

                    return {
                        path: sourcePath,
                        namespace: "thorium-src",
                    };
                });

                build.onLoad({ filter: /\.ts$/, namespace: "thorium-src" }, async (args) => ({
                    contents: await readFile(args.path, "utf8"),
                    loader: "ts",
                    resolveDir: dirname(args.path),
                }));
            },
        },
    ],
    sourcemap: true,
    target: "es2022",
    tsconfig: "tsconfig.esbuild.json",
});

console.log(`Built ${outfile}`);
