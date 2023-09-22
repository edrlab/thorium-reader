// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IHttpBrowserApi } from "./interface/httpBrowser.interface";
import { IOpdsApi } from "./interface/opdsApi.interface";
import { IPublicationApi } from "./interface/publicationApi.interface";
import { IApiappApi } from "./interface/apiappApi.interface";

export type TMethodApi =
    keyof IPublicationApi |
    keyof IOpdsApi |
    keyof IApiappApi |
    keyof IHttpBrowserApi
