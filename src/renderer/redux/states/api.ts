// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ApiAction } from "readium-desktop/common/redux/actions/api";

interface PageState<T> {
    totalCount: number;
    page: number;
    items: T[];
}

export interface ApiDataResponse<T> {
    result: (T | PageState<T>);
    date: number;
    requestId: string;
    module: string;
    methodId: string;
}

export interface ApiDataState {
    [id: string]: ApiDataResponse<any>;
}

export interface ApiLastSuccess {
    action: ApiAction;
    date: number;
}

export interface ApiState {
    lastSuccess: ApiLastSuccess;
    data: ApiDataState;
}
