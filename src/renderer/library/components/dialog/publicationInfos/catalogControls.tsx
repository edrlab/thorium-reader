// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TMouseEventOnButton } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
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
        this.deletePublication = this.deletePublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publicationView, __ } = this.props;

        if (!publicationView) {
            return (<></>);
        }

        return (
            <>
                <button onClick={this.handleRead} className={styles.button_primary}>
                    {__("catalog.readBook")}
                </button>
                <button onClick={this.deletePublication} className={styles.button_transparency}>
                    <SVG svg={DeleteIcon} ariaHidden />
                    {__("catalog.deleteBook")}
                </button>
            </>
        );
    }

    private deletePublication(e: TMouseEventOnButton) {
        e.preventDefault();
        this.props.openDeleteDialog();
    }

    private handleRead(e: TMouseEventOnButton) {
        e.preventDefault();

        this.props.openReader();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        openReader: () => {
            dispatch(dialogActions.closeRequest.build());
            dispatch(readerActions.openRequest.build(props.publicationView.identifier));
        },
        openDeleteDialog: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.DeletePublicationConfirm,
                {
                    publicationView: props.publicationView,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogControls));
