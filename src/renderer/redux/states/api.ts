// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { apiActions } from "readium-desktop/common/redux/actions/";

interface PageState<T> {
    totalCount: number;
    page: number;
    items: T[];
}

export interface ApiDataResponse<T> {
    result: (T | PageState<T>);
    resultIsReject?: boolean;
    date: number;
    requestId: string;
    methodId: string;
    moduleId: string;
}

export interface ApiDataState<T> {
    [id: string]: ApiDataResponse<T>;
}

export interface ApiLastSuccess {
    action: apiActions.request.TAction;
    date: number;
}

export interface ApiState<T> {
    lastSuccess: ApiLastSuccess;
    data: ApiDataState<T>;
}
