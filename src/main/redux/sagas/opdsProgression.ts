// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import type { Task } from "redux-saga";
import { call, delay, fork, select } from "typed-redux-saga/macro";
import { readerActions } from "readium-desktop/common/redux/actions";
import { SenderType, type WithSender } from "readium-desktop/common/models/sync";
import { locatorToOpdsProgression } from "readium-desktop/common/models/opdsProgression";
import { diMainGet } from "readium-desktop/main/di";
import { getOpdsProgressionMapping, putOpdsProgression } from "readium-desktop/main/services/opdsProgression";
import { ContentType, parseContentType } from "readium-desktop/utils/contentType";
import { RootState } from "readium-desktop/main/redux/states";

const debug = debug_("readium-desktop:main:opdsProgression");
const pendingUploads = new Map<string, Task>();

export const cancelProgressionDebounce = (publicationIdentifier: string) => {
    pendingUploads.get(publicationIdentifier)?.cancel();
    pendingUploads.delete(publicationIdentifier);
};

export function* debounceOpdsProgression(action: readerActions.setLocator.TAction) {
    const sender = (action as typeof action & Partial<WithSender>).sender;
    if (sender?.type !== SenderType.Renderer || !sender.identifier || !sender.reader_pubId) { return; }
    const reader = yield* select((state: RootState) => state.win.session.reader[sender.identifier]);
    if (!reader || reader.publicationIdentifier !== sender.reader_pubId) { return; }
    const publicationIdentifier = reader.publicationIdentifier;
    const publication = yield* select((state: RootState) => state.publication.db[publicationIdentifier]);
    if (!publication?.opdsPublication?.progressionLink?.url ||
        !publication.files?.some((file) => parseContentType(file.contentType) === ContentType.Epub)) { return; }
    const mapping = getOpdsProgressionMapping(reader.reduxState.info.publicationView.r2PublicationJson);
    const progression = locatorToOpdsProgression(action.payload.locator, mapping?.spine, mapping?.positionList);
    if (typeof progression !== "number") { return; }
    cancelProgressionDebounce(publicationIdentifier);
    const task = yield* fork(uploadDebouncedOpdsProgression, publicationIdentifier, progression);
    pendingUploads.set(publicationIdentifier, task);
}

function* uploadDebouncedOpdsProgression(publicationIdentifier: string, progression: number) {
    try {
        yield* delay(5000);
        const publication = yield* select((state: RootState) => state.publication.db[publicationIdentifier]);
        const url = publication?.opdsPublication?.progressionLink?.url;
        if (!url) { return; }
        const manager = diMainGet("device-id-manager");
        const deviceId = yield* call(() => manager.getDeviceID());
        const name = yield* call(() => manager.getDeviceNAME());
        const locale = yield* select((state: RootState) => state.i18n.locale);
        const result = yield* call(() => putOpdsProgression(url, {
            device: { id: deviceId.includes(":") ? deviceId : `urn:uuid:${deviceId}`, name },
            modified: new Date().toISOString(), progression,
        }, locale));
        if (result.kind !== "success") { debug("Progression PUT failed", result); }
    } finally {
        pendingUploads.delete(publicationIdentifier);
    }
}
