import * as React from "react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { Mock } from "jest-mock";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { BookshelfCarousel } from "readium-desktop/renderer/library/components/opds/BookshelfCarousel";
import { authActions } from "readium-desktop/common/redux/actions";
import { opdsHeaderLinkReducer } from "readium-desktop/renderer/library/redux/reducers/opds";

jest.mock("readium-desktop/renderer/library/apiAction", () => ({ apiAction: jest.fn() }));
jest.mock("readium-desktop/renderer/library/routing", () => ({ routes: {} }));
jest.mock("readium-desktop/common/services/translator", () => ({}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
jest.mock("readium-desktop/renderer/assets/styles/global.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("react-router-dom", () => ({ Link: ({ to, children }: any) => <a href={to}>{children}</a> }));
jest.mock("readium-desktop/renderer/common/components/Loader", () => () => <p>Loading</p>);
jest.mock("readium-desktop/renderer/library/components/utils/Slider", () => ({ content }: any) => <ul>{content}</ul>);
jest.mock("readium-desktop/renderer/library/components/publication/PublicationCard", () =>
    ({ publicationViewMaybeOpds }: any) => <li>{publicationViewMaybeOpds.documentTitle}</li>);

const request = apiAction as Mock<(...args: any[]) => Promise<any>>;
let dom: JSDOM;
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    (globalThis as any).window = dom.window;
    (globalThis as any).document = dom.window.document;
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    request.mockReset();
});

afterEach(async () => {
    await act(async () => root.unmount());
    dom.window.close();
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

async function render(catalogId = "catalog", url = "https://catalog.test/shelf") {
    await act(async () => root.render(<BookshelfCarousel catalogId={catalogId} url={url} />));
}

test("does not fetch or display a bookshelf for an unauthenticated catalog", async () => {
    request.mockResolvedValue([{ identifier: "catalog", authentified: false }]);
    await render();
    expect(request).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe("");
});

test("logout and authentication wipe remove the shelf link immediately", () => {
    const header = { bookshelf: "https://catalog.test/shelf", title: "Catalog" };
    expect(opdsHeaderLinkReducer(header, authActions.logout.build("https://catalog.test"))).toEqual({ title: "Catalog", bookshelf: undefined });
    expect(opdsHeaderLinkReducer(header, authActions.wipeData.build())).toEqual({ title: "Catalog", bookshelf: undefined });
});

test("shows a single publication and preserves a link to the full shelf", async () => {
    request.mockResolvedValueOnce([{ identifier: "catalog", authentified: true }])
        .mockResolvedValueOnce({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Borrowed book" }] } } });
    await render();
    expect(container.textContent).toContain("Borrowed book");
    expect(container.querySelector("a")?.getAttribute("href")).toContain("/opds/catalog/browse/3/");
    expect(request).toHaveBeenNthCalledWith(2, "httpbrowser/browse", "https://catalog.test/shelf");
});

test("ignores an old shelf response after switching catalogs", async () => {
    let finish: (value: any) => void;
    request.mockResolvedValueOnce([{ identifier: "catalog", authentified: true }])
        .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
        .mockResolvedValueOnce([{ identifier: "other", authentified: false }]);
    await render();
    await render("other", "https://other.test/shelf");
    await act(async () => finish({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Old user's book" }] } } }));
    expect(container.textContent).toBe("");
});

test("retries a failed request and displays an empty shelf", async () => {
    request.mockResolvedValueOnce([{ identifier: "catalog", authentified: true }])
        .mockResolvedValueOnce({ isSuccess: false })
        .mockResolvedValueOnce([{ identifier: "catalog", authentified: true }])
        .mockResolvedValueOnce({ isSuccess: true, data: { opds: { publications: [] } } });
    await render();
    expect(container.textContent).toContain("opds.network.error");
    await act(async () => container.querySelector("button")?.click());
    expect(container.textContent).toContain("opds.empty");
    expect(container.textContent).not.toContain("opds.network.error");
});
