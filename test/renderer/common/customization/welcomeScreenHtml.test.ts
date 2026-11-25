import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
const globals = new Map<string, PropertyDescriptor | undefined>();
let prepareWelcome: typeof import("readium-desktop/renderer/common/customization/welcomeScreenHtml").prepareProfileWelcomeScreenHtml;
const base = "thoriumhttps://host/custom-profile-zip/profile/";
const screen = "welcome-screen/welcome-screen.html";
const asset = (path: string) => base + encodeURIComponent(Buffer.from(path).toString("base64"));

beforeAll(() => {
    for (const [key, value] of Object.entries({
        window: dom.window,
        document: dom.window.document,
        DOMParser: dom.window.DOMParser,
    })) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    // DOMPurify binds to the renderer window when its module is initialized.
    prepareWelcome = (require("readium-desktop/renderer/common/customization/welcomeScreenHtml") as
        typeof import("readium-desktop/renderer/common/customization/welcomeScreenHtml")).prepareProfileWelcomeScreenHtml;
});

afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

describe("welcome screen package resources", () => {
    it("resolves the logo from the welcome document's folder after sanitizing the markup", () => {
        const html = prepareWelcome(`<!doctype html><html><head><base href="https://untrusted.test/"></head><body>
            <h1>Welcome</h1><script>alert(1)</script>
            <img src="../images/logo.svg" alt="Packaged profile logo" onerror="alert(1)">
            <img src="/images/caf%C3%A9%20logo.png?v=2#icon" alt="Second logo">
        </body></html>`, screen, base);
        const document = new dom.window.DOMParser().parseFromString(html, "text/html");
        const images = document.querySelectorAll("img");
        expect(images[0].getAttribute("src")).toBe(asset("images/logo.svg"));
        expect(images[0].alt).toBe("Packaged profile logo");
        expect(images[1].getAttribute("src")).toBe(`${asset("images/café logo.png")}?v=2#icon`);
        expect(document.querySelector("h1")?.textContent).toBe("Welcome");
        expect(document.querySelector("base, script, [onerror]")).toBeNull();
    });

    it("rewrites picture candidates and CSS assets while preserving remote and document-local references", () => {
        const html = prepareWelcome(`<section>
            <style>.welcome { background: url(../images/background.png); }</style>
            <picture><source srcset="../images/small.svg 1x, ../images/large.svg 2x">
                <img src="https://example.test/logo.svg" srcset="../images/logo.svg 1x, https://example.test/logo-large.svg 2x">
            </picture>
            <div class="welcome" style="background-image:url(../images/tile.png);filter:url(#filter)"></div>
            <a href="https://example.test/">More information</a>
        </section>`, screen, base);
        const document = new dom.window.DOMParser().parseFromString(html, "text/html");
        expect(document.querySelector("source").getAttribute("srcset"))
            .toBe(`${asset("images/small.svg")} 1x, ${asset("images/large.svg")} 2x`);
        expect(document.querySelector("img").getAttribute("src")).toBe("https://example.test/logo.svg");
        expect(document.querySelector("img").getAttribute("srcset"))
            .toBe(`${asset("images/logo.svg")} 1x, https://example.test/logo-large.svg 2x`);
        expect(document.querySelector("style").textContent).toContain(`url("${asset("images/background.png")}")`);
        expect(document.querySelector(".welcome").getAttribute("style"))
            .toBe(`background-image:url("${asset("images/tile.png")}");filter:url(#filter)`);
        expect(document.querySelector("a").getAttribute("href")).toBe("https://example.test/");
    });

    it("uses the current profile and localized HTML path instead of the host application's document URL", () => {
        const otherBase = "thoriumhttps://host/custom-profile-zip/other-profile/";
        const html = prepareWelcome('<h1>Bienvenue</h1><img src="../../images/logo.svg">', "localized/fr/welcome.html", otherBase);
        const document = new dom.window.DOMParser().parseFromString(html, "text/html");
        expect(document.querySelector("img").getAttribute("src"))
            .toBe(otherBase + encodeURIComponent(Buffer.from("images/logo.svg").toString("base64")));
    });
});
