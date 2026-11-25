/* eslint-disable @typescript-eslint/no-require-imports -- Load DOM-dependent modules after JSDOM. */
import * as React from "react";
import { JSDOM } from "jsdom";
import type { Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { authActions } from "readium-desktop/common/redux/actions";
import { authenticationReducer } from "readium-desktop/renderer/library/redux/reducers/authentication";
import { actionSubscriberMiddleware } from "readium-desktop/renderer/common/redux/middleware/actionSubscriber";
import type { IOpdsResultView } from "readium-desktop/common/views/opds";
import type { I18nFunction } from "readium-desktop/common/services/translator";

const dispatch = jest.fn();
let locationKey = "original";
jest.mock("react-redux", () => ({ useDispatch: () => dispatch }));
jest.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: "/catalog", key: locationKey }) }));
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("readium-desktop/renderer/assets/styles/components/opdsAuthentication.scss", () => ({}));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));

let AuthenticationRequest: typeof import("readium-desktop/renderer/library/components/opds/AuthenticationRequest").AuthenticationRequest;
let AuthenticationForm: typeof import("readium-desktop/renderer/library/components/opds/AuthenticationForm").AuthenticationForm;
let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();
const translate = ((key: string) => key) as I18nFunction;
const view = { title: "Download login", auth: { credentialsUrl: "https://example.org/download" } } as IOpdsResultView;
const prompt = (id: string) => authActions.prompt.build(id, view).payload;
let mounts = 0;
const OriginalContent = () => {
    React.useEffect(() => { mounts++; }, []);
    return <button id="original">Download book</button>;
};
const render = async (request?: ReturnType<typeof prompt>, original?: React.ReactNode) => {
    await React.act(async () => root.render(<AuthenticationRequest request={request} __={translate}>
        {original || <OriginalContent />}
    </AuthenticationRequest>));
};

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.org" });
    for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
        navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, FormData: dom.window.FormData,
        IS_REACT_ACT_ENVIRONMENT: true })) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
    ({ AuthenticationRequest } = require("readium-desktop/renderer/library/components/opds/AuthenticationRequest"));
    ({ AuthenticationForm } = require("readium-desktop/renderer/library/components/opds/AuthenticationForm"));
});
beforeEach(() => {
    dispatch.mockClear(); mounts = 0; locationKey = "original";
    host = document.createElement("div"); document.body.append(host);
    root = (require("react-dom/client") as typeof import("react-dom/client")).createRoot(host);
});
afterEach(async () => { await React.act(async () => root.unmount()); host.remove(); });
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("keeps the original page mounted and restores focus after inline download login", async () => {
    await render();
    const button = host.querySelector<HTMLButtonElement>("#original")!; button.focus();
    await render(prompt("download"));
    expect(button.closest("[hidden]")).not.toBeNull();
    expect(document.activeElement?.tagName).toBe("H1");
    await render();
    expect(host.querySelector("#original")).toBe(button);
    expect(button.closest("[hidden]")).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(mounts).toBe(1);
});

test("dismisses only the previous request on navigation or replacement", async () => {
    await render(prompt("first"));
    await render(prompt("second"));
    expect(dispatch).toHaveBeenCalledWith(authActions.promptResult.build("first", false));
    expect(dispatch).not.toHaveBeenCalledWith(authActions.promptResult.build("second", false));
    const state = authenticationReducer(undefined, authActions.prompt.build("second", view));
    expect(authenticationReducer(state, authActions.prompt.build("first"))).toBe(state);
    locationKey = "next-page";
    await render(prompt("second"));
    expect(dispatch).toHaveBeenCalledWith(authActions.promptResult.build("second", false));
    expect(dispatch).not.toHaveBeenCalledWith(authActions.cancel.build());
});

test("scopes submission errors to the download form while a catalog form remains mounted", async () => {
    const original = <AuthenticationForm auth={view.auth} __={translate} />;
    await render(undefined, original);
    await render(prompt("download"), original);
    const deliver = actionSubscriberMiddleware(undefined)(action => action);
    await React.act(async () => { deliver(authActions.submitted.build(view.auth.credentialsUrl, true, undefined, "download")); });
    expect(host.querySelectorAll("[role=alert]")).toHaveLength(1);
    expect(host.querySelector("section [role=alert]")).not.toBeNull();
    await render(undefined, original);
    await React.act(async () => { deliver(authActions.submitted.build(view.auth.credentialsUrl, true)); });
    expect(host.querySelectorAll("[role=alert]")).toHaveLength(1);
});

test("uses the inline cancel action for the requesting download", async () => {
    await render(prompt("download"));
    const cancel = Array.from(host.querySelectorAll("button")).find(button => button.textContent === "catalog.opds.auth.cancel")!;
    await React.act(async () => cancel.click());
    expect(dispatch).toHaveBeenCalledWith(authActions.promptResult.build("download", false));
    expect(dispatch).not.toHaveBeenCalledWith(authActions.cancel.build());
});
