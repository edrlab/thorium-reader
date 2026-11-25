import { build } from "esbuild";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../..");
const schemaFile = "src/common/readium/customization/profile.schema.ts";
const schemaBundle = await build({
    absWorkingDir: root,
    entryPoints: [schemaFile],
    bundle: true,
    format: "esm",
    platform: "node",
    metafile: true,
    write: false,
});
for (const input of Object.keys(schemaBundle.metafile.inputs)) {
    if (input !== schemaFile) throw new Error(`Unexpected manifest schema dependency: ${input}`);
}
const { customizationManifestJsonSchemaMinimal } = await import(
    `data:text/javascript;base64,${Buffer.from(schemaBundle.outputFiles[0].contents).toString("base64")}`
);
const ajv = new Ajv({ allErrors: true, code: { source: true } });
addFormats(ajv);
const validator = standaloneCode(ajv, ajv.compile(customizationManifestJsonSchemaMinimal));
const result = await build({
    absWorkingDir: root,
    entryPoints: [path.join(directory, "src/editor.ts")],
    tsconfig: path.join(directory, "tsconfig.json"),
    bundle: true,
    platform: "browser",
    target: "es2022",
    format: "iife",
    minify: true,
    legalComments: "inline",
    metafile: true,
    write: false,
    plugins: [{
        name: "manifest-validator",
        setup(builder) {
            builder.onResolve({ filter: /^#profile-editor\/validator$/ }, () => ({
                path: "validator", namespace: "manifest-validator",
            }));
            builder.onLoad({ filter: /.*/, namespace: "manifest-validator" }, () => ({
                contents: validator, resolveDir: root,
            }));
        },
    }],
});
for (const input of Object.keys(result.metafile.inputs)) {
    if (input.startsWith("src/")) {
        throw new Error(`Unexpected Thorium runtime dependency: ${input}`);
    }
}
for (const output of Object.values(result.metafile.outputs)) {
    if (output.imports.length) throw new Error("The editor must not have external dependencies");
}
const template = await readFile(path.join(directory, "editor.html"), "utf8");
const css = await readFile(path.join(directory, "editor.css"), "utf8");
const javascript = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = template.replace("/* EDITOR_STYLES */", () => css).replace("/* EDITOR_SCRIPT */", () => javascript);
const output = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "scripts/thorium-profile-editor.html");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, html);
console.log(`Built ${output}`);
