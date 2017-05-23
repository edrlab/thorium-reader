import { injectable} from "inversify";
import * as path from "path";
import { Store } from "redux";
import { tmpNameSync } from "tmp";
import { URL } from "url";
import * as uuid from "uuid";

import * as downloadActions from "readium-desktop/actions/downloader";
import { Download, DownloadStatus } from "readium-desktop/downloader/download";

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
        let download: Download = {
            uuid: uuid.v4(),
            srcUrl: url,
            dstPath,
            progress: 0,
            status: DownloadStatus.Init,
        };

        // Append to download queue
        this.store.dispatch(downloadActions.add(download));

        return download;
    }
}
