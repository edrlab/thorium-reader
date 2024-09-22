// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";

import * as React from "react";
import { acceptedExtensionArray } from "readium-desktop/common/extension";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as EmptyLibraryIcon from "readium-desktop/renderer/assets/icons/emptylibrary-icon.svg";
import * as EmptyLibraryBgIcon from "readium-desktop/renderer/assets/icons/emptylibrary-background-icon.svg";
import * as DocumentsIcon from "readium-desktop/renderer/assets/icons/documents-icon.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";


const NoPublicationInfo = () => {
        const [ __ ]= useTranslator();
        const [detailOpen, setDetailOpen] = React.useState(false);
        return (
            <>
                {/* <div className={stylesBlocks.block_dashed}>
                    <p><strong>{__("catalog.noPublicationHelpL1")}</strong></p>
                    <p><strong>{__("catalog.noPublicationHelpL2")}</strong></p>
                    <p>{__("catalog.noPublicationHelpL3")}</p>
                    <p>{__("catalog.noPublicationHelpL4")}</p>
                    <p>
                    {
                        acceptedExtensionArray.map(
                            (ext, i) => <span key={`ext_${i}`}>
                                <strong>{
                                    ext
                                }</strong>
                                {i < acceptedExtensionArray.length - 1 ? " | " : ""}
                            </span>,
                        )
                    }
                    </p>
                </div> */}
                <div className={stylesGlobal.noPublications_container}>
                    <SVG ariaHidden svg={EmptyLibraryBgIcon} />
                    <SVG ariaHidden svg={EmptyLibraryIcon} className={stylesGlobal.emptyLibraryIcon} />
                    <div className={stylesGlobal.noPublications_text}>
                        <p><strong>{__("catalog.noPublicationHelpL1")}</strong></p>
                        <p>{__("catalog.noPublicationHelpL2", { importTitle: __("header.importTitle")})}</p>
                        {/* <p>{__("catalog.noPublicationHelpL3")}</p> */}
                        <details onClick={() => setDetailOpen(!detailOpen)}>
                            <summary>
                                <SVG ariaHidden svg={DocumentsIcon} />
                                {__("catalog.noPublicationHelpL4")}
                                {detailOpen ?
                                <SVG ariaHidden svg={ChevronDown} />
                                :
                                <SVG ariaHidden svg={ChevronUp} />
                                }
                            </summary>
                            <div className={stylesGlobal.summary_content}>
                                {__("catalog.noPublicationHelpL3")}
                                <div className={stylesGlobal.acceptedExtension}>
                                    {
                                    acceptedExtensionArray.map(
                                        (ext, i) => <span key={`ext_${i}`}>
                                            <p>{
                                                ext
                                            }</p>
                                            {i < acceptedExtensionArray.length - 1 ? " | " : ""}
                                        </span>,
                                    )}
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </>
        );
    };

export default NoPublicationInfo;
