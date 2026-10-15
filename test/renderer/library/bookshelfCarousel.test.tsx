import * as React from "react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { Mock } from "jest-mock";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { BookshelfCarousel } from "readium-desktop/renderer/library/components/opds/BookshelfCarousel";
import { PublicationGroup } from "readium-desktop/renderer/library/components/opds/PublicationGroup";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { IOpdsGroupView } from "readium-desktop/common/views/opds";
import { authActions, customizationActions, opdsActions } from "readium-desktop/common/redux/actions";
import { opdsHeaderLinkReducer } from "readium-desktop/renderer/library/redux/reducers/opds";

jest.mock("readium-desktop/renderer/library/apiAction", () => ({ apiAction: jest.fn() }));
jest.mock("readium-desktop/renderer/library/routing", () => ({ routes: {} }));
jest.mock("readium-desktop/common/services/translator", () => ({}));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
jest.mock("readium-desktop/renderer/assets/styles/global.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/bookshelf.scss", () => ({
    bookshelf_content: "bookshelf_content", bookshelf_status: "bookshelf_status",
}));
jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("readium-desktop/renderer/common/redux/middleware/actionSubscriber", () => ({
    subscribeToAction: (id: string, callback: (action: any) => void) => {
        actionSubscribers.set(id, callback);
        return () => actionSubscribers.delete(id);
    },
}));
jest.mock("react-router-dom", () => ({ Link: ({ to, children }: any) => <a href={to}>{children}</a> }));
jest.mock("readium-desktop/renderer/library/components/opds/Entry", () => ({ entry, level }: any) =>
    <a href={buildOpdsBrowserRoute("catalog", entry.title, entry.url, level)}>{entry.title}</a>);
jest.mock("readium-desktop/renderer/library/components/opds/EntryList", () => ({ entries }: any) =>
    <nav>{entries.map((entry: any) => <a key={entry.url} href={entry.url}>{entry.title}</a>)}</nav>);
jest.mock("readium-desktop/renderer/common/components/Loader", () => () => <p>Loading</p>);
jest.mock("readium-desktop/renderer/library/components/utils/Slider", () => ({ content, resetSliderPosition }: any) =>
    <ul data-reset-position={resetSliderPosition}>{content}</ul>);
jest.mock("readium-desktop/renderer/library/components/publication/PublicationCard", () =>
    ({ publicationViewMaybeOpds }: any) => <li>{publicationViewMaybeOpds.documentTitle}</li>);

const request = apiAction as Mock<(...args: any[]) => Promise<any>>;
const mockDispatch = jest.fn();
const actionSubscribers = new Map<string, (action: any) => void>();
const unauthenticatedFeed = {
    identifier: "catalog", url: "https://catalog.test", authentified: false,
    authenticationUrl: "https://catalog.test/auth",
};
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
    mockDispatch.mockReset();
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

test("keeps the shelf visible and opens authentication without fetching publications when signed out", async () => {
    request.mockResolvedValue([unauthenticatedFeed]);
    await render();
    expect(request).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".bookshelf_content")).not.toBeNull();
    expect(container.querySelector(".bookshelf_status button")?.textContent).toBe("catalog.login");
    await act(async () => container.querySelector<HTMLButtonElement>("button")?.click());
    expect(mockDispatch).toHaveBeenCalledWith(customizationActions.triggerOpdsAuth.build(
        unauthenticatedFeed.url, unauthenticatedFeed.authenticationUrl,
    ));
});

test("logout and authentication wipe preserve the shelf link", () => {
    const header = { bookshelf: "https://catalog.test/shelf", title: "Catalog" };
    expect(opdsHeaderLinkReducer(header, authActions.logout.build("https://catalog.test"))).toEqual(header);
    expect(opdsHeaderLinkReducer(header, authActions.wipeData.build())).toEqual(header);
});

test("keeps an empty shelf without a sign-in button when authentication is unavailable", async () => {
    request.mockResolvedValue([{ identifier: "catalog", authentified: false }]);
    await render();
    expect(container.querySelector(".bookshelf_content")).not.toBeNull();
    expect(container.textContent).toContain("opds.empty");
    expect(container.querySelector("button")).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
});

test("reserves the same content container while checking authentication and loading publications", async () => {
    let finishFeeds: (value: any) => void;
    let finishBooks: (value: any) => void;
    request.mockImplementationOnce(() => new Promise((resolve) => { finishFeeds = resolve; }))
        .mockImplementationOnce(() => new Promise((resolve) => { finishBooks = resolve; }));
    await render();
    const content = container.querySelector(".bookshelf_content");
    expect(content).not.toBeNull();
    expect(container.querySelector("section")?.getAttribute("aria-busy")).toBe("true");
    await act(async () => finishFeeds([{ identifier: "catalog", authentified: true }]));
    expect(container.querySelector(".bookshelf_content")).toBe(content);
    expect(container.textContent).toContain("Loading");
    await act(async () => finishBooks({ isSuccess: true, data: { opds: { publications: [] } } }));
    expect(container.querySelector(".bookshelf_content")).toBe(content);
    expect(container.querySelector("section")?.getAttribute("aria-busy")).toBe("false");
});

