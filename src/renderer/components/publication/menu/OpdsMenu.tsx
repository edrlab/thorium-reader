// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as importAction from "readium-desktop/common/redux/actions/import";

import { OpdsPublicationView } from "readium-desktop/common/views/opds";

import { withApi } from "readium-desktop/renderer/components/utils/api";

interface PublicationCardProps {
    publication: OpdsPublicationView;
    displayPublicationInfo?: (data: any) => any;
    verifyImport?: (publication: OpdsPublicationView, downloadSample?: boolean) => void;
}

export class PublicationCard extends React.Component<PublicationCardProps> {
    public constructor(props: any) {
        super(props);

        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const { publication } = this.props;
        return (
            <>
                <a
                    onClick={this.displayPublicationInfo }
                >
                    Fiche livre
                </a>
                { publication.isFree &&
                    <a
                        onClick={ (e) => this.onAddToCatalogClick(e) }
                    >
                        Ajouter à la bibliothèque
                    </a>
                }
                { publication.buyUrl &&
                    <a
                        href={publication.buyUrl}
                    >
                        Aller sur la page d'achat
                    </a>
                }
                { publication.borrowUrl &&
                    <a
                        href={publication.borrowUrl}
                    >
                        Aller sur la page d'emprunt
                    </a>
                }
                { publication.subscribeUrl &&
                    <a
                        href={publication.subscribeUrl}
                    >
                        Aller sur la page d'abonnement
                    </a>
                }
                { publication.hasSample &&
                    <a
                        onClick={ (e) => this.onAddToCatalogClick(e, true) }
                    >
                        Ajouter l'extrait à la bibliothèque
                    </a>
                }
            </>
        );
    }

    private onAddToCatalogClick(e: any, downloadSample?: boolean) {
        e.preventDefault();
        this.props.verifyImport(this.props.publication, downloadSample);
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
        verifyImport: (publication: OpdsPublicationView, downloadSample: boolean) => {
            dispatch(importAction.verifyImport(
                {
                    publication,
                    downloadSample,
                },
            ));
        },
    };
};

export default withApi(
    PublicationCard,
    {
        operations: [],
        mapDispatchToProps,
    },
);
