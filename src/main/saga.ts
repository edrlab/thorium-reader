import { watchDownloadStart } from "readium-desktop/sagas/downloader";

export function* appSaga() {
    yield watchDownloadStart();
}
