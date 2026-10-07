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
import { cancelProgressionDebounce, debounceOpdsProgression } from "readium-desktop/main/redux/sagas/opdsProgression";

const putMock = jest.mocked(putOpdsProgression);
let state: RootState;
const move = (progression: number, identifier = "reader", publicationIdentifier = "publication") => {
    const action = {
        ...readerActions.setLocator.build({
            ...locatorInitialState,
            locator: { href: "chapter.xhtml", locations: { progression } },
        }),
        sender: { type: SenderType.Renderer, identifier, reader_pubId: publicationIdentifier },
    };
    return runSaga({ getState: () => state }, debounceOpdsProgression, action);
};
const advance = (ms: number) => jest.advanceTimersByTimeAsync(ms);

describe("publication OPDS PUT debounce", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        putMock.mockReset().mockResolvedValue({ kind: "network-error", isTimeout: false });
        const reader = { publicationIdentifier: "publication", reduxState: { info: { publicationView: {} } } };
        const publication = {
            files: [{ contentType: "application/epub+zip" }],
            opdsPublication: { progressionLink: { url: "https://example.org/progression" } },
        };
        state = {
            win: { session: { reader: { reader, other: reader } } },
            publication: { db: { publication } },
            i18n: { locale: "en" },
        } as unknown as RootState;
    });
    afterEach(() => {
        cancelProgressionDebounce("publication");
        cancelProgressionDebounce("second");
        jest.useRealTimers();
    });

    it("uploads the latest locator after five seconds across reader windows", async () => {
        move(0.2);
        await advance(3000);
        const task = move(0.4, "other");
        await advance(4999);
        expect(putMock).not.toHaveBeenCalled();
        await advance(1);
        await task.toPromise();
        expect(putMock).toHaveBeenCalledTimes(1);
        expect(putMock.mock.calls[0][1].progression).toBe(0.4);
    });

    it("debounces different publications independently", async () => {
        state.win.session.reader.second = {
            ...state.win.session.reader.reader,
            publicationIdentifier: "second",
        };
        state.publication.db.second = {
            ...state.publication.db.publication,
            opdsPublication: {
                ...state.publication.db.publication.opdsPublication,
                progressionLink: { url: "https://example.org/second" },
            },
        };
        move(0.2);
        await advance(3000);
        move(0.6, "second", "second");
        await advance(2000);
        expect(putMock).toHaveBeenCalledTimes(1);
        await advance(3000);
        expect(putMock).toHaveBeenCalledTimes(2);
        expect(putMock.mock.calls[1][0]).toBe("https://example.org/second");
    });

    it("ignores events with a mismatched publication or unknown reader", async () => {
        await move(0.3, "reader", "wrong").toPromise();
        await move(0.3, "missing").toPromise();
        await advance(5000);
        expect(putMock).not.toHaveBeenCalled();
    });

    it("does not upload publications without a progression endpoint", async () => {
        state.publication.db.publication.opdsPublication.progressionLink = undefined;
        await move(0.3).toPromise();
        await advance(5000);
        expect(putMock).not.toHaveBeenCalled();
    });

    it("allows later locator events after a failed PUT", async () => {
        move(0.3);
        await advance(5000);
        move(0.4, "other");
        await advance(5000);
        expect(putMock).toHaveBeenCalledTimes(2);
    });

    it("uploads the received locator even if the reader closes during debounce", async () => {
        const task = move(0.3);
        delete state.win.session.reader.reader;
        await advance(5000);
        await task.toPromise();
        expect(putMock.mock.calls[0][1].progression).toBe(0.3);
    });
});
