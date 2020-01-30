// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IAnalyticsApi } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { injectable } from "inversify";

@injectable()
export class AnalyticsApi implements IAnalyticsApi {

    public async openBook(
        publicationIdentifier: string,
    ): Promise<void> {
        console.log("in open book function");
        console.log(publicationIdentifier);
    }

    public async closeBook(
        publicationIdentifier: string,
    ): Promise<void> {
        console.log("in close book function");
        console.log(publicationIdentifier);
    }

    public async turnPage(
        publicationIdentifier: string,
    ): Promise<void> {
        console.log("in turn page function");
        console.log(publicationIdentifier);
    }

    public async playTts(
        publicationIdentifier: string,
    ): Promise<void> {
        console.log("in play TTS function");
        console.log(publicationIdentifier);
    }
}