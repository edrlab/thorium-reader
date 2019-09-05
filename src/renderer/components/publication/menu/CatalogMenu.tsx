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
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/hoc/translator";

interface Props extends TranslatorProps {
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

        this.deletePublication = this.deletePublication.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo }
                >
                    { __("catalog.bookInfo")}
                </button>
                <button role="menuitem"
                    onClick={ this.deletePublication }
                >
                    { __("catalog.delete")}
                </button>
                <PublicationExportButton
                    onClick={ this.props.toggleMenu }
                    publication={ this.props.publication }
                />
            </>
        );
    }

    private deletePublication() {
        this.props.openDeleteDialog(this.props.publication);
    }

    private displayPublicationInfo() {
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

export default withTranslator(connect(null, mapDispatchToProps)(CatalogMenu)) as any;
