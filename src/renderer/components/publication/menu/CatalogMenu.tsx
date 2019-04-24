// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { PublicationView } from "readium-desktop/common/views/publication";

import PublicationExportButton from "./PublicationExportButton";

import { connect } from "react-redux";

interface Props {
    publication: PublicationView;
    displayPublicationInfo?: any;
    openDeleteDialog?: any;
    toggleMenu?: () => void;
}

interface State {
    menuOpen: boolean;
}

class CatalogMenu extends React.Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        this.handleOnBlurMenu = this.handleOnBlurMenu.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        return (
            <>
                <a
                    onClick={this.displayPublicationInfo }
                    onBlur={this.handleOnBlurMenu}
                >
                    Fiche livre
                </a>
                <a
                    onClick={ this.deletePublication }
                    onBlur={this.handleOnBlurMenu}
                >
                    Supprimer définitivement
                </a>
                <PublicationExportButton
                    onClick={ this.props.toggleMenu }
                    publication={ this.props.publication }
                />
            </>
        );
    }

    private deletePublication(e: any) {
        e.preventDefault();
        this.props.openDeleteDialog(this.props.publication);
    }

    private handleOnBlurMenu(e: any) {
        if (!e.relatedTarget || (e.relatedTarget && e.relatedTarget.parentElement !== e.target.parentElement)) {
            this.props.toggleMenu();
        }
    }

    private displayPublicationInfo(e: any) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfo,
                {
                    publicationIdentifier: publication.identifier,
                },
            ));
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

export default connect(null, mapDispatchToProps)(CatalogMenu) as any;
