import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { session } from "electron";
import { runSaga, END } from "redux-saga";
import type { EventChannel } from "redux-saga";
import { authActions, historyActions } from "readium-desktop/common/redux/actions";
import { forwardOpdsAuthenticationRedirect } from "readium-desktop/main/opdsAuthenticationRedirect";
import { getOpdsRequestCustomProtocolEventChannel, TregisterHttpProtocolHandler } from "readium-desktop/main/redux/sagas/getEventChannel";
import { runExternalAuthentication, IExternalAuthenticationSession } from "readium-desktop/main/redux/sagas/externalAuthentication";

jest.mock("electron", () => ({ app: { listeners: () => [], on: jest.fn() }, session: { fromPartition: jest.fn() } }));
jest.mock("readium-desktop/main/customization/watcher", () => ({ customizationStartFileWatcherFromWellKnownFolder: jest.fn() }));

const register = jest.fn<(scheme: string, handler: (request: Electron.ProtocolRequest, callback: TregisterHttpProtocolHandler["callback"]) => void) => void>();
const unregister = jest.fn();
let requests: EventChannel<TregisterHttpProtocolHandler> | undefined;
const open = () => (requests = getOpdsRequestCustomProtocolEventChannel());
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(session.fromPartition).mockReturnValue({ protocol: {
        registerHttpProtocol: register, unregisterProtocol: unregister,
    } } as unknown as Electron.Session);
});
afterEach(() => { requests?.close(); requests = undefined; });

describe("OS authentication deep-link bridge", () => {
    it.each([
        "opds://authorize/#access_token=implicit-token&state=current&token_type=Bearer",
        "opds://authorize/?code=pkce-code&state=current",
    ])("completes an inline authentication without a modal for %s", async url => {
        const callbacks = open();
        const complete = jest.fn<IExternalAuthenticationSession["complete"]>().mockResolvedValue(true);
        const dispose = jest.fn();
        const openFallback = jest.fn<IExternalAuthenticationSession["openFallback"]>();
        const dependencies = {
            callbacks,
            prepare: async () => ({ authorizationUrl: "https://example.org/authorize?state=current", complete, dispose, openFallback }),
            openExternal: jest.fn<(url: string) => Promise<void>>().mockResolvedValue(undefined),
        };
        const dispatch = jest.fn();
        const task = runSaga({ dispatch }, runExternalAuthentication, dependencies,
            authActions.externalRequest.build("https://example.org/auth", "view", "start"));
        try {
            await flush();
            expect(forwardOpdsAuthenticationRedirect(url)).toBe(true);
            await task.toPromise();
            expect(complete).toHaveBeenCalledWith(expect.objectContaining({ url, method: "GET" }));
            expect(openFallback).not.toHaveBeenCalled();
            expect(dispatch).toHaveBeenCalledWith(authActions.externalStatus.build("view", "complete"));
            expect(dispatch).toHaveBeenCalledWith(historyActions.refresh.build());
        } finally {
            task.cancel(); await task.toPromise();
        }
    });

    it("buffers a redirect until the authentication listener is ready, preserving its fragment", () => {
        const callbacks = open();
        const url = "opds://authorize/#access_token=a%2Bb%26c&state=current";
        expect(forwardOpdsAuthenticationRedirect(url)).toBe(true);
        const received = jest.fn<(event: TregisterHttpProtocolHandler | typeof END) => void>();
        callbacks.take(received);
        expect(received).toHaveBeenCalledWith(expect.objectContaining({ request: expect.objectContaining({ url }) }));
        const event = received.mock.calls[0][0];
        if (!("request" in event)) throw new Error("Expected an authentication event");
        expect(() => event.callback({ url: undefined })).not.toThrow();
    });

    it("retains native protocol handling for the in-app authentication browser", () => {
        const callbacks = open();
        const received = jest.fn<(event: TregisterHttpProtocolHandler | typeof END) => void>();
        callbacks.take(received);
        const request = { method: "GET", url: "opds://authorize/?state=current&code=code", referrer: "", headers: {} };
        const acknowledge = jest.fn<TregisterHttpProtocolHandler["callback"]>();
        expect(register).toHaveBeenCalledWith("opds", expect.any(Function));
        register.mock.calls[0][1](request, acknowledge);
        expect(received).toHaveBeenCalledWith({ request, callback: acknowledge });
    });

    it.each(["https://authorize/?code=a", "opds://catalog/", "opds://authorize.other/?code=a", "invalid"])(
        "ignores non-authentication links: %s", url => {
            const callbacks = open();
            const received = jest.fn<(event: TregisterHttpProtocolHandler | typeof END) => void>();
            callbacks.take(received);
            expect(forwardOpdsAuthenticationRedirect(url)).toBe(false);
            expect(received).not.toHaveBeenCalled();
        },
    );

    it("unsubscribes and unregisters the native handler when the channel closes", () => {
        const callbacks = open(); callbacks.close();
        expect(unregister).toHaveBeenCalledWith("opds");
        expect(forwardOpdsAuthenticationRedirect("opds://authorize/?state=current&code=a")).toBe(false);
    });
});
