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

import { lcpReadable } from "readium-desktop/utils/publication";

import * as styles from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";

interface CatalogLcpControlsProps {
    publication: PublicationView;
    openReader?: any;
    openDeleteDialog?: any;
    openReturnDialog?: any;
    openRenewDialog?: any;
}

export class CatalogLcpControls extends React.Component<CatalogLcpControlsProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.handleRead = this.handleRead.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { publication } = this.props;
        console.log(publication);

        if (!publication) {
            return (<></>);
        }

        return (
            <>
                { lcpReadable(publication) ?
                    <a  onClick={this.handleRead} className={styles.lire}>Lire</a>
                :
                    <p>Impossible de lire ce document. Veuillez renouveler la liscence.</p>
                }
                <ul className={styles.liens}>
                    { publication.lcp.rights.end && <>
                        <li>
                            <a onClick={ this.props.openRenewDialog }>
                                <SVG svg={DeleteIcon} />
                                Renew
                            </a>
                        </li>
                        <li>
                            <a onClick={ this.props.openReturnDialog }>
                                <SVG svg={DeleteIcon} />
                                Return
                            </a>
                        </li>
                    </>}
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

const mapDispatchToProps = (dispatch: any, props: CatalogLcpControlsProps) => {
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
        openRenewDialog: () => {
            dispatch(dialogActions.open(
                DialogType.LsdRenewConfirm,
                {
                    publication: props.publication,
                },
            ));
        },
        openReturnDialog: () => {
            dispatch(dialogActions.open(
                DialogType.LsdReturnConfirm,
                {
                    publication: props.publication,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(CatalogLcpControls);
