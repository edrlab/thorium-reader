import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { expect, jest, test } from "@jest/globals";
import { UserProfileDetails } from "readium-desktop/renderer/library/components/opds/UserProfile";
import type { I18nFunction } from "readium-desktop/common/services/translator";

jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("readium-desktop/renderer/library/apiAction", () => ({ apiAction: jest.fn() }));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));

test("profile quota headings use the English and French translations", () => {
    for (const [locale, headings] of [
        ["en", ["Loans", "Holds"]],
        ["fr", ["Prêts", "Réservations"]],
    ] as const) {
        const messages = JSON.parse(readFileSync(`src/resources/locales/${locale}.json`, "utf8"));
        const translate = ((key: string) =>
            key.split(".").reduce((value, part) => value[part], messages)) as I18nFunction;
        const html = renderToStaticMarkup(
            <UserProfileDetails profile={{ loans: { available: 1 }, holds: { available: 2 } }} __={translate} />,
        );
        const dom = new JSDOM(html);
        try {
            expect(Array.from(dom.window.document.querySelectorAll("h4"), (heading) => heading.textContent)).toEqual(
                headings,
            );
        } finally {
            dom.window.close();
        }
    }
});

test("translation scanner retains both quota headings and every locale declares them", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "thorium-profile-labels-"));
    try {
        const output = path.relative(process.cwd(), path.join(directory, "scanned.json"));
        execFileSync(process.execPath, ["scripts/translate-scan.js", output], { stdio: "pipe" });
        const scanned = JSON.parse(readFileSync(output, "utf8"));
        expect(scanned.catalog.userProfile).toHaveProperty("loans");
        expect(scanned.catalog.userProfile).toHaveProperty("holds");
        for (const locale of readdirSync("src/resources/locales").filter((file) => file.endsWith(".json"))) {
            const messages = JSON.parse(readFileSync(path.join("src/resources/locales", locale), "utf8"));
            expect(messages.catalog.userProfile).toHaveProperty("loans");
            expect(messages.catalog.userProfile).toHaveProperty("holds");
        }
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
