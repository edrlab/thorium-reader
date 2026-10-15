import * as React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { ApiResponse } from "readium-desktop/common/redux/states/api";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { dialogActions } from "readium-desktop/common/redux/actions";

let mockResponse: ApiResponse<THttpGetBrowserResultView>;
const mockBrowse = jest.fn();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const link = { url: "https://example.org/holds/1", type: "application/opds-publication+json" };
jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({ useApi: () => [mockResponse, mockBrowse] }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
import { BorrowButton } from "readium-desktop/renderer/library/components/dialog/publicationInfos/opdsControls/BorrowButton";

let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();
const url = "https://example.org/holds/1";
const render = () => act(() => root.render(<BorrowButton link={link} navigate={() => mockNavigate()}>Borrow</BorrowButton>));
const click = () => act(() => host.querySelector("button").click());
const respond = (result: THttpGetBrowserResultView, error = false) => {
    mockResponse = { data: { time: 1, error, result }, lastSuccess: undefined, lastTime: 1 };
    render();
};
beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
        navigator: dom.window.navigator, IS_REACT_ACT_ENVIRONMENT: true })) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
});
beforeEach(() => {
    mockResponse = undefined;
    mockBrowse.mockClear();
    mockDispatch.mockClear();
    mockNavigate.mockClear();
    link.type = "application/opds-publication+json";
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    render();
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("refreshes the open dialog with the reserved publication without navigating", () => {
    click();
    click();
    expect(mockBrowse).toHaveBeenCalledTimes(1);
    expect(mockBrowse).toHaveBeenCalledWith(url);
    expect(host.querySelector("button").disabled).toBe(true);
    const publication = { documentTitle: "Held book", borrowLinks: [
        { url, properties: { availabilityState: "reserved" } },
    ] } as IOpdsPublicationView;
    respond({ url, contentType: link.type + "; charset=utf-8", isSuccess: true, isFailure: false,
        data: { opds: { title: "", publications: [publication] } } });
    expect(mockDispatch.mock.calls).toEqual([[dialogActions.updateRequest.build({ publication })]]);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')).toBeNull();
});

test.each(["http", "api", "missing publication"])("retains publication and allows retry after %s failure", (kind) => {
    click();
    respond({ url, contentType: link.type, isSuccess: kind !== "http", isFailure: kind === "http" }, kind === "api");
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    click();
    render();
    expect(mockBrowse).toHaveBeenCalledTimes(2);
    expect(host.querySelector("button").disabled).toBe(true);
    expect(host.querySelector('[role="alert"]')).toBeNull();
});

test("passes authentication challenges to existing navigation even on HTTP failure", () => {
    click();
    respond({ url, isSuccess: false, isFailure: true,
        data: { opds: { title: "Authenticate", auth: {} as never } } });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
});

test.each(["application/opds+json", "text/html"])("preserves navigation for a %s response", (contentType) => {
    click();
    respond({ url, contentType, isSuccess: true, isFailure: false,
        data: { opds: { title: "Feed", publications: [{ documentTitle: "Feed entry" } as IOpdsPublicationView] } } });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
});

test.each(["application/opds+json", "application/atom+xml", "text/html", "application/xhtml+xml"])(
    "leaves existing %s links to the navigation handler", (type) => {
        link.type = type;
        render();
        click();
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockBrowse).not.toHaveBeenCalled();
    },
);
