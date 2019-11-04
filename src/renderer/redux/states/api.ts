// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CodeError } from "readium-desktop/common/errors";

// FIXME what is the purpose of this interface ?
// interface PageState<T> {
//     totalCount: number;
//     page: number;
//     items: T[];
// }

export const LAST_API_SUCCESS_ID = "lastApiSuccess";

export interface ApiDataResponse<T> {
    time: number;
    error: boolean;
    errorMessage?: CodeError;
    methodId?: string;
    moduleId?: string;
    result?: T;
}

export interface ApiResponse<T> {
    data: ApiDataResponse<T>;
    lastSuccess: ApiDataResponse<T> | undefined;
    lastTime: number;
}

export interface ApiState<T> {
    [id: string]: ApiResponse<T>;
    [LAST_API_SUCCESS_ID]: ApiResponse<any> | undefined;
}
