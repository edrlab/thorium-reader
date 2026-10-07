// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";
import { readerActions } from "readium-desktop/common/redux/actions";
import { SenderType } from "readium-desktop/common/models/sync";
import { locatorInitialState } from "readium-desktop/common/redux/states/locatorInitialState";
import { winSessionReaderReducer } from "readium-desktop/main/redux/reducers/win/session/reader";
import type { IDictWinSessionReaderState } from "readium-desktop/main/redux/states/win/session/reader";

const initial = () =>
    ({
        first: { publicationIdentifier: "publication", reduxState: { lock: false, opdsProgression: {} } },
        second: { publicationIdentifier: "publication", reduxState: { lock: true, opdsProgression: {} } },
    }) as unknown as IDictWinSessionReaderState;

describe("main reader session snapshots", () => {
    it("updates only the sending reader's locator", () => {
        const state = initial();
        const action = {
            ...readerActions.setLocator.build(locatorInitialState),
            sender: { type: SenderType.Renderer, identifier: "first", reader_pubId: "publication" },
        };
        const next = winSessionReaderReducer(state, action);
        expect(next.first.reduxState.locator).toBe(action.payload);
        expect(next.second).toBe(state.second);
    });

    it.each(["missing", "mismatched"])("rejects %s locator senders", (kind) => {
        const state = initial();
        const action = {
            ...readerActions.setLocator.build(locatorInitialState),
            sender: {
                type: SenderType.Renderer,
                identifier: kind === "missing" ? "unknown" : "first",
                reader_pubId: kind === "mismatched" ? "other-publication" : "publication",
            },
        };
        expect(winSessionReaderReducer(state, action)).toBe(state);
    });

    it("mirrors lock acquisition without changing other readers", () => {
        const state = initial();
        const next = winSessionReaderReducer(state, readerActions.setTheLock.build("first"));
        expect(next.first.reduxState.lock).toBe(true);
        expect(next.second).toBe(state.second);
    });

    it("stores and clears the targeted remote progression document", () => {
        const document = { modified: "2026-10-07", progression: 0.5, device: { id: "device", name: "Reader" } };
        let state = winSessionReaderReducer(
            initial(),
            readerActions.setOpdsProgressionState.build("first", { ready: true }),
        );
        state = winSessionReaderReducer(state, readerActions.setOpdsProgression.build("first", document));
        expect(state.first.reduxState.opdsProgression).toEqual({ ready: true, document });
        state = winSessionReaderReducer(state, {
            ...readerActions.clearOpdsProgression.build(),
            sender: { type: SenderType.Renderer, identifier: "first", reader_pubId: "publication" },
        });
        expect(state.first.reduxState.opdsProgression).toEqual({ ready: true, document: undefined });
    });
});
