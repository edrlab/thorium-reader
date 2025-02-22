// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { setImageClickHandler } from "@r2-navigator-js/electron/renderer";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { eventChannel } from "redux-saga";
import { put as putTyped } from "typed-redux-saga";
import { readerLocalActionSetImageClick } from "../actions";

import { IEventPayload_R2_EVENT_IMAGE_CLICK } from "@r2-navigator-js/electron/common/events";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:img";
const debug = debug_(filename_);
debug("_");

export function getWebviewImageClickChannel() {

    const channel = eventChannel<IEventPayload_R2_EVENT_IMAGE_CLICK>(
        (emit) => {

            const handler = (payload: IEventPayload_R2_EVENT_IMAGE_CLICK) => {
                emit(payload);
            };

            setImageClickHandler(handler);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {
                // no destrutor
            };
        },
    );

    return channel;
}

function* webviewImageClick(payload: IEventPayload_R2_EVENT_IMAGE_CLICK) {

    debug("IMAGE_CLICK received :", payload);
    yield* putTyped(readerLocalActionSetImageClick.build(payload));
}

export function saga() {

    const ch = getWebviewImageClickChannel();
    return takeSpawnEveryChannel(
        ch,
        webviewImageClick,
    );
}
