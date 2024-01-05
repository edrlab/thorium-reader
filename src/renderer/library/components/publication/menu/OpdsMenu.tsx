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

const OpdsMenu: React.FC<{opdsPublicationView: IOpdsPublicationView}> = (props) => {
    const [__] = useTranslator();

    return (
        <>
            <PublicationInfoOpdsWithRadix
                opdsPublicationView={props.opdsPublicationView}
            >
                <PublicationInfoOpdsWithRadixTrigger asChild>
                    <button>
                        {__("opds.menu.aboutBook")}
                    </button>

                </PublicationInfoOpdsWithRadixTrigger>
                <PublicationInfoOpdsWithRadixContent />
            </PublicationInfoOpdsWithRadix>
        </>
    );

};

export default (OpdsMenu);
