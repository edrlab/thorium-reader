// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { TCover } from "./cover.type";

type TPublicationViewOmit = Omit<PublicationView, keyof IOpdsPublicationView>;
type TOpdsPublicationViewOmit = Omit<IOpdsPublicationView, keyof PublicationView>;
type TPartialPublication = Partial<TPublicationViewOmit> & Partial<TOpdsPublicationViewOmit>;
type TPublicationCommonKey = Exclude<keyof PublicationView, keyof TPublicationViewOmit>;
type TPublicationCommon = Pick<PublicationView, TPublicationCommonKey>;
type TOpdsPublicationCommon = Pick<IOpdsPublicationView, TPublicationCommonKey>;
type TPublicationMerge = TPublicationCommon | TOpdsPublicationCommon;

// Tpublication = merge OPDS Publication View and Catalog Publication View
export type TPublication = TPublicationMerge & TPartialPublication & { cover?: TCover };
