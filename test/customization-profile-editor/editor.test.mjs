import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
let browser;
let directory;
let context;
let page;
let pageErrors;
let networkRequests;

async function importManifest(value) {
    await page.locator("#file").setInputFiles({
        name: "manifest.json", mimeType: "application/json",
        buffer: Buffer.from(typeof value === "string" ? value : JSON.stringify(value)),
    });
}

async function downloadManifest() {
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download manifest.json" }).click();
    const download = await downloading;
    assert.equal(download.suggestedFilename(), "manifest.json");
    return JSON.parse(await readFile(await download.path(), "utf8"));
}

async function addResource(kind, preset, href) {
    await page.locator(`#${kind}-preset`).selectOption(preset);
    await page.locator(`#add-${kind}`).click();
    const card = page.locator(`#${kind}-list .resource-entry`).last();
    await card.locator("[data-field=href]").fill(href);
    return card;
}

describe("standalone offline profile editor", { timeout: 30000 }, () => {
    before(async () => {
        directory = await mkdtemp(path.join(os.tmpdir(), "thorium-profile-editor-"));
        await copyFile(path.join(root, "scripts/thorium-profile-editor.html"), path.join(directory, "editor.html"));
        browser = await chromium.launch({ channel: process.env.PROFILE_EDITOR_BROWSER_CHANNEL || undefined });
    });
    beforeEach(async () => {
        context = await browser.newContext({ offline: true, acceptDownloads: true, viewport: { width: 1280, height: 900 } });
        page = await context.newPage();
        pageErrors = [];
        networkRequests = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("request", (request) => {
            if (/^https?:/.test(request.url())) networkRequests.push(request.url());
        });
        page.on("dialog", (dialog) => dialog.accept());
        await page.goto(pathToFileURL(path.join(directory, "editor.html")).href);
        await page.locator("#light-primary").waitFor();
    });
    afterEach(async () => {
        await context?.close();
        assert.deepEqual(pageErrors, []);
        assert.deepEqual(networkRequests, [], "The editor must never request network resources");
    });
    after(async () => {
        await browser?.close();
        if (directory) await rm(directory, { recursive: true, force: true });
    });

    it("exports offline from an unrelated folder and produces a packable, verifiable manifest", async () => {
        await page.locator("#identifier").fill("thorium-manifest://org.example.offline");
        await page.locator("#title").fill("Offline library");
        await page.locator("#description").fill("A profile created without a server.");
        await page.locator("#dark-primary").fill("#AABBCC");
        await addResource("images", "logo", "images/logo.svg");
        await addResource("images", "image", "styles/profile.css");
        await addResource("links", "welcome-page", "welcome/en.html");
        const screen = await addResource("links", "screen", "screen/help.html");
        await screen.locator("[data-field=language]").fill("en");
        await screen.getByLabel("Link title format", { exact: true }).selectOption("plain");
        await screen.locator(".resource-title .plain textarea").fill("Help");
        const catalog = await addResource("links", "catalog", "https://example.org/catalog.json");
        await catalog.locator(".auth-enabled").check();
        await catalog.locator("[data-field=auth-href]").fill("https://example.org/authentication.json");
        await page.getByRole("button", { name: "Add publication", exact: true }).click();
        const publication = page.locator(".publication-entry");
        await publication.locator(".publication-title .plain textarea").fill("Offline book");
        await publication.locator("[data-metadata=author]").fill("Example author");
        await publication.locator("[data-metadata=identifier]").fill("urn:example:offline-book");
        await publication.locator("[data-metadata=language]").fill("en, fr");
        await publication.locator(".resource-entry").first().locator("[data-field=href]").fill("books/story.epub");
        await publication.getByRole("button", { name: "Add cover", exact: true }).click();
        await publication.locator(".resource-entry").last().locator("[data-field=href]").fill("images/cover.svg");
        await publication.locator(".resource-entry").last().locator("[data-field=type]").fill("image/svg+xml");
        const manifest = await downloadManifest();
        assert.equal(manifest.version, 1);
        assert.equal(manifest.title, "Offline library");
        assert.equal(manifest.theme.color.dark.primary, "#AABBCC");
        assert.ok(!Object.hasOwn(manifest, "signature"));
        assert.ok(!Object.hasOwn(manifest, "contentHash"));
        assert.ok(!Object.hasOwn(manifest, "modified"));
        assert.ok(!Number.isNaN(Date.parse(manifest.created)));
        assert.equal(manifest.images[0].rel, "logo");
        assert.equal(manifest.links[0].rel, "welcome-screen");
        assert.equal(manifest.links[1].title, "Help");
        assert.equal(manifest.links[2].properties.authenticate.type, "application/opds-authentication+json");
        assert.equal(manifest.publications[0].metadata.title, "Offline book");
        assert.deepEqual(manifest.publications[0].metadata.author, { name: "Example author" });
        assert.deepEqual(manifest.publications[0].metadata.language, ["en", "fr"]);

        const input = path.join(directory, "profile with spaces");
        await mkdir(input);
        for (const folder of ["images", "styles", "welcome", "screen", "books"]) await mkdir(path.join(input, folder));
        await writeFile(path.join(input, "images/logo.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>');
        await copyFile(path.join(input, "images/logo.svg"), path.join(input, "images/cover.svg"));
        await copyFile(path.join(root, "test/customization/profile/thorium_university_press/publications/moby.epub"), path.join(input, "books/story.epub"));
        await writeFile(path.join(input, "styles/profile.css"), ".custom-profile-screen { color: black; }");
        await writeFile(path.join(input, "welcome/en.html"), "<h1>Welcome</h1>");
        await writeFile(path.join(input, "screen/help.html"), "<h1>Help</h1>");
        await writeFile(path.join(input, "manifest.json"), JSON.stringify(manifest));
        await page.locator("#folder-files").setInputFiles(input);
        await page.locator("#folder-status").filter({ hasText: "6 of 6 referenced local files found" }).waitFor();
        assert.equal(await page.locator(".file-missing").count(), 0);
        assert.match(await page.locator("#notice").textContent(), /Manifest downloaded/);
        const pair = generateKeyPairSync("ec", {
            namedCurve: "secp521r1",
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
            publicKeyEncoding: { type: "spki", format: "pem" },
        });
        const privateKey = path.join(directory, "private.pem");
        const publicKey = path.join(directory, "public.pem");
        const cli = path.join(directory, "thorium-profile.cjs");
        const output = path.join(directory, "offline.thorium");
        await writeFile(privateKey, pair.privateKey);
        await writeFile(publicKey, pair.publicKey);
        await copyFile(path.join(root, "scripts/thorium-profile.cjs"), cli);
        const packed = spawnSync(process.execPath, [cli, "pack", "--input", input, "--output", output,
            "--private-key", privateKey, "--public-key", publicKey], { encoding: "utf8", timeout: 10000, cwd: directory });
        assert.equal(packed.status, 0, packed.stderr);
        const verified = spawnSync(process.execPath, [cli, "verify", "--input", output, "--public-key", publicKey],
            { encoding: "utf8", timeout: 10000, cwd: directory });
        assert.equal(verified.status, 0, verified.stderr);
    });

    it("round-trips translations, resources and nested extensions without rendering imported HTML", async () => {
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.title = { en: "</textarea><img src='https://example.invalid/x' onerror='alert(1)'>", fr: "Bibliothèque" };
        source.description = { en: "A library", fr: "Une bibliothèque" };
        source.theme.extra = { enabled: true };
        source.theme.color.light.extra = "preserve me";
        source.theme.color.extra = { retained: true };
        source.extension = JSON.parse('{"__proto__":{"safe":true},"nested":[1,2,3]}');
        source.images[0].title = { en: "</textarea><img src='https://example.invalid/image'>", fr: "Image" };
        source.images[0].width = 150;
        source.links[0].title = { en: "FAQ", fr: "Questions" };
        source.links[0].extension = { nested: [1, 2] };
        source.links[6].properties.authenticate.extension = { preserved: true };
        source.links[6].properties.extra = "preserve me";
        source.links.push({ rel: "</summary><img src='https://example.invalid/link'>", href: "assets/extra.json", extension: true });
        source.signature = { key: "old", value: "old", algorithm: "old" };
        source.contentHash = "old";
        await importManifest("\uFEFF" + JSON.stringify(source));
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.equal(await page.locator("img").count(), 0);
        await page.locator("#dark-primary").fill("rgb(240, 241, 242)");
        const result = await downloadManifest();
        delete source.signature;
        delete source.contentHash;
        source.theme.color.dark.primary = "rgb(240, 241, 242)";
        assert.deepEqual(result, source);
    });

    it("rejects malformed, incomplete and unsupported imports without replacing edits", async () => {
        await page.locator("#identifier").fill("thorium-manifest://org.example.keep");
        await page.locator("#title").fill("Keep this title");
        const draft = await page.locator("#json").inputValue();
        for (const invalid of ["{bad json", "[]", "null", '{"version":1}',
            JSON.stringify({ ...JSON.parse(draft), version: 2 }),
            JSON.stringify({ ...JSON.parse(draft), identifier: "not a URI" }),
            JSON.stringify({ ...JSON.parse(draft), images: [{ href: { invalid: true } }] }),
            JSON.stringify({ ...JSON.parse(draft), links: [{ href: "screen/help.html", title: ["invalid"] }] }),
            JSON.stringify({ ...JSON.parse(draft), links: [{ href: "https://example.org/", properties: { authenticate: null } }] })]) {
            await importManifest(invalid);
            await page.locator("#errors").filter({ hasText: "Import failed" }).waitFor();
            assert.equal(await page.locator("#json").inputValue(), draft);
            assert.equal(await page.locator("#title").inputValue(), "Keep this title");
        }
    });

    it("blocks missing metadata, duplicate languages and bad colors, then recovers after corrections", async () => {
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        await page.locator("#errors").filter({ hasText: "Identifier" }).waitFor();
        await page.locator("#identifier").fill("thorium-manifest://org.example.languages");
        await page.locator("#title").fill("English title");
        await page.locator("#description").fill("Description");
        await page.getByLabel("Title format", { exact: true }).selectOption("translations");
        assert.equal(await page.locator("#title-field .translation textarea").inputValue(), "English title");
        await page.locator("#title-field .add-language").click();
        await page.locator("#title-field .translation").nth(1).locator("input").fill("EN");
        await page.locator("#title-field .translation").nth(1).locator("textarea").fill("Another title");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        await page.locator("#errors").filter({ hasText: "Each language must be unique" }).waitFor();
        await page.locator("#title-field .translation").nth(1).locator("input").fill("fr");
        await page.locator("#light-primary").fill("not-a-color");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        await page.locator("#errors").filter({ hasText: "valid CSS color" }).waitFor();
        await page.locator("#light-primary").fill("rebeccapurple");
        const manifest = await downloadManifest();
        assert.deepEqual(manifest.title, { en: "English title", fr: "Another title" });
        assert.equal(manifest.theme.color.light.primary, "rebeccapurple");
        assert.equal(await page.locator("#errors").isHidden(), true);
    });

    it("edits colors through the picker and fits narrow screens", async () => {
        await page.locator("#light-primary").fill("rebeccapurple");
        await page.getByLabel("light primary picker", { exact: true }).evaluate((picker) => {
            picker.value = "#123456";
            picker.dispatchEvent(new Event("input", { bubbles: true }));
        });
        assert.equal(await page.locator("#light-primary").inputValue(), "#123456");
        assert.equal(JSON.parse(await page.locator("#json").inputValue()).theme.color.light.primary, "#123456");
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
        await page.getByRole("button", { name: "New manifest" }).click();
        assert.equal(await page.locator("#identifier").inputValue(), "");
        assert.equal(await page.locator("#light-primary").inputValue(), "#202020");
    });

    it("keeps current text across format switches and respects cancelled replacements", async () => {
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.title = { en: "Original title", fr: "Titre français" };
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        await page.getByLabel("Title format", { exact: true }).selectOption("plain");
        await page.locator("#title").fill("Updated title");
        await page.getByLabel("Title format", { exact: true }).selectOption("translations");
        assert.deepEqual(JSON.parse(await page.locator("#json").inputValue()).title,
            { en: "Updated title", fr: "Titre français" });
        const draft = await page.locator("#json").inputValue();
        page.removeAllListeners("dialog");
        page.on("dialog", (dialog) => dialog.dismiss());
        await page.getByRole("button", { name: "New manifest" }).click();
        assert.equal(await page.locator("#json").inputValue(), draft);
        const dialog = page.waitForEvent("dialog");
        await importManifest(source);
        await dialog;
        assert.equal(await page.locator("#json").inputValue(), draft);
    });

    it("edits, duplicates, reorders and removes resources while preserving nested fields", async () => {
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.images = [
            { rel: "logo", href: "images/logo.svg", title: { en: "Logo", fr: "Logo français" }, extension: { nested: [1, 2] } },
            { rel: "asset", href: "assets/extra.css", properties: { custom: true } },
        ];
        source.links = [
            { rel: "catalog", href: "https://example.org/catalog.json", title: "Catalog", properties: {
                authenticate: { href: "", type: "application/opds-authentication+json", extension: { keep: true } }, other: [1, 2],
            } },
            { rel: "custom", href: "assets/other.json", custom: { retained: true } },
        ];
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        const images = page.locator("#images-list .resource-entry");
        await images.nth(0).locator("summary").click();
        await images.nth(0).locator("[data-field=href]").fill("images/updated.svg");
        await images.nth(0).locator(".resource-title .translation textarea").nth(1).fill("Logo modifié");
        await images.nth(0).getByRole("button", { name: "Duplicate image", exact: true }).click();
        await images.nth(1).locator("[data-field=href]").fill("images/copy.svg");
        await images.nth(1).locator(".resource-title .translation textarea").nth(1).fill("Copie");
        await images.nth(1).getByRole("button", { name: "Move image down" }).click();
        await images.nth(1).locator("summary").click();
        await images.nth(1).getByRole("button", { name: "Remove image", exact: true }).click();
        const links = page.locator("#links-list .resource-entry");
        await links.nth(0).locator("summary").click();
        await links.nth(0).locator("[data-field=auth-href]").fill("https://example.org/new-auth.json");
        await links.nth(0).locator(".auth-enabled").uncheck();
        let draft = JSON.parse(await page.locator("#json").inputValue());
        assert.deepEqual(draft.links[0].properties, { other: [1, 2] });
        await links.nth(0).locator(".auth-enabled").check();
        await links.nth(0).getByLabel("Link title format", { exact: true }).selectOption("none");
        await links.nth(0).getByRole("button", { name: "Move link down" }).click();
        draft = await downloadManifest();
        assert.deepEqual(draft.images.map((image) => image.href), ["images/updated.svg", "images/copy.svg"]);
        assert.deepEqual(draft.images.map((image) => image.title.fr), ["Logo modifié", "Copie"]);
        assert.deepEqual(draft.images[1].extension, source.images[0].extension);
        assert.deepEqual(draft.links[0], source.links[1]);
        assert.deepEqual(draft.links[1].properties, {
            authenticate: { href: "https://example.org/new-auth.json", type: "application/opds-authentication+json", extension: { keep: true } },
            other: [1, 2],
        });
        assert.ok(!Object.hasOwn(draft.links[1], "title"));
        assert.deepEqual(draft.publications, source.publications);
        await importManifest(draft);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.deepEqual(await downloadManifest(), draft);
    });

    it("shows resource errors in their entries and accepts corrections without fetching URLs", async () => {
        await page.locator("#identifier").fill("thorium-manifest://org.example.validation");
        await page.locator("#title").fill("Resources");
        await page.locator("#description").fill("Test resource validation");
        const image = await addResource("images", "image", "images/valid.png");
        for (const invalid of ["../outside.png", "images/../../outside.png", "/absolute.png", "C:\\outside.png", "images/..", "./manifest.json"]) {
            await image.locator("[data-field=href]").fill(invalid);
            await page.getByRole("button", { name: "Download manifest.json" }).click();
            assert.equal(await image.locator(".entry-error").isVisible(), true);
            assert.equal(await image.locator("[data-field=href]").getAttribute("aria-invalid"), "true");
        }
        await image.locator("[data-field=href]").fill("images/valid.png");
        const screen = await addResource("links", "screen", "https://example.org/help.html");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.match(await screen.locator(".entry-error").textContent(), /relative to the profile folder/);
        await screen.locator("[data-field=href]").fill("screen/help.html");
        await screen.locator("[data-field=type]").fill("text/plain");
        await screen.locator("[data-field=language]").fill("en_US");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.match(await screen.locator(".entry-error").textContent(), /text\/html/);
        assert.match(await screen.locator(".entry-error").textContent(), /language tag/);
        await screen.locator("[data-field=type]").fill("text/html");
        await screen.locator("[data-field=language]").fill("fr-CA");
        const catalog = await addResource("links", "catalog", "catalog.json");
        await catalog.locator(".auth-enabled").check();
        await catalog.locator("[data-field=auth-href]").fill("auth.json");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.match(await catalog.locator(".entry-error").textContent(), /HTTP or HTTPS/);
        await catalog.locator("[data-field=href]").fill("https://example.org/catalog.json");
        await catalog.locator("[data-field=auth-href]").fill("");
        await image.locator("[data-field=type]").fill("not a media type");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.match(await image.locator(".entry-error").textContent(), /media type/);
        await image.locator("[data-field=type]").fill("image/png");
        const result = await downloadManifest();
        assert.equal(result.links[0].language, "fr-CA");
        assert.equal(result.links[1].properties.authenticate.href, "");
        assert.equal(await page.locator("#errors").isHidden(), true);
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    });

    it("preserves absent and empty resource lists, and clears them on a new manifest", async () => {
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.images = [];
        delete source.links;
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.deepEqual(await downloadManifest(), source);
        const image = await addResource("images", "welcome-image", "welcome/image.png");
        await image.getByRole("button", { name: "Remove image", exact: true }).click();
        assert.deepEqual(await downloadManifest(), source);
        const link = await addResource("links", "self", "https://example.org/profile.thorium");
        await link.getByRole("button", { name: "Duplicate link", exact: true }).click();
        const links = page.locator("#links-list .resource-entry");
        await links.nth(1).locator("[data-field=href]").fill("https://example.org/copy.thorium");
        await links.nth(1).getByRole("button", { name: "Move link up" }).click();
        assert.deepEqual(JSON.parse(await page.locator("#json").inputValue()).links.map((entry) => entry.href),
            ["https://example.org/copy.thorium", "https://example.org/profile.thorium"]);
        await page.getByRole("button", { name: "New manifest" }).click();
        const result = JSON.parse(await page.locator("#json").inputValue());
        assert.ok(!Object.hasOwn(result, "images"));
        assert.ok(!Object.hasOwn(result, "links"));
        assert.equal(await page.locator(".resource-entry").count(), 0);
    });

    it("preserves rich OPDS data across advanced JSON, guided edits and publication ordering", async () => {
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.images = [];
        source.links = [];
        const book = source.publications[0];
        book.metadata.title = { en: "A book", fr: "Un livre" };
        book.metadata.author = [{ name: { en: "First author", fr: "Premier auteur" }, identifier: "urn:author:first" }, { name: "Second author", role: "edt" }];
        book.metadata.publisher = { name: "A publisher", identifier: "urn:publisher:one" };
        book.metadata.extension = { retained: [1, 2] };
        book.links[0].rel = ["http://opds-spec.org/acquisition/open-access", "alternate"];
        book.links[0].properties = { indirectAcquisition: [{ type: "application/epub+zip" }] };
        book.extension = JSON.parse('{"__proto__":{"safe":true},"keep":true}');
        source.publications = [book];
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.deepEqual(await downloadManifest(), source);
        let publication = page.locator(".publication-entry").first();
        await publication.locator(":scope > summary").click();
        assert.equal(await publication.locator(".publication-mode").inputValue(), "json");
        book.metadata.extension.edited = true;
        await publication.locator(".advanced-json").fill(JSON.stringify(book));
        const lastParseable = await page.locator("#json").inputValue();
        await publication.locator(".advanced-json").fill("{invalid");
        assert.equal(await page.locator("#json").inputValue(), lastParseable);
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.match(await publication.locator(":scope > .entry-fields > .entry-error").textContent(), /Invalid publication JSON/);
        await publication.getByRole("button", { name: "Duplicate publication", exact: true }).click();
        assert.equal(await page.locator(".publication-entry").count(), 1);
        await publication.locator(".publication-mode").selectOption("guided");
        assert.equal(await publication.locator(".publication-mode").inputValue(), "json");
        assert.equal(await publication.locator(".advanced-json").inputValue(), "{invalid");
        book.links[0].rel = "http://opds-spec.org/acquisition/open-access";
        await publication.locator(".advanced-json").fill(JSON.stringify(book));
        await publication.locator(".publication-mode").selectOption("guided");
        assert.equal(await publication.locator(".publication-mode").inputValue(), "guided");
        assert.equal(await publication.locator("[data-metadata=author]").isDisabled(), true);
        await publication.locator("[data-metadata=publisher]").fill("Updated publisher");
        await publication.locator(".publication-title .translation textarea").nth(1).fill("Titre modifié");
        await publication.locator(".publication-mode").selectOption("json");
        let result = JSON.parse(await publication.locator(".advanced-json").inputValue());
        assert.deepEqual(result.metadata.author, book.metadata.author);
        assert.deepEqual(result.metadata.publisher, { name: "Updated publisher", identifier: "urn:publisher:one" });
        assert.deepEqual(result.links[0].properties, book.links[0].properties);
        result.metadata.description = "</textarea><img src='https://example.invalid/book' onerror='alert(1)'>";
        await publication.locator(".advanced-json").fill(JSON.stringify(result));
        await publication.getByRole("button", { name: "Duplicate publication", exact: true }).click();
        const copy = page.locator(".publication-entry").nth(1);
        await copy.locator(".publication-title .translation textarea").nth(0).fill("Copy");
        await copy.getByRole("button", { name: "Move publication up" }).click();
        const exported = await downloadManifest();
        assert.equal(exported.publications[0].metadata.title.en, "Copy");
        assert.equal(exported.publications[1].metadata.title.en, "A book");
        assert.equal(exported.publications[0].metadata.title.fr, "Titre modifié");
        assert.deepEqual(exported.publications[0].extension, book.extension);
        assert.deepEqual(exported.publications[1].metadata.author, book.metadata.author);
        assert.equal(await page.locator("img").count(), 0);
        publication = page.locator(".publication-entry").nth(1);
        await publication.getByRole("button", { name: "Remove publication", exact: true }).click();
        assert.equal((await downloadManifest()).publications.length, 1);
    });

    it("validates publication fields and advanced objects without discarding the draft", async () => {
        await page.locator("#identifier").fill("thorium-manifest://org.example.book-validation");
        await page.locator("#title").fill("Books");
        await page.locator("#description").fill("Publication validation");
        await page.getByRole("button", { name: "Add publication", exact: true }).click();
        const publication = page.locator(".publication-entry");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.equal(await publication.locator(".publication-title .plain textarea").getAttribute("aria-invalid"), "true");
        assert.equal(await publication.locator(".resource-entry [data-field=href]").getAttribute("aria-invalid"), "true");
        await publication.locator(".publication-title .plain textarea").fill("Book");
        await publication.locator(".resource-entry [data-field=href]").fill("books/book.epub");
        await publication.locator("[data-metadata=language]").fill("en_US");
        await page.getByRole("button", { name: "Download manifest.json" }).click();
        assert.match(await publication.locator(":scope > .entry-fields > .entry-error").textContent(), /language tags/);
        await publication.locator("[data-metadata=language]").fill("en, fr-CA");
        await publication.locator(".publication-mode").selectOption("json");
        const saved = JSON.parse(await publication.locator(".advanced-json").inputValue());
        for (const invalid of ["null", "[]", '{"metadata":null}', JSON.stringify({ ...saved, links: [{ href: "../outside.epub" }] })]) {
            await publication.locator(".advanced-json").fill(invalid);
            await page.getByRole("button", { name: "Download manifest.json" }).click();
            assert.equal(await publication.locator(":scope > .entry-fields > .entry-error").isVisible(), true);
            assert.equal(await page.locator("#folder-draft-note").isVisible(), true);
        }
        await publication.locator(".advanced-json").fill(JSON.stringify(saved));
        assert.deepEqual((await downloadManifest()).publications, [saved]);
        await page.setViewportSize({ width: 390, height: 844 });
        await publication.locator(".publication-mode").selectOption("guided");
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    });

    it("checks exact local filenames across publications and deduplicates references without blocking export", async () => {
        const profileFolder = await mkdtemp(path.join(directory, "folder-check-"));
        await mkdir(path.join(profileFolder, "images"));
        await mkdir(path.join(profileFolder, "books"));
        await writeFile(path.join(profileFolder, "images/cover.svg"), "cover");
        await writeFile(path.join(profileFolder, "images/mixed.svg"), "case test");
        await writeFile(path.join(profileFolder, "books/é space.epub"), "book");
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.images = [
            { href: "./images/./cover.svg" }, { href: "images/sub/../cover.svg" }, { href: "images/Mixed.svg" },
            { href: "books/é space.epub" }, { href: "missing.txt" }, { href: "https://example.invalid/cover" },
        ];
        source.links = [{ rel: "catalog", href: "https://example.invalid/catalog" }];
        source.publications = [{ metadata: { title: "Folder book" }, links: [
            { href: "books/é space.epub", rel: "http://opds-spec.org/acquisition/open-access" },
            { href: "https://example.invalid/book" },
        ], images: [{ href: "images/cover.svg" }] }];
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.equal(await page.locator("#file-checklist li").count(), 4);
        await page.locator("#folder-files").setInputFiles(profileFolder);
        await page.locator("#folder-status").filter({ hasText: "2 of 4 referenced local files found" }).waitFor();
        assert.match(await page.locator("#folder-status").textContent(), /3 remote or fragment references/);
        assert.equal(await page.locator(".file-found").count(), 2);
        assert.equal(await page.locator(".file-missing").count(), 2);
        assert.match(await page.locator("#file-checklist").textContent(), /Case differs: images\/mixed.svg/);
        assert.match(await page.locator("#file-checklist").textContent(), /Publication 1 covers/);
        const directoryReference = await addResource("images", "image", "images/cover.svg/");
        assert.match(await page.locator("#folder-status").textContent(), /2 of 5 referenced local files found/);
        assert.match(await page.locator(".file-missing").last().textContent(), /images\/cover.svg\//);
        await directoryReference.getByRole("button", { name: "Remove image", exact: true }).click();
        const images = page.locator("#images-list .resource-entry");
        await images.nth(2).locator("summary").click();
        await images.nth(2).locator("[data-field=href]").fill("images/mixed.svg");
        await images.nth(4).locator("summary").click();
        await images.nth(4).getByRole("button", { name: "Remove image", exact: true }).click();
        assert.match(await page.locator("#folder-status").textContent(), /3 of 3 referenced local files found/);
        await rm(path.join(profileFolder, "images/cover.svg"));
        await page.locator("#folder-files").setInputFiles(profileFolder);
        await page.locator("#folder-status").filter({ hasText: "2 of 3 referenced local files found" }).waitFor();
        const result = await downloadManifest();
        assert.equal(result.publications[0].metadata.title, "Folder book");
        assert.equal(await page.locator(".file-missing").count(), 1);
        await page.getByRole("button", { name: "Clear folder", exact: true }).click();
        assert.equal(await page.locator(".file-unchecked").count(), 3);
        await page.locator("#folder-files").setInputFiles(profileFolder);
        await importManifest(result);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.equal(await page.getByRole("button", { name: "Clear folder", exact: true }).isDisabled(), true);
        assert.equal(await page.locator(".file-unchecked").count(), 3);
    });

    it("preserves empty and absent publication lists and clears publication and folder state on New", async () => {
        const source = JSON.parse(await readFile(path.join(root, "test/customization/profile/thorium_university_press/manifest.json"), "utf8"));
        source.publications = [];
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.deepEqual((await downloadManifest()).publications, []);
        await page.getByRole("button", { name: "Add publication", exact: true }).click();
        await page.getByRole("button", { name: "Remove publication", exact: true }).click();
        assert.deepEqual((await downloadManifest()).publications, []);
        delete source.publications;
        await importManifest(source);
        await page.getByRole("status").filter({ hasText: "Imported manifest.json" }).waitFor();
        assert.ok(!Object.hasOwn(await downloadManifest(), "publications"));
        await page.getByRole("button", { name: "Add publication", exact: true }).click();
        await page.getByRole("button", { name: "New manifest", exact: true }).click();
        assert.equal(await page.locator(".publication-entry").count(), 0);
        assert.ok(!Object.hasOwn(JSON.parse(await page.locator("#json").inputValue()), "publications"));
        assert.equal(await page.locator("#file-checklist li").count(), 0);
        assert.equal(await page.getByRole("button", { name: "Clear folder", exact: true }).isDisabled(), true);
    });
});
