// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationInfoOpdsWithRadix, PublicationInfoOpdsWithRadixContent, PublicationInfoOpdsWithRadixTrigger } from "../../dialog/publicationInfos/PublicationInfo";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";

const OpdsMenu: React.FC<{opdsPublicationView: IOpdsPublicationView}> = (props) => {
    const [__] = useTranslator();

    return (
        <>
            <PublicationInfoOpdsWithRadix
                opdsPublicationView={props.opdsPublicationView}
            >
                <PublicationInfoOpdsWithRadixTrigger asChild>
                    <button>
                        <SVG ariaHidden svg={InfoIcon} />
                        {__("opds.menu.aboutBook")}
                    </button>

                </PublicationInfoOpdsWithRadixTrigger>
                <PublicationInfoOpdsWithRadixContent
                 />
            </PublicationInfoOpdsWithRadix>
        </>
    );

};

export default (OpdsMenu);
