// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ToastType } from "readium-desktop/common/models/toast";
import { ToastState } from "readium-desktop/common/redux/states/toast";

export function addToastToQueue(
    queue: Record<string, ToastState>,
    id: string,
    toast: ToastState,
    publicationIdentifier?: string,
): Record<string, ToastState> {
    if (!toast.open || !toast.data?.trim()
        || (toast.publicationIdentifier && publicationIdentifier && toast.publicationIdentifier !== publicationIdentifier)) {
        return queue;
    }
    // Suppress repeated errors/prerequisites only while they are visible. Once
    // dismissed, another attempt must be able to report the same failure again.
    if (toast.type !== ToastType.Success && Object.values(queue).some((current) =>
        current.type === toast.type && current.data === toast.data
        && current.publicationIdentifier === toast.publicationIdentifier)) {
        return queue;
    }
    return { ...queue, [id]: toast };
}
