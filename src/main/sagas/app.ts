import {
    watchDownloadStart,
} from "readium-desktop/sagas/downloader";

import {
    watchDownloadFinish,
    watchDownloadProgress,
} from "readium-desktop/main/sagas/downloader";

export function* appSaga() {
    yield [
        watchDownloadStart(),
        watchDownloadFinish(),
        watchDownloadProgress(),
    ];
}
