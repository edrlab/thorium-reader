// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ICatalogModuleApi } from "./interface/catalog.interface";
import { IKeyboardModuleApi } from "./interface/keyboardApi.interface";
import { ILcpModuleApi } from "./interface/lcpApi.interface";
import { IOpdsModuleApi } from "./interface/opdsApi.interface";
import { IBrowserModuleApi } from "./interface/browser.interface";
import { IPublicationModuleApi } from "./interface/publicationApi.interface";
import { IReaderModuleApi } from "./interface/readerApi.interface";
import { ISessionModuleApi } from "./interface/session.interface";

export type TApiMethod =
    ICatalogModuleApi &
    ILcpModuleApi &
    IOpdsModuleApi &
    IBrowserModuleApi &
    IKeyboardModuleApi &
    IPublicationModuleApi &
    IReaderModuleApi &
    ISessionModuleApi;

export type TApiMethodName = keyof TApiMethod;
