// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import {
    PublicationInfoContent,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
import PublicationInfoManager from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoManager";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";

import TagManager from "./TagManager";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

// Logger
const debug = debug_("readium-desktop:renderer:reader:publication-info");
debug("_");

class PublicationInfo extends React.Component<IProps> {

    public render() {

        const { publication, toggleCoverZoom, closeDialog, coverZoom, open, focusWhereAmI, pdfPlayerNumberOfPages, divinaNumberOfPages, divinaContinousEqualTrue, readerReadingLocation } = this.props;

        if (!open) {
            return <></>;
        }

        return (
            <PublicationInfoManager
                publication={publication}
                coverZoom={coverZoom}
                toggleCoverZoomCb={toggleCoverZoom}
                closeDialogCb={closeDialog}
            >
                <PublicationInfoContent
                    publication={publication}
                    r2Publication={this.props.r2Publication}
                    manifestUrlR2Protocol={this.props.manifestUrlR2Protocol}
                    handleLinkUrl={this.props.handleLinkUrl}
                    toggleCoverZoomCb={toggleCoverZoom}
                    TagManagerComponent={TagManager}
                    coverZoom={coverZoom}
                    translator={this.props.translator}
                    focusWhereAmI={focusWhereAmI}
                    pdfPlayerNumberOfPages={pdfPlayerNumberOfPages}
                    divinaNumberOfPages={divinaNumberOfPages}
                    divinaContinousEqualTrue={divinaContinousEqualTrue}
                    readerReadingLocation={readerReadingLocation}
                    closeDialogCb={closeDialog}
                >

                </PublicationInfoContent>
            </PublicationInfoManager>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            // TODO: this is a short-term hack.
            // Can we instead subscribe to Redux action CloseRequest,
            // but narrow it down specically to the window instance (not application-wide)
            window.document.dispatchEvent(new Event("Thorium:DialogClose"));
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
        toggleCoverZoom: (state: boolean) => {
            dispatch(dialogActions.updateRequest.build(
                {
                    coverZoom: !state,
                },
            ));
        },
    };
};

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => ({
    ...{
        r2Publication: state.reader.info.r2Publication,
        manifestUrlR2Protocol: state.reader.info.manifestUrlR2Protocol,
        open: state.dialog.type === DialogTypeName.PublicationInfoReader,
        publicationInfoReader: state.dialog.type === DialogTypeName.PublicationInfoReader,
    },
    ...(state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader]),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationInfo));
