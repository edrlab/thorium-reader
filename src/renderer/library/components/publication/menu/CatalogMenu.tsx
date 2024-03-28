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
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";

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
                        <SVG ariaHidden svg={InfoIcon} />
                        <p>{__("catalog.bookInfo")}</p>
                    </button>
                </PublicationInfoLibWithRadixTrigger>
                <PublicationInfoLibWithRadixContent />
            </PublicationInfoLibWithRadix>
            <DeletePublicationConfirm
                trigger={(
                    <button
                    >
                        <SVG ariaHidden svg={TrashIcon} />
                        <p>{__("catalog.delete")}</p>
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
