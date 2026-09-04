// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ipcRenderer } from "electron";
import { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { analyticsIpc } from "readium-desktop/common/ipc";

export const logEvent = (
    name: string,
    params?: TAnalyticsEventParams,
): void => {
    ipcRenderer.send(analyticsIpc.CHANNEL, {
        type: analyticsIpc.EventType.LogEvent,
        payload: {
            name,
            ...(params ? { params } : {}),
        },
    } as analyticsIpc.EventPayload);
};
