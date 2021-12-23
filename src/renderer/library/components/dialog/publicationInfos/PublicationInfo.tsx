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
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    PublicationInfoContent,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
import {
    PublicationInfoManager,
} from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoManager";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { dispatchOpdsLink } from "readium-desktop/renderer/library/opds/handleLink";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";

import CatalogControls from "./catalogControls";
import CatalogLcpControls from "./catalogLcpControls";
import OpdsControls from "./opdsControls/OpdsControls";
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
const debug = debug_("readium-desktop:renderer:library:publication-info");

class PublicationInfo extends React.Component<IProps> {

    public render() {
        const { publication, toggleCoverZoom, closeDialog, coverZoom, open } = this.props;

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
                    r2Publication={null}
                    manifestUrlR2Protocol={null}
                    handleLinkUrl={null}
                    toggleCoverZoomCb={toggleCoverZoom}
                    ControlComponent={this.controlsComponent}
                    TagManagerComponent={TagManager}
                    coverZoom={coverZoom}
                    translator={this.props.translator}
                    onClikLinkCb={
                        (_link) => () =>
                            this.props.link(
                            _link.link[0], this.props.location, _link.name)
                    }
                    focusWhereAmI={false}
                    pdfPlayerNumberOfPages={undefined}
                    divinaNumberOfPages={undefined}
                    divinaContinousEqualTrue={undefined}
                    readerReadingLocation={undefined}
                    closeDialogCb={closeDialog}
                >
                </PublicationInfoContent>
            </PublicationInfoManager>
        );
    }

    private controlsComponent = () => {
        const { publicationInfoLib, publicationInfoOpds, publication } = this.props;

        let controlsComponent = (<></>);

        if (publicationInfoOpds) {
            controlsComponent = (<OpdsControls opdsPublicationView={publication as IOpdsPublicationView} />);
        }
        if (publicationInfoLib) {
            if (publication?.lcp) {
                controlsComponent = (<CatalogLcpControls publicationView={publication as PublicationView} />);
            } else {
                controlsComponent = (<CatalogControls publicationView={publication as PublicationView} />);
            }
        }

        return controlsComponent;
    };

}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    // Warning : mapDispatchToProps isn't rendered when the state is updateds
    // but only when the component is mounted
    debug("mapDispatchToProps rendered");
    return {
        closeDialog: () => {
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
        link: (...data: Parameters<ReturnType<typeof dispatchOpdsLink>>) =>
            dispatchOpdsLink(dispatch)(...data),
    };
};

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.PublicationInfoOpds
            || state.dialog.type === DialogTypeName.PublicationInfoLib,
        publicationInfoOpds: state.dialog.type === DialogTypeName.PublicationInfoOpds,
        publicationInfoLib: state.dialog.type === DialogTypeName.PublicationInfoLib,
    },
    ...(state.dialog.data as DialogType[DialogTypeName.PublicationInfoOpds]),
    location: state.router.location,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationInfo));
