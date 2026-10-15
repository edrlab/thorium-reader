import * as React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { ApiResponse } from "readium-desktop/common/redux/states/api";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { apiActions, dialogActions } from "readium-desktop/common/redux/actions";

let mockResponse: ApiResponse<THttpGetBrowserResultView>;
const mockCancel = jest.fn();
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("readium-desktop/renderer/common/hooks/useApi", () => ({ useApi: () => [mockResponse, mockCancel] }));
jest.mock("readium-desktop/renderer/common/hooks/useTranslator", () => ({ useTranslator: () => [(key: string) => key] }));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
import { CancelHold } from "readium-desktop/renderer/library/components/dialog/publicationInfos/opdsControls/CancelHold";

let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();
const url = "https://example.org/holds/1";
const render = () => act(() => root.render(<CancelHold url={url} catalogUrl="https://example.org/catalog" />));
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
    mockCancel.mockClear();
    mockDispatch.mockClear();
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
test("disables cancellation while pending and replaces the displayed publication on success", () => {
    click();
    click();
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledWith(url, "DELETE");
    expect(host.querySelector("button").disabled).toBe(true);
    const publication = { documentTitle: "Updated publication", borrowLinks: [] } as IOpdsPublicationView;
    respond({ url, isSuccess: true, isFailure: false, data: { opds: { title: "", publications: [publication] } } });
    expect(mockDispatch).toHaveBeenCalledWith(dialogActions.updateRequest.build({ publication }));
});
test.each(["http", "api", "missing publication"])("retains the hold and allows retry after %s failure", (kind) => {
    click();
    respond({ url, isSuccess: kind !== "http", isFailure: kind === "http" }, kind === "api");
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]').textContent).toBe("opds.menu.cancelHoldError");
    expect(host.querySelector("button").disabled).toBe(false);
    click();
    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(host.querySelector('[role="alert"]')).toBeNull();
});


test("closes the hold dialog and refreshes the catalog after empty success", () => {
    click();
    respond({ url, isSuccess: true, isFailure: false, data: { emptyResponse: true } });
    expect(mockDispatch).toHaveBeenCalledWith(dialogActions.closeRequest.build());
    expect(mockDispatch).toHaveBeenCalledWith(apiActions.request.build(
        "browseOpdsApiResult", "httpbrowser", "browse", ["https://example.org/catalog"],
    ));
    expect(host.querySelector('[role="alert"]')).toBeNull();
});
test("retains the hold after an empty failed response", () => {
    click();
    respond({ url, isSuccess: false, isFailure: true, data: { emptyResponse: true } });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
});
