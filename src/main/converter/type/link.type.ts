// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { OPDSLink } from "@r2-opds-js/opds/opds2/opds2-link";
import { OPDSProperties } from "@r2-opds-js/opds/opds2/opds2-properties";

export type TProperties = Partial<OPDSProperties>;
type TLink = Omit<OPDSLink, "Properties">;
export type TLinkMayBeOpds = TLink & {
    Properties: TProperties,
};
