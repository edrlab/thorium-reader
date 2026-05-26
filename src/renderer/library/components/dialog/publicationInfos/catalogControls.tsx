// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import * as React from "react";
import { connect } from "react-redux";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as SaveAsIcon from "readium-desktop/renderer/assets/icons/SaveAs-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as ReadBook from "readium-desktop/renderer/assets/icons/readBook-icon.svg";

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import DeletePublicationConfirm from "../DeletePublicationConfirm";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { ThButtonPrimary, ThButtonSecondary } from "readium-desktop/renderer/common/components/Buttons";


// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
    isReading?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

export class CatalogControls extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
        this.exportPublication = this.exportPublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publicationView, __ } = this.props;

        if (!publicationView) {
            return (<></>);
        }

        return (
            <>
                <ThButtonPrimary
                onClick={this.handleRead}
                svg={ReadBook}
                label={__("catalog.readBook")}
                />
                {this.props.isReading ?
                <ThButtonSecondary
                    disabled
                    svg={DoubleCheckIcon}
                    label={__("publication.markAsRead")}
                />
                : <></>
                }
                <DeletePublicationConfirm
                    trigger={(
                        <ThButtonSecondary
                            svg={TrashIcon}
                            label={__("catalog.deleteBook")}
                        />

                    )}
                    publicationView={this.props.publicationView}
                />

                <ThButtonSecondary
                    onClick={this.exportPublication}
                    svg={SaveAsIcon}
                    label={__("catalog.export")}
                />
            </>
        );
    }

    private exportPublication(e: TMouseEventOnButton) {
        e.preventDefault();

        // this.props.exportPub();
        apiAction("publication/exportPublication", this.props.publicationView).catch((error) => {
            console.error("Error to fetch publication/exportPublication", error);
        });
    }

    private handleRead(e: TMouseEventOnButton) {
        e.preventDefault();
        this.props.openReader();
    }
}

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        openReader: () => {
            dispatch(dialogActions.closeRequest.build());
            dispatch(readerActions.openRequest.build(props.publicationView.identifier));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(CatalogControls));