test("shows a single publication and preserves a link to the full shelf", async () => {
    request.mockResolvedValueOnce([{ identifier: "catalog", authentified: true }])
        .mockResolvedValueOnce({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Borrowed book" }] } } });
    await render();
    expect(container.textContent).toContain("Borrowed book");
    expect(container.querySelectorAll("a")).toHaveLength(1);
    expect(container.querySelector("a")?.textContent).toBe("opds.bookshelfTitle");
    expect(container.querySelector("h3")).toBeNull();
    expect(container.querySelector("ul")?.getAttribute("data-reset-position")).toBe("false");
    expect(container.querySelector("a")?.getAttribute("href")).toContain("/opds/catalog/browse/3/");
    expect(request).toHaveBeenNthCalledWith(2, "httpbrowser/browse", "https://catalog.test/shelf");
});

test("uses the same group renderer for catalog publications and keeps navigation entries", async () => {
    const group = {
        selfLink: { title: "Catalog group", url: "https://catalog.test/group" },
        navigation: [{ title: "More books", url: "https://catalog.test/more" }],
        publications: [{ documentTitle: "First book" }, { documentTitle: "Second book" }],
    } as IOpdsGroupView;
    await act(async () => root.render(<PublicationGroup group={group} level={2} />));
    expect(container.querySelector("section")?.getAttribute("aria-label")).toBe("Catalog group");
    expect(container.querySelector("a")?.getAttribute("href")).toContain("/browse/2/");
    expect(container.querySelector("nav")?.textContent).toBe("More books");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("ul")?.getAttribute("data-reset-position")).toBe("false");
});

test("ignores an old shelf response after switching catalogs", async () => {
    let finish: (value: any) => void;
    request.mockResolvedValueOnce([{ identifier: "catalog", authentified: true }])
        .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
        .mockResolvedValueOnce([{ identifier: "other", authentified: false }]);
    await render();
    await render("other", "https://other.test/shelf");
    await act(async () => finish({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Old user's book" }] } } }));
    expect(container.textContent).toContain("opds.empty");
    expect(container.textContent).not.toContain("Old user's book");
});

test.each([authActions.logout.build("https://catalog.test"), authActions.wipeData.build()])(
    "clears private publications and ignores pending requests on $type", async (action) => {
        let finish: (value: any) => void;
        request.mockResolvedValueOnce([{ ...unauthenticatedFeed, authentified: true }])
            .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
        await render();
        await act(async () => actionSubscribers.get(action.type)?.(action));
        expect(container.querySelector("button")?.textContent).toBe("catalog.login");
        await act(async () => finish({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Private book" }] } } }));
        expect(container.textContent).not.toContain("Private book");
        expect(container.querySelector("button")?.textContent).toBe("catalog.login");
    },
);

test("clears already displayed publications immediately on logout", async () => {
    request.mockResolvedValueOnce([{ ...unauthenticatedFeed, authentified: true }])
        .mockResolvedValueOnce({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Private book" }] } } });
    await render();
    expect(container.textContent).toContain("Private book");
    await act(async () => actionSubscribers.get(authActions.logout.ID)?.(authActions.logout.build(unauthenticatedFeed.url)));
    expect(container.textContent).not.toContain("Private book");
    expect(container.querySelector("button")?.textContent).toBe("catalog.login");
});

test.each([authActions.done.build(), opdsActions.refresh.build()])(
    "reloads the shelf after $type", async (action) => {
        request.mockResolvedValueOnce([unauthenticatedFeed])
            .mockResolvedValueOnce([{ ...unauthenticatedFeed, authentified: true }])
            .mockResolvedValueOnce({ isSuccess: true, data: { opds: { publications: [{ documentTitle: "Borrowed book" }] } } });
        await render();
        await act(async () => actionSubscribers.get(action.type)?.(action));
        expect(container.textContent).toContain("Borrowed book");
        expect(container.querySelector("button")).toBeNull();
    },
);

test("shows a retry if checking authentication fails", async () => {
    request.mockRejectedValueOnce(new Error("offline"));
    await render();
    expect(container.textContent).toContain("opds.network.error");
    expect(container.querySelector("button")?.textContent).toBe("catalog.opds.auth.retry");
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
