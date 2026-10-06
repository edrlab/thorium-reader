// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";
import { readerActions } from "readium-desktop/common/redux/actions";
import { locatorInitialState } from "readium-desktop/common/redux/states/locatorInitialState";
import { SenderType } from "readium-desktop/common/models/sync";
import { RootState } from "readium-desktop/main/redux/states";
import { winSessionReaderReducer } from "readium-desktop/main/redux/reducers/win/session/reader";
import { IDictWinSessionReaderState } from "readium-desktop/main/redux/states/win/session/reader";

jest.mock("electron", () => ({ dialog: {} }));
// Jest does not run the Webpack macro transform; use the runtime typed effects.
jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("readium-desktop/main/db/sqlite/note", () => ({}));
jest.mock("readium-desktop/main/tools/error", () => ({ error: jest.fn() }));
jest.mock("readium-desktop/main/di", () => ({
    diMainGet: () => ({ getDeviceID: async () => "device", getDeviceNAME: async () => "Thorium" }),
}));
jest.mock("readium-desktop/main/services/opdsProgression", () => ({
    getOpdsProgression: jest.fn(),
    getOpdsProgressionMapping: () => ({ spine: [{ Href: "chapter.xhtml" }] }),
    putOpdsProgression: jest.fn(),
}));
import { putOpdsProgression } from "readium-desktop/main/services/opdsProgression";
import {
    cancelProgressionDebounce,
    debounceOpdsProgression,
    resolveOpdsProgression,
} from "readium-desktop/main/redux/sagas/win/reader";

const putMock = jest.mocked(putOpdsProgression);
let state: RootState;
const dispatch = (action: Parameters<typeof winSessionReaderReducer>[1]) => {
    state = {
        ...state,
        win: {
            ...state.win,
            session: { ...state.win.session, reader: winSessionReaderReducer(state.win.session.reader, action) },
        },
    };
};
const move = (progression: number) => {
    const action = {
        ...readerActions.setLocator.build({
            ...locatorInitialState,
            locator: { href: "chapter.xhtml", locations: { progression } },
        }),
        sender: { type: SenderType.Renderer, identifier: "reader", reader_pubId: "publication" },
    };
    dispatch(action);
    return runSaga({ dispatch, getState: () => state }, debounceOpdsProgression, action);
};
const advance = (ms: number) => jest.advanceTimersByTimeAsync(ms);

describe("reader OPDS PUT debounce", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        putMock.mockReset().mockResolvedValue({ kind: "network-error", isTimeout: false });
        state = {
            win: {
                session: {
                    reader: {
                        reader: {
                            publicationIdentifier: "publication",
                            reduxState: {
                                lock: true,
                                info: { publicationView: {} },
                                opdsProgression: { ready: true, progression: 0.1 },
                                locator: { locator: { href: "chapter.xhtml", locations: { progression: 0.1 } } },
                            },
                        },
                    },
                },
            },
            publication: {
                db: {
                    publication: {
                        files: [{ contentType: "application/epub+zip" }],
                        opdsPublication: { progressionLink: { url: "https://example.org/progression" } },
                    },
                },
            },
            i18n: { locale: "en" },
        } as unknown as RootState;
    });
    afterEach(() => {
        cancelProgressionDebounce("reader");
        jest.useRealTimers();
    });

    it("resets the trailing debounce and reads the latest Redux locator", async () => {
        move(0.2);
        await advance(3000);
        const task = move(0.4);
        await advance(4999);
        expect(putMock).not.toHaveBeenCalled();
        await advance(1);
        await task.toPromise();
        expect(putMock).toHaveBeenCalledTimes(1);
        expect(putMock.mock.calls[0][1].progression).toBe(0.4);
        await advance(10000);
        expect(putMock).toHaveBeenCalledTimes(1);
    });

    it.each(["lock", "GET", "dialog"])("does not upload when %s blocks it at expiry", async (block) => {
        const task = move(0.3);
        const reader = state.win.session.reader.reader.reduxState;
        if (block === "lock") {
            reader.lock = false;
        }
        if (block === "GET") {
            reader.opdsProgression.ready = false;
        }
        if (block === "dialog") {
            reader.opdsProgression.document = {
                modified: "2026-01-01",
                progression: 0.8,
                device: { id: "urn:test", name: "Other" },
            };
        }
        await advance(5000);
        await task.toPromise();
        expect(putMock).not.toHaveBeenCalled();
    });

    it("does not replay movement blocked by GET; later movement can upload", async () => {
        state.win.session.reader.reader.reduxState.opdsProgression.ready = false;
        const task = move(0.3);
        await advance(5000);
        await task.toPromise();
        state.win.session.reader.reader.reduxState.opdsProgression.ready = true;
        await advance(10000);
        expect(putMock).not.toHaveBeenCalled();
        move(0.4);
        await advance(5000);
        expect(putMock).toHaveBeenCalledTimes(1);
    });

    it("allows later movement after a failed PUT", async () => {
        move(0.3);
        await advance(5000);
        await advance(10000);
        expect(putMock).toHaveBeenCalledTimes(1);
        move(0.4);
        await advance(5000);
        expect(putMock).toHaveBeenCalledTimes(2);
    });

    it("cancels without flushing on close", async () => {
        const task = move(0.3);
        cancelProgressionDebounce("reader");
        await advance(10000);
        await task.toPromise();
        expect(putMock).not.toHaveBeenCalled();
    });

    it("ignores repeated progression reports and navigator hydration", async () => {
        await move(0.1).toPromise();
        state.win.session.reader.reader.reduxState.opdsProgression.progression = undefined;
        await move(0.2).toPromise();
        await advance(5000);
        expect(putMock).not.toHaveBeenCalled();
    });

    it("accepting remote resume cancels local work and suppresses its navigation", async () => {
        move(0.3);
        state.win.session.reader.reader.reduxState.opdsProgression.document = {
            modified: "2026-01-01",
            progression: 0.8,
            device: { id: "urn:test", name: "Other" },
        };
        const action = {
            ...readerActions.clearOpdsProgression.build("reader", true),
            sender: { type: SenderType.Renderer, identifier: "reader", reader_pubId: "publication" },
        };
        await runSaga({ dispatch, getState: () => state }, resolveOpdsProgression, action).toPromise();
        await move(0.8).toPromise();
        await advance(5000);
        expect(putMock).not.toHaveBeenCalled();
        move(0.9);
        await advance(5000);
        expect(putMock).toHaveBeenCalledTimes(1);
    });

    it("stores locator and exclusive lock ownership in reader Redux state", () => {
        const readers = state.win.session.reader;
        const initial = {
            ...readers,
            other: { ...readers.reader, reduxState: { ...readers.reader.reduxState } },
        } as IDictWinSessionReaderState;
        const next = winSessionReaderReducer(initial, readerActions.setTheLock.build("other"));
        expect(next.reader.reduxState.lock).toBe(false);
        expect(next.other.reduxState.lock).toBe(true);
        expect(next.reader.reduxState.locator.locator.locations.progression).toBe(0.1);
    });
});
