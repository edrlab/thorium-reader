// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as mime from "mime-types";

import { Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { TransformerHTML } from "@r2-shared-js/transform/transformer-html";

const debug = debug_("readium-desktop:transformer-svg");

export class TransformerSVG extends TransformerHTML {

    public supports(_publication: Publication, link: Link): boolean {

        let mediaType = mime.lookup(link.Href);
        if (link && link.TypeLink) {
            mediaType = link.TypeLink;
        }

        if (typeof mediaType === "string" && mediaType.endsWith("/svg+xml")) {
            debug("TransformerSVG YES");
            return true;
        }

        return false;
    }
}
