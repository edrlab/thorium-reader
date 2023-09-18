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

import Cover from "../../Cover";
import Loader from "../../Loader";
import Dialog from "../Dialog";

export interface IProps extends TranslatorProps, React.PropsWithChildren {
    publicationViewMaybeOpds: TPublication;
    coverZoom: boolean;
    toggleCoverZoomCb: (coverZoom: boolean) => void;
    closeDialogCb: () => void;
}

const PublicationInfoManager: React.FC<IProps> = (props) => {

    const { publicationViewMaybeOpds, coverZoom, toggleCoverZoomCb, closeDialogCb } = props;

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
                {
                    publicationViewMaybeOpds?.documentTitle
                        ? (
                            coverZoom
                                ? <Cover
                                    publicationViewMaybeOpds={publicationViewMaybeOpds}
                                    coverType="cover"
                                    onClick={
                                        () => toggleCoverZoomCb(coverZoom)
                                    }
                                    onKeyPress={
                                        (e: React.KeyboardEvent<HTMLImageElement>) =>
                                            e.key === "Enter" && toggleCoverZoomCb(coverZoom)
                                    }
                                />
                                :
                                <>
                                    {
                                        props.children
                                    }
                                </>
                        )
                        : <Loader></Loader>
                }
        </Dialog>
    );
};
export default (withTranslator(PublicationInfoManager));
