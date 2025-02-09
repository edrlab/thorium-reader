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

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:img";
const debug = debug_(filename_);
debug("_");

export function getWebviewImageClickChannel() {
    const channel = eventChannel<string>(
        (emit) => {

            const handler = (href: string) => {
                emit(href);
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


function* webviewImageClick(href: string) {

    debug("IMAGE_CLICK received :", href);
    yield* putTyped(readerLocalActionSetImageClick.build(href));
}

export function saga() {

    const ch = getWebviewImageClickChannel();
    return takeSpawnEveryChannel(
        ch,
        webviewImageClick,
    );
}
