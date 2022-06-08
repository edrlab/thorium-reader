// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { SagaGenerator } from "typed-redux-saga";

export interface IApiappSearchResultView {
    id: string; // gln
    name: string;
    address: string;
    url: string;
}

export interface IApiappApi {
    search: (
        query: string,
    ) => SagaGenerator<IApiappSearchResultView[]>;
}

export interface IApiappModuleApi {
    "apiapp/search": IApiappApi["search"];
}
