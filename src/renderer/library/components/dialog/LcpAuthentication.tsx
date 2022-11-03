// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TChangeEventOnInput } from "readium-desktop/typings/react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    password: string | undefined;
}

export class LCPAuthentication extends React.Component<IProps, IState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.focusRef = React.createRef<HTMLInputElement>();

        this.state = {
            password: undefined,
        };
    }

    public componentDidMount() {
        if (this.focusRef?.current) {
            this.focusRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open || !this.props.publicationView) {
            return <></>;
        }

        const { __ } = this.props;
        return (
            <Dialog
                title={__("library.lcp.password")}
                onSubmitButton={this.submit}
                submitButtonTitle={__("library.lcp.submit")}
                submitButtonDisabled={!this.state.password}
                shouldOkRefEnabled={false}
            >
                <div className={stylesGlobal.w_50}>
                    <p><strong>{__("library.lcp.sentence")}</strong></p>
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
                    <div className={stylesInputs.form_group}>
                        <label>{__("library.lcp.password")}</label>
                        <input
                            aria-label={__("library.lcp.password")}
                            type="password"
                            onChange={this.onPasswordChange}
                            placeholder={__("library.lcp.password")}
                            ref={this.focusRef}
                        />
                    </div>
                    {
                        this.props.urlHint?.href
                            ?
                            <a href={this.props.urlHint.href}>
                                {this.props.urlHint.title || __("library.lcp.urlHint")}
                            </a>
                            : <></>
                    }
                </div>
            </Dialog>
        );
    }

    private onPasswordChange = (e: TChangeEventOnInput) => {
        this.setState({ password: e.target.value });
    };

    private submit = () => {
        apiAction("lcp/unlockPublicationWithPassphrase",
            this.state.password,
            this.props.publicationView.identifier,
        ).catch((error) => {
            console.error("Error lcp/unlockPublicationWithPassphrase", error);
        });
    };

}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LcpAuthentication,
    }, ...state.dialog.data as DialogType[DialogTypeName.LcpAuthentication],
});

export default connect(mapStateToProps)(withTranslator(LCPAuthentication));
