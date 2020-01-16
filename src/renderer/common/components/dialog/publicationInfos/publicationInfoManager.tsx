// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { TPublication } from "readium-desktop/renderer/common/type/publication.type";

import Cover from "../../Cover";
import Loader from "../../Loader";
import Dialog from "../Dialog";

export interface IProps {
    publication: TPublication;
    coverZoom: boolean;
    toggleCoverZoomCb: (coverZoom: boolean) => void;
    closeDialogCb: () => void;
}

export const PublicationInfoManager: React.FC<IProps> = (props) => {

    const { publication, coverZoom, toggleCoverZoomCb, closeDialogCb } = props;

    return (
        <Dialog
            open={true}
            close={
                () =>
                    coverZoom
                    ? toggleCoverZoomCb(coverZoom)
                    : closeDialogCb()
            }
        >
            {
                publication?.title
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
        </Dialog>
    );
};
