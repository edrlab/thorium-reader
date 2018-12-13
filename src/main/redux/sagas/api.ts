import { container } from "readium-desktop/main/di";

import * as moment from "moment";

import { SagaIterator } from "redux-saga";

import { call, fork, put, select, take } from "redux-saga/effects";

import { apiActions } from "readium-desktop/common/redux/actions";

export function* processRequest(requestAction: apiActions.ApiAction): SagaIterator {
    const { api } = requestAction.meta;
    const apiModule: any = container
        .get(`${api.moduleId}-api`);
    const apiMethod = apiModule[api.methodId].bind(apiModule);

    try {
        const result = yield call(
            apiMethod,
            requestAction.payload,
        );

        yield put(apiActions.buildSuccessAction(requestAction, result));
    } catch (error) {
        yield put(apiActions.buildErrorAction(requestAction, error.message));
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
