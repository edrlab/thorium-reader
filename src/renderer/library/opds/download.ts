// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { downloadActions } from "readium-desktop/common/redux/actions";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { TPQueueState } from "readium-desktop/utils/redux-reducers/pqueue.reducer";

type TDownloadState = TPQueueState<downloadActions.progress.Payload, number>;

export const isDownloadUrlActive = (downloads: TDownloadState, url: string): boolean =>
    downloads.some(([download]) => download.downloadUrls.includes(url));

export const isOpdsPublicationDownloading = (
    downloads: TDownloadState,
    publication: IOpdsPublicationView,
): boolean => {
    const acquisitionLinks = [
        ...(publication.openAccessLinks || []),
        ...(publication.sampleOrPreviewLinks || []),
    ];

    return acquisitionLinks.some((link) => isDownloadUrlActive(downloads, link.url));
};
