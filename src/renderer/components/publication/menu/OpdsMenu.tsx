// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";

import { withApi } from "readium-desktop/renderer/components/utils/api";

interface PublicationCardProps {
    publication: OpdsPublicationView;
    displayPublicationInfo?: any;
    deletePublication?: any;
    importOpdsEntry?: any;
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
        this.addSampleToCatalog = this.addSampleToCatalog.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const { publication } = this.props;
        return (
            <>
                <a
                    onClick={this.displayPublicationInfo }
                    onBlur={this.handleOnBlurMenu}
                >
                    Fiche livre
                </a>
                { publication.isFree &&
                    <a
                        onClick={ this.addToCatalog }
                        onBlur={this.handleOnBlurMenu}
                    >
                        Ajouter à la bibliothèque
                    </a>
                }
                { publication.buyUrl &&
                    <a
                        href={publication.buyUrl}
                        onBlur={this.handleOnBlurMenu}
                    >
                        Aller sur la page d'achat
                    </a>
                }
                { publication.borrowUrl &&
                    <a
                        href={publication.borrowUrl}
                        onBlur={this.handleOnBlurMenu}
                    >
                        Aller sur la page d'emprunt
                    </a>
                }
                { publication.subscribeUrl &&
                    <a
                        href={publication.subscribeUrl}
                        onBlur={this.handleOnBlurMenu}
                    >
                        Aller sur la page d'abonnement
                    </a>
                }
                { publication.hasSample &&
                    <a
                        onClick={ this.addSampleToCatalog }
                        onBlur={this.handleOnBlurMenu}
                    >
                        Ajouter l'extrait à la bibliothèque
                    </a>
                }
            </>
        );
    }

    private addToCatalog(e: any) {
        e.preventDefault();
        this.props.importOpdsEntry(
            {
                url: this.props.publication.url,
            },
        );
    }

    private addSampleToCatalog(e: any) {
        e.preventDefault();
        this.props.importOpdsEntry(
            {
                url: this.props.publication.url,
                downloadSample: true,
            },
        );
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
        displayPublicationInfo: (publication: OpdsPublicationView) => {
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
            {
                moduleId: "publication",
                methodId: "importOpdsEntry",
                callProp: "importOpdsEntry",
            },
        ],
        mapDispatchToProps,
    },
);
