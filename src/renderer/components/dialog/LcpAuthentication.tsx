// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TChangeEvent, TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

import Dialog from "./Dialog";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

interface IState {
    password: string | undefined;
}

export class LCPAuthentication extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            password: undefined,
        };

        this.submit = this.submit.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.publicationView) {
            return <></>;
        }

        const { __, closeDialog } = this.props;
        return (
            <Dialog open={true} close={closeDialog} id={styles.lcp_dialog}>
                <div>
                    {
                        this.props.message &&
                        <p>
                            <span>{this.props.message}</span>
                        </p>
                    }
                    <p>
                        {__("library.lcp.sentence")}
                        <span>{__("library.lcp.hint", { hint: this.props.hint })}</span>
                    </p>
                    <form onSubmit={this.submit}>
                        <input
                            type="password"
                            onChange={this.onPasswordChange}
                            placeholder={__("library.lcp.password")}
                        />
                        <div>
                            <input
                                type="submit"
                                value={__("library.lcp.submit")}
                                disabled={!this.state.password}
                            />
                            <button
                                onClick={(e) => { e.preventDefault(); closeDialog(); }}
                            >{__("library.lcp.cancel")}</button>
                        </div>
                    </form>
                </div>
            </Dialog>
        );
    }

    private onPasswordChange(e: TChangeEvent) {
        this.setState({ password: e.target.value });
    }

    private submit(e: TFormEvent) {
        e.preventDefault();

        apiAction("lcp/unlockPublicationWithPassphrase",
            this.state.password,
            this.props.publicationView,
        ).catch((error) => {
            console.error(`Error lcp/unlockPublicationWithPassphrase`, error);
        });

        this.props.closeDialog();
    }

}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.closeRequest.build(),
            );
        },
    };
};

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === "lcp-authentication",
    }, ...state.dialog.data as DialogType["lcp-authentication"],
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LCPAuthentication));
