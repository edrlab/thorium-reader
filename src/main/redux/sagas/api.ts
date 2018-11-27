import { container } from "readium-desktop/main/di";

import * as moment from "moment";

import { SagaIterator } from "redux-saga";

import { call, fork, put, select, take } from "redux-saga/effects";

import { apiActions } from "readium-desktop/common/redux/actions";

import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";



export function* processRequest(requestAction: apiActions.ApiAction): SagaIterator {
    const { api } = requestAction.meta;

    if (api.module == "catalog" && api.methodId == "get") {
        const publicationRepository = container.get("publication-repository") as PublicationRepository;

        try {
            const result = yield call(
                () => publicationRepository.findAll()
            );

            const publications: any = result.map((pub: PublicationDocument) => {
                return {
                    title: pub.title,
                    tags: [] as any,
                }
            });

            const payload = {
                entries: [
                    {
                        title: "Deniers ajouts",
                        publications,
                    },
                ],
            }
            console.log("##main", payload);

            yield put(apiActions.buildSuccessAction(requestAction, payload));
        } catch (error) {
            yield put(apiActions.buildErrorAction(requestAction, error.message));
        }
    }
}

export function* requestWatcher() {
    while (true) {
        const action = yield take(apiActions.ActionType.Request);
        yield fork(processRequest, action);
    }
}

export function* watchers() {
    yield [
        requestWatcher(),
    ];
}
