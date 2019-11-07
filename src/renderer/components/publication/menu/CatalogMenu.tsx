// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";

import PublicationExportButton from "./PublicationExportButton";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    publication: PublicationView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    menuOpen: boolean;
}

class CatalogMenu extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        this.deletePublication = this.deletePublication.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <button role="menuitem"
                    onClick={this.displayPublicationInfo}
                >
                    {__("catalog.bookInfo")}
                </button>
                <button role="menuitem"
                    onClick={this.deletePublication}
                >
                    {__("catalog.delete")}
                </button>
                <PublicationExportButton
                    publication={this.props.publication}
                />
            </>
        );
    }

    private deletePublication() {
        this.props.openDeleteDialog();
    }

    private displayPublicationInfo() {
        this.props.displayPublicationInfo();
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.open("publication-info",
                {
                    publicationIdentifier: props.publication.identifier,
                    opdsPublication: undefined,
                },
            ));
        },
        openDeleteDialog: () => {
            dispatch(dialogActions.open("delete-publication-confirm",
                {
                    publication: props.publication,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(CatalogMenu));
