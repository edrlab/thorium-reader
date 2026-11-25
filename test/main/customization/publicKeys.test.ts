import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { spawnSync } from "node:child_process";
import { createPublicKey } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

describe("customization profile build keys", () => {
    let directory: string;

    beforeAll(() => {
        fs.mkdirSync(path.resolve("dist"), { recursive: true });
        directory = fs.mkdtempSync(path.join(path.resolve("dist"), "thorium-public-keys-"));
    });

    afterAll(() => {
        if (directory) fs.rmSync(directory, { recursive: true, force: true });
    });

    it.each(["dev", "prod"])("loads only the %s public key and normalizes PEM line endings", (mode) => {
        const result = spawnSync(
            process.execPath,
            [
                "-e",
                `
            const fs = require("node:fs");
            const path = require("node:path");
            const readFileSync = fs.readFileSync;
            fs.readFileSync = function(file, ...args) {
                if (typeof file === "string" && file.endsWith(".pem")) {
                    if (!file.endsWith("public.pem")) throw new Error("Build tried to read a private PEM");
                    const pem = readFileSync.call(this, file, "utf8").replace(/\\r?\\n/g, "\\r\\n");
                    return args[0] === "utf8" ? pem : Buffer.from(pem);
                }
                return readFileSync.call(this, file, ...args);
            };
            const { definePlugin } = require(path.resolve("webpack.config-preprocessor-directives.js"));
            const keyPrefix = "__TH__CUSTOMIZATION_PROFILE_";
            console.log("RESULT=" + JSON.stringify({
                key: JSON.parse(definePlugin.definitions[keyPrefix + "PUB_KEY__"]),
                privateKeyDefined: keyPrefix + "PRIVATE_KEY__" in definePlugin.definitions,
            }));
        `,
            ],
            {
                encoding: "utf8",
                timeout: 10000,
                env: {
                    ...process.env,
                    THORIUM_TELEMETRY_SECRET: mode === "prod" ? "test" : "",
                    THORIUM_TELEMETRY_SECRET_DATA: mode === "prod" ? "test" : "",
                },
            },
        );
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);
        const line = result.stdout.split(/\r?\n/).find((value) => value.startsWith("RESULT="));
        const data = JSON.parse(line.slice("RESULT=".length)) as { key: string; privateKeyDefined: boolean };
        const expected = createPublicKey(
            fs.readFileSync(path.join("resources/customization-profile-keys", mode, "public.pem")),
        )
            .export({ type: "spki", format: "pem" })
            .toString();
        expect(data.key).toBe(expected);
        expect(data.key).not.toContain("\r");
        expect(data.privateKeyDefined).toBe(false);
    });

    it("copies app resources without shipping any customization key files", () => {
        const entry = path.join(directory, "entry.js");
        fs.writeFileSync(entry, "console.log('resource copy check');");
        const result = spawnSync(
            process.execPath,
            [
                "-e",
                `
            const assert = require("node:assert/strict");
            const fs = require("node:fs");
            const path = require("node:path");
            const webpack = require("webpack");
            const CopyPlugin = require("copy-webpack-plugin");
            const config = require(path.resolve("webpack.config.main.js"));
            const resource = config.plugins.flatMap(plugin => plugin.patterns || [])
                .find(pattern => pattern.from === path.resolve("resources"));
            assert.ok(resource, "Main build must have a resources copy pattern");
            assert.ok(fs.existsSync("resources/customization-profile-keys/dev/public.pem"));
            const compiler = webpack({
                mode: "production",
                target: "node",
                entry: process.argv[1],
                output: {path: process.argv[2], filename: "main.js"},
                optimization: {minimize: false},
                plugins: [new CopyPlugin({patterns: [resource]})],
            });
            compiler.run((error, stats) => compiler.close(closeError => {
                if (error || closeError || stats.hasErrors()) {
                    console.error(error || closeError || stats.toString());
                    process.exitCode = 1;
                    return;
                }
                assert.ok(fs.existsSync(path.join(process.argv[2], "assets/icons/icon.png")));
                assert.equal(fs.existsSync(path.join(process.argv[2], "assets/icons/customization-profile-keys")), false);
                console.log("RESULT=PASS");
            }));
        `,
                entry,
                path.join(directory, "output"),
            ],
            {
                encoding: "utf8",
                timeout: 15000,
                env: { ...process.env, NODE_ENV: "production" },
            },
        );
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);
        expect(result.stdout).toContain("RESULT=PASS");
    });
});
