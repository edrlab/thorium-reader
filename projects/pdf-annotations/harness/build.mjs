import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as esbuild from "esbuild";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(harnessDir, "../../..");
const entryPoint = resolve(harnessDir, "standaloneAnnotationHarness.ts");
const outfile = resolve(harnessDir, "dist", "standaloneAnnotationHarness.js");

await mkdir(dirname(outfile), { recursive: true });

await esbuild.build({
    absWorkingDir: repoRoot,
    bundle: true,
    entryPoints: [entryPoint],
    format: "esm",
    logLevel: "info",
    outfile,
    platform: "browser",
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
                    };
                });
            },
        },
    ],
    sourcemap: true,
    target: "es2022",
    tsconfig: resolve(harnessDir, "tsconfig.esbuild.json"),
});

console.log(`Built ${outfile}`);
