import { SagaIterator } from "redux-saga";
import { take } from "redux-saga/effects";

import {
    PUBLICATION_DOWNLOAD_ADD,
    PUBLICATION_DOWNLOAD_FINISH,
    PUBLICATION_DOWNLOAD_PROGRESS,
} from "readium-desktop/main/actions/publication";

export function* watchPublicationDownloadStart(): SagaIterator {
    while (true) {
        const action = yield take(PUBLICATION_DOWNLOAD_ADD);
    }
}

export function* watchPublicationDownloadProgress(): SagaIterator {
    while (true) {
        const action = yield take(PUBLICATION_DOWNLOAD_PROGRESS);
    }
}

export function* watchPublicationDownloadFinish(): SagaIterator {
    while (true) {
        const action = yield take(PUBLICATION_DOWNLOAD_FINISH);
    }
}
