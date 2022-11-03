// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";

import * as React from "react";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";

import Cover from "../../Cover";
import Loader from "../../Loader";
import Dialog from "../Dialog";

export interface IProps extends TranslatorProps {
    publication: TPublication;
    coverZoom: boolean;
    toggleCoverZoomCb: (coverZoom: boolean) => void;
    closeDialogCb: () => void;
}

const PublicationInfoManager: React.FC<IProps> = (props) => {

    const { publication, coverZoom, toggleCoverZoomCb, closeDialogCb } = props;

    return (
        <Dialog
            close={
                () =>
                    coverZoom
                    ? toggleCoverZoomCb(coverZoom)
                    : closeDialogCb()
            }
            title={props.__("catalog.bookInfo")}
            noFooter={true}
        >
            <div className={stylesModals.modal_dialog_body}>
                {
                    publication?.documentTitle
                        ? (
                            coverZoom
                                ? <Cover
                                    publicationViewMaybeOpds={publication}
                                    coverType="cover"
                                    onClick={
                                        () => toggleCoverZoomCb(coverZoom)
                                    }
                                    onKeyPress={
                                        (e: React.KeyboardEvent<HTMLImageElement>) =>
                                            e.key === "Enter" && toggleCoverZoomCb(coverZoom)
                                    }
                                >
                                </Cover>
                                :
                                <>
                                    {
                                        props.children
                                    }
                                </>
                        )
                        : <Loader></Loader>
                }
            </div>
        </Dialog>
    );
};
export default (withTranslator(PublicationInfoManager));
