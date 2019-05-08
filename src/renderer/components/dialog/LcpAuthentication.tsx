// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

interface Props extends TranslatorProps {
    publication: any;
    hint: string;
    unlockPublicationWithPassphrase?: any;
    closeDialog?: any;
    sendLCPError?: any;
}

interface State {
    password: string;
}

export class LCPAuthentication extends React.Component<Props, State> {
    public constructor(props: any) {
        super(props);

        this.state = {
            password: undefined,
        };

        this.submite = this.submite.bind(this);
        this.close = this.close.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.publication) {
            return <></>;
        }

        const { __ } = this.props;

        return (
            <div>
                <p>
                    { __("library.lcp.sentence") }
                    <span>{ __("library.lcp.hint", { hint: this.props.hint }) }</span>
                </p>
                <form onSubmit={ this.submite }>
                    <input type="password" onChange={this.onPasswordChange} placeholder={__("library.lcp.password")}/>
                    <div>
                        <input
                            type="submit"
                            value={ __("library.lcp.submit") }
                            disabled={!this.state.password && true}
                        />
                        <button onClick={ this.close }>{ __("library.lcp.cancel") }</button>
                    </div>
                </form>
            </div>
        );
    }

    private onPasswordChange(e: any) {
        this.setState({ password: e.target.value});
    }

    private submite(e: any) {
        e.preventDefault();

        this.props.unlockPublicationWithPassphrase({
            publication: this.props.publication,
            passphrase: this.state.password,
        });
        this.props.closeDialog();
    }

    private close() {
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
        // sendLCPError: () => {
        //     dispatch({
        //         type: ActionType.UserKeyCheckError,
        //         error: true,
        //     });
        // },
    };
};

export default withApi(
    withTranslator(LCPAuthentication),
    {
        operations: [
            {
                moduleId: "lcp",
                methodId: "unlockPublicationWithPassphrase",
                callProp: "unlockPublicationWithPassphrase",
            },
        ],
        mapDispatchToProps,
    },
);
