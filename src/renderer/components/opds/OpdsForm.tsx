// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Styles } from "readium-desktop/renderer/components/styles";

import { lazyInject } from "readium-desktop/renderer/di";
import { Store } from "redux";

import { RootState } from "readium-desktop/renderer/redux/states";

import { opdsActions } from "readium-desktop/common/redux/actions";

import { OPDS } from "readium-desktop/common/models/opds";

import * as AppStyle from "readium-desktop/renderer/assets/styles/app.css";

import FlatButton from "material-ui/FlatButton";

import * as uuid from "uuid";

import { Translator } from "readium-desktop/common/services/translator";

import * as classNames from "classnames";

interface IOpdsFormProps {
    closeDialog: any;
    closeFunction?: any;
    opds?: OPDS;
    updateDisplay?: any;
}

interface IOpdsFormState {
    opdsUrl: string;
    opdsName: string;
    formError: boolean;
}

export default class OpdsForm extends React.Component<IOpdsFormProps, IOpdsFormState> {
    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor(props: IOpdsFormProps) {
        super(props);
        this.state = {
            opdsUrl: "",
            opdsName: "",
            formError: false,
        };

        this.handleOpdsNameChange = this.handleOpdsNameChange.bind(this);
        this.handleOpdsUrlChange = this.handleOpdsUrlChange.bind(this);
    }

    public componentDidMount() {
        if (this.props.opds) {
            this.setState({
                opdsUrl: this.props.opds.url,
                opdsName: this.props.opds.name,
            });
        }
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);
        const messageError = (<p style={Styles.OpdsList.errorMessage}>{__("opds.formError")}</p>);
        let currentMessageError = (<div></div>);
        if (this.state.formError) {
            currentMessageError = messageError;
        }
        return (
            <div>
                {currentMessageError}
                {this.props.opds ? (
                    <p>{__("opds.addForm.updateSentence")}</p>
                ) : (
                    <p>{__("opds.addForm.addSentence")}</p>
                )}
                <div style={Styles.OpdsList.formElement}>
                    <label style={Styles.OpdsList.formElementLabel} >{__("opds.addForm.name")}</label>
                        <input
                            type="text"
                            style={Styles.OpdsList.textZone}
                            value={this.state.opdsName}
                            onChange={this.handleOpdsNameChange}/><br/>
                </div>
                <div style={Styles.OpdsList.formElement}>
                    <label style={Styles.OpdsList.formElementLabel}>{__("opds.addForm.url")}</label>
                        <input
                            type="text"
                            style={Styles.OpdsList.textZone}
                            value={this.state.opdsUrl}
                            onChange={this.handleOpdsUrlChange}/><br/>
                </div>
                {this.props.opds ? (
                <div>
                    <button
                        className={classNames(AppStyle.commonButton, AppStyle.primary)}
                        onClick={() => {
                            this.store.dispatch(opdsActions.remove(this.props.opds));
                            this.props.closeDialog();
                            this.props.closeFunction();
                        }}
                    >
                        {__("opds.addForm.delete")}
                    </button>
                    <button
                        className={classNames(AppStyle.commonButton, AppStyle.primary)}
                        onClick={() => {
                            if (this.isFormValid()) {
                                const newOpds: OPDS = {
                                    identifier: this.props.opds.identifier,
                                    name: this.state.opdsName,
                                    url: this.state.opdsUrl,
                                };
                                this.props.updateDisplay(newOpds);
                                this.store.dispatch(opdsActions.update(newOpds));
                                this.props.closeDialog();
                            } else {
                                this.setState({formError: true});
                            }
                        }}
                    >
                        {__("opds.addForm.update")}
                    </button>
                </div>
                ) : (
                    <button
                        className={classNames(AppStyle.commonButton, AppStyle.primary)}
                        onClick={() => {
                            if (this.isFormValid()) {
                                const newOpds: OPDS = {
                                    identifier: uuid.v4(),
                                    name: this.state.opdsName,
                                    url: this.state.opdsUrl,
                                };
                                this.store.dispatch(opdsActions.add(newOpds));
                                this.props.closeDialog();
                            } else {
                                this.setState({formError: true});
                            }
                        }}
                    >
                        {__("opds.addForm.addButton")}
                    </button>
                )}
            </div>
        );
    }

    private handleOpdsUrlChange(event: any) {
        this.setState({opdsUrl: event.target.value});
    }

    private handleOpdsNameChange(event: any) {
        this.setState({opdsName: event.target.value});
    }

    private isFormValid(): boolean {
        if (this.state.opdsName !== "" && this.state.opdsUrl !== ""
            && this.state.opdsName !== undefined && this.state.opdsUrl !== undefined) {
            return true;
        }
        return false;
    }
}
