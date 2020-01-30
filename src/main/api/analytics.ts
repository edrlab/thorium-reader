// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IAnalyticsApi } from "readium-desktop/common/api/interface/analyticsApi.interface";
import { inject, injectable } from "inversify";
import { AnalyticsType } from "readium-desktop/common/models/analytics";
import { AnalyticsRepository } from "readium-desktop/main/db/repository/analytics";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";

@injectable()
export class AnalyticsApi implements IAnalyticsApi {

    @inject(diSymbolTable["analytics-repository"])

    private readonly analyticsRepository!: AnalyticsRepository;

    public async openBook(
        publicationIdentifier: string,
    ): Promise<void> {
        const analyticsType = AnalyticsType.OpenBook
        this.saveToDb(analyticsType,publicationIdentifier)
    }

    public async saveToDb(analyticsType: AnalyticsType, publicationIdentifier: string) {
        const doc = {
            publicationIdentifier,
            analyticsType: analyticsType
        }
        await this.analyticsRepository.save(doc);
    }

    public async closeBook(
        publicationIdentifier: string,
    ): Promise<void> {
        console.log("in close book function");
        console.log(publicationIdentifier);
        const analyticsType = AnalyticsType.CloseBook
        this.saveToDb(analyticsType,publicationIdentifier)
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
        const analyticsType = AnalyticsType.PlayTts
        this.saveToDb(analyticsType,publicationIdentifier)
    }
}