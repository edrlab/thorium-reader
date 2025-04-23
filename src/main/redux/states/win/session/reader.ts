// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderStateReaderSession } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { IBrowserWindowState } from "./common";

export interface IWinSessionReaderState extends IBrowserWindowState {
    publicationIdentifier: string;
    manifestUrl: string;
    fileSystemPath: string;
    reduxState: Partial<IReaderStateReaderSession>;
}

export interface IDictWinSessionReaderState {
    [id: string]: IWinSessionReaderState;
}
