// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import * as DeleteIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { readerActions } from "readium-desktop/common/redux/actions";

import { PublicationView } from "readium-desktop/common/views/publication";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface CatalogControlsProps {
    publication: PublicationView;
    openReader?: any;
    openDeleteDialog?: any;
}

export class CatalogControls extends React.Component<CatalogControlsProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publication } = this.props;

        if (!publication) {
            return (<></>);
        }

        return (
            <>
                <a  onClick={this.handleRead} className={styles.lire}>Lire</a>
                <ul className={styles.liens}>
                    <li>
                        <a onClick={ this.deletePublication }>
                            <SVG svg={DeleteIcon} />
                            Supprimer de la bibliothèque
                        </a>
                    </li>
                </ul>
            </>
        );
    }

    private deletePublication(e: any) {
        e.preventDefault();
        this.props.openDeleteDialog(this.props.publication);
    }

    private handleRead(e: any) {
        e.preventDefault();

        this.props.openReader(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, __: CatalogControlsProps) => {
    return {
        openReader: (publication: PublicationView) => {
            dispatch({
                type: readerActions.ActionType.OpenRequest,
                payload: {
                    publication: {
                        identifier: publication.identifier,
                    },
                },
            });
        },
        openDeleteDialog: (publication: string) => {
            dispatch(dialogActions.open(
                DialogType.DeletePublicationConfirm,
                {
                    publication,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(CatalogControls);
