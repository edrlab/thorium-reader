import * as React from "react";
import { afterAll, afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { URL_HOST_COMMON, URL_PROTOCOL_OPDS_MEDIA } from "readium-desktop/common/streamerProtocol";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import Cover from "readium-desktop/renderer/common/components/Cover";

jest.mock("readium-desktop/renderer/assets/styles/components/publications.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/spinnerContainer.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/images/opds-cover-broken.png", () => ({
    __esModule: true,
    default: "assets/opds-cover-broken.png",
}));
jest.mock("readium-desktop/renderer/common/components/SVG", () => ({ __esModule: true, default: (): null => null }));
jest.mock("readium-desktop/renderer/common/components/hoc/translator", () => ({
    withTranslator: (component: React.ComponentType) => component,
}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({
    useTranslator: () => [(key: string) => key],
}));

const dom = new JSDOM("<!doctype html><html><body></body></html>");
const globals = new Map<string, PropertyDescriptor | undefined>();
for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    IS_REACT_ACT_ENVIRONMENT: true,
})) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}

const store = createStore(() => ({ i18n: { locale: "en" } }));
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(async () => {
    await React.act(async () => root.unmount());
    host.remove();
});

afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("broken OPDS covers fall back after the authenticated retry and reset for a new cover", async () => {
    const url = "https://catalog.test/cover.jpg";
    const publication = {
        baseUrl: "https://catalog.test/feed",
        cover: { coverLinks: [{ url }], thumbnailLinks: [] },
    } as TPublication;
    await React.act(async () =>
        root.render(
            <Provider store={store}>
                <Cover publicationViewMaybeOpds={publication} imageAlt="Book cover" />
            </Provider>,
        ),
    );
    const image = host.querySelector("img");
    expect(image.getAttribute("src")).toBe(url);

    await React.act(async () => image.dispatchEvent(new dom.window.Event("error")));
    expect(image.getAttribute("src")).toBe(
        `${URL_PROTOCOL_OPDS_MEDIA}://${URL_HOST_COMMON}/${encodeURIComponent_RFC3986(Buffer.from(url).toString("base64"))}`,
    );

    await React.act(async () => image.dispatchEvent(new dom.window.Event("error")));
    expect(image.getAttribute("src")).toBe("assets/opds-cover-broken.png");
    expect(image.alt).toBe("Book cover");
    await React.act(async () => image.dispatchEvent(new dom.window.Event("error")));
    expect(image.getAttribute("src")).toBe("assets/opds-cover-broken.png");

    const nextUrl = "https://catalog.test/another-cover.jpg";
    await React.act(async () =>
        root.render(
            <Provider store={store}>
                <Cover
                    publicationViewMaybeOpds={{
                        ...publication,
                        cover: { coverLinks: [{ url: nextUrl }], thumbnailLinks: [] },
                    }}
                    imageAlt="Next book cover"
                />
            </Provider>,
        ),
    );
    expect(image.getAttribute("src")).toBe(nextUrl);
    await React.act(async () => image.dispatchEvent(new dom.window.Event("error")));
    expect(image.getAttribute("src")).toBe(
        `${URL_PROTOCOL_OPDS_MEDIA}://${URL_HOST_COMMON}/${encodeURIComponent_RFC3986(Buffer.from(nextUrl).toString("base64"))}`,
    );
});

test("local publication errors keep their existing retry behavior", async () => {
    const publication = { cover: { coverUrl: "data:image/png;base64,broken" } } as TPublication;
    await React.act(async () =>
        root.render(
            <Provider store={store}>
                <Cover publicationViewMaybeOpds={publication} imageAlt="Local book cover" />
            </Provider>,
        ),
    );
    const image = host.querySelector("img");
    await React.act(async () => image.dispatchEvent(new dom.window.Event("error")));
    const retryUrl = image.getAttribute("src");
    await React.act(async () => image.dispatchEvent(new dom.window.Event("error")));
    expect(image.getAttribute("src")).toBe(retryUrl);
});
