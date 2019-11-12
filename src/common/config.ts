// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { BaseRepository } from "readium-desktop/main/db/repository/base";

export const LocaleConfigIdentifier = "i18n";
export interface LocaleConfigValueType {
    locale: string;
}
export type LocaleConfigDocumentType = ConfigDocument<LocaleConfigValueType>;
export type LocaleConfigRepositoryType = BaseRepository<LocaleConfigDocumentType>;
// import { Timestampable } from "readium-desktop/common/models/timestampable";
// export type LocaleConfigDocumentTypeWithoutTimestampable = Omit<LocaleConfigDocumentType, keyof Timestampable>;
