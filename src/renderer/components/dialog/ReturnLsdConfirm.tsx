// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as lcpActions from "readium-desktop/common/redux/actions/lcp";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { PublicationView } from "readium-desktop/common/views/publication";

interface LsdReturnConfirmProps extends TranslatorProps {
    publication?: PublicationView;
    returnPublication?: any;
    closeDialog?: any;
}

export class LsdReturnConfirm extends React.Component<LsdReturnConfirmProps, undefined> {

    public constructor(props: any) {
        super(props);

        this.remove = this.remove.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.publication) {
            return <></>;
        }

        return (
            <div>
                <p>Êtes vous sûr de vouloir supprimer ce livre : {this.props.publication.title} ?</p>
                <div>
                    <button onClick={this.remove}>Oui</button>
                    <button onClick={this.props.closeDialog}>Non</button>
                </div>
            </div>
        );
    }

    public remove(e: any) {
        e.preventDefault();
        this.props.returnPublication({
            publication: {
                identifier: this.props.publication.identifier,
            },
        });
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: any, props: any) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default withApi(
    LsdReturnConfirm,
    {
        operations: [
            {
                moduleId: "lcp",
                methodId: "returnPublication",
                callProp: "returnPublication",
            },
        ],
        mapDispatchToProps,
    },
);
