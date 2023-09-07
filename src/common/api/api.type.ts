// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ICatalogModuleApi } from "./interface/catalog.interface";
import { IOpdsModuleApi } from "./interface/opdsApi.interface";
import { IApiappModuleApi } from "./interface/apiappApi.interface";
import { IHttpBrowserModuleApi } from "./interface/httpBrowser.interface";
import { IPublicationModuleApi } from "./interface/publicationApi.interface";

export type TApiMethod =
    ICatalogModuleApi &
    IOpdsModuleApi &
    IApiappModuleApi &
    IHttpBrowserModuleApi &
    IPublicationModuleApi

export type TApiMethodName = keyof TApiMethod;
