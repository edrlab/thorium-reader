// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { URL_PROTOCOL_OPDS, URL_HOST_OPDS_AUTH } from "readium-desktop/common/streamerProtocol";
import type { TOpdsAuthenticationChannel } from "readium-desktop/main/event";
import type { getFeed } from "./api/opds/feed";
import type { IOpdsFeedView } from "readium-desktop/common/views/opds";
import type { BrowserWindow } from "electron";
import type { TakeableChannel, Task } from "redux-saga";
import { authActions, historyActions, opdsActions } from "readium-desktop/common/redux/actions";
import type { TregisterHttpProtocolHandler } from "./getEventChannel";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, cancel, cancelled, delay, fork, join, put, race, spawn, take } from "redux-saga/effects";

export interface IExternalAuthenticationSession {
    authorizationUrl: string;
    complete: (request: Electron.ProtocolRequest) => Promise<boolean>;
    openFallback: () => Promise<BrowserWindow | undefined>;
    dispose: () => void;
}

export interface IExternalAuthenticationDependencies {
    getCatalog?: typeof getFeed;
    legacy?: {
        requests: TakeableChannel<TOpdsAuthenticationChannel>;
        run: (request: TOpdsAuthenticationChannel) => Generator;
        onError: (error: unknown) => void;
    };
    prepare: (url: string) => Promise<IExternalAuthenticationSession>;
    openExternal: (url: string) => Promise<void>;
    callbacks: TakeableChannel<TregisterHttpProtocolHandler>;
}

function* waitForCallback(session: IExternalAuthenticationSession, callbacks: TakeableChannel<TregisterHttpProtocolHandler>) {
    while (true) {
        const event: TregisterHttpProtocolHandler = yield take(callbacks);
        try {
            const complete: boolean = yield call(session.complete, event.request);
            if (complete) return true;
        } catch {
            return false;
        } finally {
            event.callback({ url: undefined });
        }
    }
}

export function* runExternalAuthentication(dependencies: IExternalAuthenticationDependencies, action: authActions.externalRequest.TAction) {
    const { url, requestId, command } = action.payload;
    if (command === "cancel") return;
    let session: IExternalAuthenticationSession | undefined;
    let win: BrowserWindow | undefined;
    let task: Task | undefined;
    try {
        yield put(authActions.externalStatus.build(requestId, "preparing"));
        session = yield call(dependencies.prepare, url);
        // Listen before opening either browser: a provider can redirect immediately.
        task = yield fork(waitForCallback, session, dependencies.callbacks);
        if (command === "retry") {
            win = yield call(session.openFallback);
            if (!win) throw new Error("Unable to open the authentication browser");
        } else {
            yield call(dependencies.openExternal, session.authorizationUrl);
        }
        yield put(authActions.externalStatus.build(requestId, win ? "fallback" : "waiting", session.authorizationUrl));
        const result: { complete?: boolean; expired?: boolean; closed?: boolean } = yield race({
            complete: join(task),
            expired: delay(240000, true),
            ...(win ? { closed: call(() => win.isDestroyed() ? Promise.resolve(true)
                : new Promise<boolean>(resolve => win.once("closed", () => resolve(true)))) } : {}),
        });
        if (result.complete === false) {
            yield put(authActions.externalStatus.build(requestId, "failed"));
            return;
        }
        if (!result.complete) {
            yield put(authActions.externalStatus.build(requestId, result.expired ? "expired" : "cancelled"));
            return;
        }
        yield put(authActions.externalStatus.build(requestId, "complete"));
        if (action.payload.catalogIdentifier && dependencies.getCatalog) {
            const feed: IOpdsFeedView = yield call(dependencies.getCatalog, action.payload.catalogIdentifier);
            yield put(historyActions.pushFeed.build(feed));
        } else {
            yield put(historyActions.refresh.build());
        }
        yield put(opdsActions.refresh.build());
        yield put(authActions.done.build());
    } catch {
        yield put(authActions.externalStatus.build(requestId, "failed"));
    } finally {
        session?.dispose();
        if (task?.isRunning()) yield cancel(task);
        if (win && !win.isDestroyed()) win.close();
        const wasCancelled: boolean = yield cancelled();
        if (wasCancelled) yield put(authActions.externalStatus.build(requestId, "cancelled"));
    }
}

// A cleanup from an old view must not cancel a newer view's transaction.
export function* watchExternalAuthentication(dependencies: IExternalAuthenticationDependencies) {
    let activeId: string | undefined;
    let task: Task | undefined;
    try {
        while (true) {
            const next: { external?: authActions.externalRequest.TAction; legacy?: TOpdsAuthenticationChannel } = yield race({
                external: take(authActions.externalRequest.ID),
                ...(dependencies.legacy ? { legacy: take(dependencies.legacy.requests) } : {}),
            });
            if (next.legacy) {
                if (task?.isRunning()) yield cancel(task);
                activeId = undefined;
                task = yield fork(function* () {
                    try { yield call(dependencies.legacy.run, next.legacy); }
                    catch (error) { dependencies.legacy.onError(error); }
                });
                continue;
            }
            const action = next.external;
            if (action.payload.command === "cancel" && action.payload.requestId !== activeId) continue;
            if (task?.isRunning()) yield cancel(task);
            activeId = action.payload.requestId;
            if (action.payload.command !== "cancel") {
                task = yield fork(runExternalAuthentication, dependencies, action);
            }
        }
    } finally {
        if (task?.isRunning()) yield cancel(task);
    }
}

export function matchesExternalAuthenticationCallback(url: string, expectedState: string, requireState: boolean): boolean {
    try {
        const callback = new URL(url);
        if (callback.protocol !== URL_PROTOCOL_OPDS + ":" || callback.host !== URL_HOST_OPDS_AUTH) return false;
        const params = new URLSearchParams(callback.hash.slice(1) || callback.search.slice(1));
        const state = params.get("state");
        return !((requireState || state) && state !== expectedState);
    } catch {
        return false;
    }
}

// Initializers yield this effect, so an idle watcher must not block application startup.
export function startExternalAuthentication(dependencies: IExternalAuthenticationDependencies) {
    return spawn(watchExternalAuthentication, dependencies);
}
