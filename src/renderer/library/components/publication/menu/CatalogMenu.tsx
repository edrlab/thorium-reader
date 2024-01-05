// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import PublicationExportButton from "./PublicationExportButton";
import DeletePublicationConfirm from "../../dialog/DeletePublicationConfirm";
import { PublicationInfoLibWithRadix, PublicationInfoLibWithRadixContent, PublicationInfoLibWithRadixTrigger } from "../../dialog/publicationInfos/PublicationInfo";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

const CatalogMenu: React.FC<{publicationView: PublicationView}> = (props) => {
    const [__] = useTranslator();

    return (
        <>
            <PublicationInfoLibWithRadix
                publicationView={props.publicationView}
            >
                <PublicationInfoLibWithRadixTrigger asChild>
                    <button
                    >
                        {__("catalog.bookInfo")}
                    </button>
                </PublicationInfoLibWithRadixTrigger>
                <PublicationInfoLibWithRadixContent />
            </PublicationInfoLibWithRadix>
            <DeletePublicationConfirm
                trigger={(
                    <button
                    >
                        {__("catalog.delete")}
                    </button>
                )}
                publicationView={props.publicationView}
            />
            <PublicationExportButton
                publicationView={props.publicationView}
            />
        </>
    );
};

export default (CatalogMenu);
