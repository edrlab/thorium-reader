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
import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationView: PublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
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
                <button onClick={this.handleRead} className={styles.lire}>{__("catalog.readBook")}</button>
                <ul className={styles.liens}>
                    <li>
                        <button onClick={this.deletePublication}>
                            <SVG svg={DeleteIcon} ariaHidden />
                            {__("catalog.deleteBook")}
                        </button>
                    </li>
                </ul>
            </>
        );
    }

    private deletePublication(e: any) {
        e.preventDefault();
        this.props.openDeleteDialog();
    }

    private handleRead(e: any) {
        e.preventDefault();

        this.props.openReader();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        openReader: () => {
            dispatch(readerActions.openRequest.build(props.publicationView.identifier));
        },
        openDeleteDialog: () => {
            dispatch(dialogActions.openRequest.build("delete-publication-confirm",
                {
                    publicationView: props.publicationView,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogControls));
