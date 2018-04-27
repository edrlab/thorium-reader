// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { injectable} from "inversify";
import * as path from "path";
import { Store } from "redux";
import { tmpNameSync } from "tmp";
import { URL } from "url";
import * as uuid from "uuid";

import { Download } from "readium-desktop/common/models/download";
import { DownloadStatus } from "readium-desktop/common/models/downloadable";
import { downloaderActions } from "readium-desktop/common/redux/actions";

@injectable()
export class Downloader {
    // Path where files are downloaded
    private dstRepositoryPath: string;

    // Redux store
    private store: Store<any>;

    public constructor(dstRepositoryPath: string, store: Store<any>) {
        this.dstRepositoryPath = dstRepositoryPath;
        this.store = store;
    }

    public download(url: string): Download {
        // Get extension from url
        const urlObj = new URL(url);
        const ext = path.extname(urlObj.pathname);

        // Create temporary file as destination file
        const dstPath = tmpNameSync({
            dir: this.dstRepositoryPath,
            prefix: "readium-desktop-",
            postfix: `${ext}.part`});

        // Create download
        const download: Download = {
            identifier: uuid.v4(),
            srcUrl: url,
            dstPath,
            progress: 0,
            status: DownloadStatus.Init,
        };

        // Append to download queue
        this.store.dispatch(downloaderActions.add(download));

        return download;
    }
}
