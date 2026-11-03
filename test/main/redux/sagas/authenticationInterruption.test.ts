import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { runSaga, stdChannel } from "redux-saga";
import { put, take } from "redux-saga/effects";
import { authActions } from "readium-desktop/common/redux/actions";
import { getOpdsAuthenticationChannel, TOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { requestOpdsAuthentication } from "readium-desktop/main/redux/sagas/requestOpdsAuthentication";
import { watchExternalAuthentication } from "readium-desktop/main/redux/sagas/externalAuthentication";
import { channel } from "redux-saga";
import type { TregisterHttpProtocolHandler } from "readium-desktop/main/redux/sagas/getEventChannel";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const url = "https://example.org/download";
const doc = {} as TOpdsAuthenticationChannel[0];
let stop: (() => Promise<void>) | undefined;

const fixture = () => {
    const input = stdChannel();
    const actions = jest.fn();
    const dispatch = (action: { type: string }) => { actions(action); input.put(action); };
    const requests: ReturnType<typeof runSaga>[] = [];
    const closed = jest.fn();
    const dispose = jest.fn();
    const run = jest.fn(function* (_request: TOpdsAuthenticationChannel) {
        try {
            yield take("LEGACY_LOGIN_COMPLETE");
            yield put(authActions.done.build());
        } finally { closed(); }
    });
    const callbacks = channel<TregisterHttpProtocolHandler>();
    const watcher = runSaga({ dispatch, channel: input }, watchExternalAuthentication, {
        callbacks,
        prepare: async () => ({ authorizationUrl: "https://example.org/authorize", complete: async () => true,
            openFallback: async () => undefined, dispose }),
        openExternal: async () => undefined,
        legacy: { requests: getOpdsAuthenticationChannel(), run, onError: jest.fn() },
    });
    stop = async () => {
        watcher.cancel();
        for (const request of requests) request.cancel();
        await Promise.all([watcher.toPromise(), ...requests.map(request => request.toPromise())]);
        callbacks.close();
    };
    const request = () => {
        const task = runSaga({ dispatch, channel: input }, requestOpdsAuthentication, doc, url);
        requests.push(task); return task;
    };
    return { input, actions, watcher, request, run, closed, dispose };
};

afterEach(async () => { await stop?.(); stop = undefined; });

describe("downloads waiting for interrupted authentication", () => {
    it("releases the download when an inline login replaces its modal and is then abandoned", async () => {
        const f = fixture(); const download = f.request(); await flush();
        expect(download.isRunning()).toBe(true);
        f.input.put(authActions.externalRequest.build(url, "inline", "start")); await flush();
        expect(f.closed).toHaveBeenCalledTimes(1);
        expect(download.isRunning()).toBe(false);
        expect(await download.toPromise()).toBe(false);
        expect(f.actions).not.toHaveBeenCalledWith(authActions.cancel.build());
        expect(f.actions).toHaveBeenCalledWith(authActions.externalStatus.build("inline", "waiting", "https://example.org/authorize"));
        f.input.put(authActions.externalRequest.build(url, "inline", "cancel")); await flush();
        expect(f.dispose).toHaveBeenCalledTimes(1);
    });

    it("interrupts only the replaced download when two requests use the same URL", async () => {
        const f = fixture(); const first = f.request(); await flush();
        const second = f.request(); await flush();
        expect(first.isRunning()).toBe(false);
        expect(await first.toPromise()).toBe(false);
        expect(second.isRunning()).toBe(true);
        f.input.put({ type: "LEGACY_LOGIN_COMPLETE" }); await flush();
        expect(await second.toPromise()).toBe(true);
        expect(f.actions).not.toHaveBeenCalledWith(authActions.cancel.build());
    });

    it("releases a waiting download when the coordinator is cancelled", async () => {
        const f = fixture(); const download = f.request(); await flush();
        f.watcher.cancel(); await flush();
        expect(download.isRunning()).toBe(false);
        expect(await download.toPromise()).toBe(false);
    });

    it("still resumes a download after successful legacy authentication", async () => {
        const f = fixture(); const download = f.request(); await flush();
        f.input.put({ type: "LEGACY_LOGIN_COMPLETE" }); await flush();
        expect(await download.toPromise()).toBe(true);
    });

    it("still handles the user's explicit Cancel action", async () => {
        const f = fixture(); const download = f.request(); await flush();
        f.input.put(authActions.cancel.build()); await flush();
        expect(await download.toPromise()).toBe(false);
    });
});


it("does not miss an interruption delivered before the downloader starts waiting", async () => {
    getOpdsAuthenticationChannel().take(request => { if (Array.isArray(request)) request[3]?.(); });
    const task = runSaga({}, requestOpdsAuthentication, doc, url);
    expect(await task.toPromise()).toBe(false);
});
