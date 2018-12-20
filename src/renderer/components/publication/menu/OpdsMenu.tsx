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

import { withApi } from "readium-desktop/renderer/components/utils/api";

interface PublicationCardProps {
    publication: PublicationView;
    displayPublicationInfo?: any;
    deletePublication?: any;
    openDeleteDialog?: any;
}

interface PublicationCardState {
    menuOpen: boolean;
}

export class PublicationCard extends React.Component<PublicationCardProps, PublicationCardState> {
    constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        this.handleOnBlurMenu = this.handleOnBlurMenu.bind(this);
        this.addToCatalog = this.addToCatalog.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const authors = this.props.publication.authors.join(", ");

        return (
            <>
                <a
                    onClick={this.displayPublicationInfo }
                    onBlur={this.handleOnBlurMenu}
                >
                    Fiche livre
                </a>
                <a
                    onClick={ this.addToCatalog }
                    onBlur={this.handleOnBlurMenu}
                >
                    Ajouter à la bibliothèque
                </a>
            </>
        );
    }

    private addToCatalog(e: any) {
        e.preventDefault();
        console.log("add to catalog: ", this.props.publication);
    }

    private handleOnBlurMenu(e: any) {
        if (!e.relatedTarget || (e.relatedTarget && e.relatedTarget.parentElement !== e.target.parentElement)) {
            this.setState({ menuOpen: false});
        }
    }

    private displayPublicationInfo(e: any) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, __1: PublicationCardProps) => {
    return {
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfo,
                {
                    publication,
                    isOpds: true,
                },
            ));
        },
    };
};

export default withApi(
    PublicationCard,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "delete",
                callProp: "deletePublication",
            },
        ],
        mapDispatchToProps,
    },
);
