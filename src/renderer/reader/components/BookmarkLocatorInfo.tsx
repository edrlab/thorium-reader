// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import * as React from "react";
import { formatTime } from "readium-desktop/common/utils/time";
import { isPdfFn } from "readium-desktop/common/isManifestType";
import { getStore } from "../createStore";

const getBookmarkLocatorInfo = (locatorExtended: MiniLocatorExtended) => {
    let name = "";
    if (locatorExtended.locator.text?.highlight) {
        name = locatorExtended.locator.text.highlight;
    } else if (locatorExtended.selectionInfo?.cleanText) {
        name = locatorExtended.selectionInfo.cleanText;
    } else if (locatorExtended.audioPlaybackInfo) {

        const audioPlaybackInfo = locatorExtended.audioPlaybackInfo;

        if (audioPlaybackInfo.globalProgression && audioPlaybackInfo.globalTime) {
            const percent = Math.floor(100 * audioPlaybackInfo.globalProgression);
            const timestamp = formatTime(audioPlaybackInfo.globalTime);
            name = `${timestamp} (${percent}%)`;
        } else {
            const percent = Math.floor(100 * audioPlaybackInfo.localProgression);
            const timestamp = formatTime(audioPlaybackInfo.localTime);
            name = `[${locatorExtended.locator.href}] ${timestamp} ${percent}%`;
        }
    } else if (locatorExtended.locator.href) {
        if (isPdfFn(getStore().getState().reader.info.r2Publication)) {
            name = `${parseInt(locatorExtended.locator.href, 10) + 1}`;
        } else {
            name = `${locatorExtended.locator.href}`;
        }
    }
    return name;
};

export const BookmarkLocatorInfo: React.FC<{locatorExtended: MiniLocatorExtended}> = ({locatorExtended}) => {

    return <p>{getBookmarkLocatorInfo(locatorExtended)}</p>;
};
