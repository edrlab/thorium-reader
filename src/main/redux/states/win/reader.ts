// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IBrowserWindowState } from "./win";

export interface IReaderBrowserWindowState extends IBrowserWindowState {
    publicationIdentifier: string;
}

export interface IArrayReaderBrowserWindowState {
    [id: string]: IReaderBrowserWindowState;
}

export interface IArrayReaderReduxStoreState {
    [pubId: string]: undefined; // reader root state redux
}
