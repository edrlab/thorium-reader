// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { WindowSender } from "readium-desktop/common/models/sync";

interface ToastRoutingAction {
    payload?: { publicationIdentifier?: string };
    destination?: { identifier?: string };
    sender?: Partial<WindowSender>;
}

// A notification belongs to one window, even when the same book is open twice.
export function getToastDestination(
    action: ToastRoutingAction,
    libraryIdentifier: string | undefined,
    readers: { identifier: string; publicationIdentifier: string }[],
): string | undefined {
    const requestedWindow = action.destination?.identifier || action.sender?.identifier;
    if (requestedWindow && (requestedWindow === libraryIdentifier || readers.some((reader) => reader.identifier === requestedWindow))) {
        return requestedWindow;
    }
    const publicationIdentifier = action.payload?.publicationIdentifier;
    if (publicationIdentifier) {
        const matchingReaders = readers.filter((reader) => reader.publicationIdentifier === publicationIdentifier);
        return matchingReaders.find((reader) => reader.identifier === action.sender?.identifier)?.identifier
            || matchingReaders[0]?.identifier || libraryIdentifier;
    }
    return libraryIdentifier;
}
