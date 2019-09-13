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
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
    publication: PublicationView;
    hint: string;
}

interface IState {
    password: string | undefined;
}

export class LCPAuthentication extends React.Component<IProps, IState> {
    public constructor(props: IProps) {
        super(props);

        this.state = {
            password: undefined,
        };

        this.submit = this.submit.bind(this);
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
                <form onSubmit={ this.submit }>
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

    private onPasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ password: e.target.value});
    }

    private submit(e: TFormEvent) {
        e.preventDefault();

        apiFetch("lcp/unlockPublicationWithPassphrase", {
            publication: this.props.publication,
            passphrase: this.state.password,
        }).catch((error) => {
            console.error(`Error to fetch opds/deleteFeed`, error);
        });
        this.props.closeDialog();
    }

    private close() {
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
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

export default connect(undefined, mapDispatchToProps)(withTranslator(LCPAuthentication));
/*withApi(
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
);*/
