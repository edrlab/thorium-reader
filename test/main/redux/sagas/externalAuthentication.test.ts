import { all, put } from "redux-saga/effects";
import type { TOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { channel, runSaga, stdChannel } from "redux-saga";
import type { BrowserWindow } from "electron";
import { authActions, historyActions } from "readium-desktop/common/redux/actions";
import { startExternalAuthentication, runExternalAuthentication, watchExternalAuthentication, matchesExternalAuthenticationCallback,
    IExternalAuthenticationSession } from "readium-desktop/main/redux/sagas/externalAuthentication";
import type { TregisterHttpProtocolHandler } from "readium-desktop/main/redux/sagas/getEventChannel";

const url = "https://example.org/auth";
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const fixture = () => {
    const callbacks = channel<TregisterHttpProtocolHandler>();
    const session: IExternalAuthenticationSession = {
        authorizationUrl: "https://example.org/authorize?state=fresh",
        complete: jest.fn< IExternalAuthenticationSession["complete"]>().mockResolvedValue(true),
        openFallback: jest.fn<IExternalAuthenticationSession["openFallback"]>(),
        dispose: jest.fn(),
    };
    const dependencies = { callbacks,
        prepare: jest.fn<() => Promise<IExternalAuthenticationSession>>().mockResolvedValue(session),
        openExternal: jest.fn<(url: string) => Promise<void>>().mockResolvedValue(undefined),
    };
    const dispatch = jest.fn();
    const event = () => ({ request: { method: "GET", url: "opds://authorize/?state=fresh&code=code" } as Electron.ProtocolRequest,
        callback: jest.fn<(response: Electron.ProtocolResponse) => void>() });
    return { session, dependencies, callbacks, dispatch, event };
};

afterEach(() => jest.useRealTimers());

describe("inline external authentication lifecycle", () => {
    it("listens before external launch and completes an immediate callback without a message modal", async () => {
        const f = fixture(); const event = f.event();
        f.dependencies.openExternal.mockImplementation(async () => { f.callbacks.put(event); });
        await runSaga({ dispatch: f.dispatch }, runExternalAuthentication, f.dependencies,
            authActions.externalRequest.build(url, "view", "start")).toPromise();
        expect(f.session.openFallback).not.toHaveBeenCalled();
        expect(event.callback).toHaveBeenCalledTimes(1);
        expect(f.dispatch).toHaveBeenCalledWith(authActions.externalStatus.build("view", "complete"));
        expect(f.dispatch).toHaveBeenCalledWith(historyActions.refresh.build());
        expect(f.session.dispose).toHaveBeenCalledTimes(1);
    });

    it("acknowledges stale callbacks and keeps waiting for the current transaction", async () => {
        const f = fixture(); jest.mocked(f.session.complete).mockResolvedValueOnce(false);
        const task = runSaga({ dispatch: f.dispatch }, runExternalAuthentication, f.dependencies,
            authActions.externalRequest.build(url, "view", "start"));
        await flush(); const stale = f.event(); f.callbacks.put(stale); await flush();
        expect(stale.callback).toHaveBeenCalled(); expect(task.isRunning()).toBe(true);
        f.callbacks.put(f.event()); await task.toPromise();
        expect(f.dispatch).toHaveBeenCalledWith(historyActions.refresh.build());
    });

    it("opens the internal provider browser on Try again and cleans it up on navigation", async () => {
        const f = fixture(); const close = jest.fn();
        jest.mocked(f.session.openFallback).mockResolvedValue({ close, isDestroyed: () => false, once: jest.fn() } as unknown as BrowserWindow);
        const task = runSaga({ dispatch: f.dispatch }, runExternalAuthentication, f.dependencies,
            authActions.externalRequest.build(url, "view", "retry"));
        await flush(); expect(f.session.openFallback).toHaveBeenCalledTimes(1);
        expect(f.dependencies.openExternal).not.toHaveBeenCalled(); task.cancel(); await task.toPromise();
        expect(close).toHaveBeenCalledTimes(1); expect(f.session.dispose).toHaveBeenCalled();
        expect(f.dispatch).not.toHaveBeenCalledWith(historyActions.refresh.build());
    });

    it("keeps manual browser login available after a browser launch failure", async () => {
        const f = fixture(); f.dependencies.openExternal.mockRejectedValue(new Error("No browser"));
        const task = runSaga({ dispatch: f.dispatch }, runExternalAuthentication, f.dependencies,
            authActions.externalRequest.build(url, "view", "start"));
        await flush();
        expect(f.dispatch).toHaveBeenCalledWith(authActions.externalStatus.build("view", "failed", f.session.authorizationUrl));
        expect(task.isRunning()).toBe(true);
        f.callbacks.put(f.event());
        await task.toPromise();
        expect(f.dispatch).toHaveBeenCalledWith(authActions.externalStatus.build("view", "complete"));
        expect(f.session.dispose).toHaveBeenCalled();
    });

    it("reports callback/token exchange failures inline", async () => {
        const f = fixture(); jest.mocked(f.session.complete).mockRejectedValue(new Error("Rejected"));
        const task = runSaga({ dispatch: f.dispatch }, runExternalAuthentication, f.dependencies,
            authActions.externalRequest.build(url, "view", "start"));
        await flush(); f.callbacks.put(f.event()); await task.toPromise();
        expect(f.dispatch).toHaveBeenCalledWith(authActions.externalStatus.build("view", "failed"));
        expect(f.dispatch).not.toHaveBeenCalledWith(historyActions.refresh.build());
    });

    it("expires the waiting session after four minutes", async () => {
        jest.useFakeTimers({ doNotFake: ["setImmediate"] }); const f = fixture();
        const task = runSaga({ dispatch: f.dispatch }, runExternalAuthentication, f.dependencies,
            authActions.externalRequest.build(url, "view", "start"));
        await flush(); await jest.advanceTimersByTimeAsync(240000); await task.toPromise();
        expect(f.dispatch).toHaveBeenCalledWith(authActions.externalStatus.build("view", "expired"));
        expect(f.session.dispose).toHaveBeenCalled();
    });

    it("ignores cleanup actions from a previous view", async () => {
        const f = fixture(); const input = stdChannel();
        const task = runSaga({ dispatch: f.dispatch, channel: input }, watchExternalAuthentication, f.dependencies);
        input.put(authActions.externalRequest.build(url, "new", "start")); await flush();
        input.put(authActions.externalRequest.build(url, "old", "cancel")); await flush();
        expect(f.session.dispose).not.toHaveBeenCalled();
        input.put(authActions.externalRequest.build(url, "new", "cancel")); await flush();
        expect(f.session.dispose).toHaveBeenCalledTimes(1); task.cancel(); await task.toPromise();
    });
});

describe("external callback correlation", () => {
    it.each(["opds://authorize/?state=fresh&code=a", "opds://authorize/#state=fresh&access_token=a"])(
        "accepts the matching callback %s", callback => expect(matchesExternalAuthenticationCallback(callback, "fresh", true)).toBe(true));
    it.each(["opds://authorize/?state=stale&code=a", "opds://authorize/?code=a", "opds://other/?state=fresh", "https://authorize/?state=fresh", "invalid"])(
        "ignores invalid or stale PKCE callbacks %s", callback => expect(matchesExternalAuthenticationCallback(callback, "fresh", true)).toBe(false));
    it("preserves implicit providers without state while rejecting a provided mismatched state", () => {
        expect(matchesExternalAuthenticationCallback("opds://authorize/#access_token=a", "fresh", false)).toBe(true);
        expect(matchesExternalAuthenticationCallback("opds://authorize/#state=old&access_token=a", "fresh", false)).toBe(false);
    });
});


it("returns to the catalog after a standalone auth document instead of reopening the login", async () => {
    const f = fixture();
    const feed = { identifier: "catalog", title: "Catalog", url: "https://example.org/catalog", authentified: true, color: "gray" as const };
    const getCatalog = jest.fn(function* (_identifier: string) { return feed; });
    const task = runSaga({ dispatch: f.dispatch }, runExternalAuthentication, { ...f.dependencies, getCatalog },
        authActions.externalRequest.build(url, "view", "start", "catalog"));
    await flush(); f.callbacks.put(f.event()); await task.toPromise();
    expect(getCatalog).toHaveBeenCalledWith("catalog");
    expect(f.dispatch).toHaveBeenCalledWith(historyActions.pushFeed.build(feed));
    expect(f.dispatch).not.toHaveBeenCalledWith(historyActions.refresh.build());
});


it("gives legacy authentication sole callback-channel ownership when it replaces an inline session", async () => {
    const f = fixture(); const input = stdChannel(); const legacyRequests = channel<TOpdsAuthenticationChannel>();
    const run = jest.fn(function* (_request: TOpdsAuthenticationChannel) { return; });
    const task = runSaga({ dispatch: f.dispatch, channel: input }, watchExternalAuthentication,
        { ...f.dependencies, legacy: { requests: legacyRequests, run, onError: jest.fn() } });
    input.put(authActions.externalRequest.build(url, "view", "start")); await flush();
    legacyRequests.put([{} as TOpdsAuthenticationChannel[0], url, false]); await flush();
    expect(f.session.dispose).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    input.put(authActions.externalRequest.build(url, "view", "cancel")); await flush();
    task.cancel(); await task.toPromise();
});


it("allows initialization to finish while the authentication watcher waits for requests", async () => {
    const f = fixture(); const input = stdChannel();
    let watcher: ReturnType<typeof runSaga> | undefined;
    const startup = runSaga({ dispatch: f.dispatch, channel: input }, function* () {
        const tasks: ReturnType<typeof runSaga>[] = yield all([startExternalAuthentication(f.dependencies)]);
        [watcher] = tasks;
        yield put({ type: "LIBRARY_STARTUP_READY" });
    });
    try {
        expect(startup.isRunning()).toBe(false);
        expect(watcher?.isRunning()).toBe(true);
        expect(f.dispatch).toHaveBeenCalledWith({ type: "LIBRARY_STARTUP_READY" });
        input.put(authActions.externalRequest.build(url, "view", "start"));
        await flush();
        expect(f.dependencies.openExternal).toHaveBeenCalledWith(f.session.authorizationUrl);
        input.put(authActions.externalRequest.build(url, "view", "cancel"));
        await flush();
        expect(f.session.dispose).toHaveBeenCalled();
    } finally {
        watcher?.cancel();
        await watcher?.toPromise();
    }
});
