import * as React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { IOpdsAuthView } from "readium-desktop/common/views/opds";
import { authActions } from "readium-desktop/common/redux/actions";

const mockDispatch = jest.fn();
jest.mock("electron", () => ({ shell: { openExternal: jest.fn() } }));
jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("readium-desktop/renderer/assets/styles/components/buttons.scss", () => ({}));
import { AuthenticationForm } from "readium-desktop/renderer/library/components/opds/AuthenticationForm";

const translate = ((key: string) => key) as I18nFunction;
const auth = { credentialsUrl: "https://example.org/catalog" } as IOpdsAuthView;
let root: Root;
let host: HTMLDivElement;
let dom: JSDOM;
const globals = new Map<string, PropertyDescriptor | undefined>();

beforeAll(() => {
    dom = new JSDOM("<!doctype html><html><body></body></html>");
    for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document,
        navigator: dom.window.navigator, FormData: dom.window.FormData, IS_REACT_ACT_ENVIRONMENT: true })) {
        globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    }
});
beforeEach(() => {
    mockDispatch.mockClear();
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => root.render(<AuthenticationForm auth={auth} __={translate} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
afterAll(() => {
    dom.window.close();
    for (const [key, descriptor] of globals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("submits credentials to the catalog, clears the fields, and permits a fresh challenge", () => {
    const login = host.querySelector<HTMLInputElement>("[name=login]");
    const password = host.querySelector<HTMLInputElement>("[name=password]");
    login.value = "reader";
    password.value = "secret";
    act(() => host.querySelector("button").click());
    expect(mockDispatch).toHaveBeenCalledWith(authActions.submit.build(auth.credentialsUrl, "reader", "secret"));
    expect(login.value).toBe("");
    expect(password.value).toBe("");
    expect(host.querySelector("button").disabled).toBe(true);
    act(() => root.render(<AuthenticationForm auth={{ ...auth }} __={translate} />));
    expect(host.querySelector("button").disabled).toBe(false);
});

test("uses meaningful fallback labels for missing and empty translations from the server", () => {
    act(() => root.render(<AuthenticationForm auth={{ ...auth, labelLogin: "", labelPassword: "" }} __={translate} />));
    expect(host.textContent).toContain("catalog.opds.auth.login");
    expect(host.textContent).toContain("catalog.opds.auth.password");
    expect(host.querySelector<HTMLInputElement>("[name=password]").type).toBe("password");
});

test("redacts credentials before sending actions to developer tools", () => {
    expect(authActions.submit.sanitize(authActions.submit.build(auth.credentialsUrl, "reader", "secret")))
        .toEqual({ type: authActions.submit.ID });
});
