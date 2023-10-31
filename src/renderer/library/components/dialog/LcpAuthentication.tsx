// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TChangeEventOnInput } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { lcpActions } from "readium-desktop/common/redux/actions";
import { DialogClose, DialogCloseButton, DialogFooter, DialogHeader, DialogTitle, DialogWithRadix, DialogWithRadixContent } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
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
        return <DialogWithRadix defaultOpen={true}>
            <DialogWithRadixContent>
                <DialogHeader>
                    <DialogTitle>
                        {__("library.lcp.password")}
                    </DialogTitle>
                    <div>
                        <DialogCloseButton />
                    </div>
                </DialogHeader>
                <form className={stylesModals.modal_dialog_body}>

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
                        <label htmlFor="passphrase">{__("library.lcp.password")}</label>
                        <input
                            id="passphrase"
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
                <DialogFooter>
                    <DialogClose asChild>
                        <button className={stylesButtons.button_primary}>{__("dialog.cancel")}</button>
                    </DialogClose>
                    <DialogClose asChild>
                        <button type="submit" className={stylesButtons.button_secondary} onClick={() => this.submit()}>{__("opds.addForm.addButton")}</button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </DialogWithRadixContent>
    </DialogWithRadix>;
    }

    private onPasswordChange = (e: TChangeEventOnInput) => {
        this.setState({ password: e.target.value });
    };

    private submit = () => {
        if (!this.state.password) {
            return;
        }
        this.props.unlockPublication(this.props.publicationView.identifier, this.state.password);
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    ...{
        open: state.dialog.type === DialogTypeName.LcpAuthentication,
    }, ...state.dialog.data as DialogType[DialogTypeName.LcpAuthentication],
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        unlockPublication: (id: string, pass: string) => {
            dispatch(lcpActions.unlockPublicationWithPassphrase.build(id, pass));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(LCPAuthentication));
