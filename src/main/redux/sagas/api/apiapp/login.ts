// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { call } from "typed-redux-saga/macro";
import { SagaGenerator } from "typed-redux-saga/dist";
import { authenticationRequestFromLibraryWebServiceURL, convertAuthenticationFromLibToR2OpdsAuth, dispatchAuthenticationProcess } from "../../apiapp";

const debug = debug_("readium-desktop:main/redux/sagas/api/apiapp/login");

export function* login(libView: IApiappSearchResultView): SagaGenerator<void> {

    const res = yield* call(authenticationRequestFromLibraryWebServiceURL, libView.url);

    const doc = yield* call(convertAuthenticationFromLibToR2OpdsAuth, res);

    debug(JSON.stringify(doc, null, 4));

    yield* call(dispatchAuthenticationProcess, doc, libView.url);
}
