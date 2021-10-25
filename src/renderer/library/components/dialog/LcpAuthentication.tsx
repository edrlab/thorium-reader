// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TChangeEventOnInput, TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
            <Dialog
                open={true}
                close={closeDialog}
                id={styles.lcp_dialog}
                title={__("library.lcp.sentence")}
            >
                <div>
                    {
                        typeof this.props.message === "string" ?
                            <p>
                                <span>{this.props.message}</span>
                            </p>
                            : <></>
                    }
                    <p>
                        <span>{__("library.lcp.hint", { hint: this.props.hint })}</span>
                    </p>
                    {
                        this.props.urlHint?.href
                            ?
                            <a href={this.props.urlHint.href}>
                                {this.props.urlHint.title || __("library.lcp.urlHint")}
                            </a>
                            : <></>
                    }
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

    private onPasswordChange(e: TChangeEventOnInput) {
        this.setState({ password: e.target.value });
    }

    private submit(e: TFormEvent) {
        e.preventDefault();

        apiAction("lcp/unlockPublicationWithPassphrase",
            this.state.password,
            this.props.publicationView.identifier,
        ).catch((error) => {
            console.error("Error lcp/unlockPublicationWithPassphrase", error);
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

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LcpAuthentication,
    }, ...state.dialog.data as DialogType[DialogTypeName.LcpAuthentication],
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LCPAuthentication));
