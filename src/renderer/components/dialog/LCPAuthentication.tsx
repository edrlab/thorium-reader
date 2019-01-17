// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { ActionType, sendPassphrase } from "readium-desktop/common/redux/actions/lcp";

interface DeleteOpdsFeedConfirmProps extends TranslatorProps {
    publication: any;
    hint: string;
    checkPassphrase?: any;
    closeDialog?: any;
    sendLCPError?: any;
}

export class LCPAuthentication extends React.Component<DeleteOpdsFeedConfirmProps, undefined> {

    private passphraseRef: any;

    public constructor(props: any) {
        super(props);

        this.passphraseRef = React.createRef();

        this.submite = this.submite.bind(this);
        this.close = this.close.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.publication) {
            return <></>;
        }

        return (
            <div>
                <p>Veuillez entrer le mot de passe pour decrypter le fichier : { this.props.publication.title } ?</p>
                <p>Indice : { this.props.hint }</p>
                <input ref={this.passphraseRef} type="text" />
                <div>
                    <button onClick={ this.submite }>Valider</button>
                    <button onClick={ this.close }>Fermer</button>
                </div>
            </div>
        );
    }

    private submite(e: any) {
        e.preventDefault();

        this.props.checkPassphrase(this.props.publication, this.passphraseRef.current.value);
        this.props.closeDialog();
    }

    private close() {
        this.props.sendLCPError();
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: any) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
        checkPassphrase: (publication: any, passphrase: string) => {
            dispatch(
                sendPassphrase(publication, passphrase),
            );
        },
        sendLCPError: () => {
            dispatch({
                type: ActionType.UserKeyCheckError,
                error: true,
            });
        },
    };
};

export default withApi(
    LCPAuthentication,
    {
        operations: [],
        mapDispatchToProps,
    },
);
