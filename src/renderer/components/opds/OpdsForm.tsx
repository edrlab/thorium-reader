import * as React from "react";

import { Styles } from "readium-desktop/renderer/components/styles";

import { lazyInject } from "readium-desktop/renderer/di";
import { Store } from "redux";

import { RendererState } from "readium-desktop/renderer/reducers";

import * as opdsActions from "readium-desktop/actions/opds";

import { OPDS } from "readium-desktop/models/opds";

import FlatButton from "material-ui/FlatButton";

import * as uuid from "uuid";

import { Translator }   from "readium-desktop/i18n/translator";

interface IOpdsFormProps {
    closeDialog: Function;
    closeFunction?: Function;
    opds?: OPDS;
    updateDisplay?: Function;
}

interface IOpdsFormState {
    opdsUrl: string;
    opdsName: string;
    formError: boolean;
}

export default class OpdsForm extends React.Component<IOpdsFormProps, IOpdsFormState> {
    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor() {
        super();
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
        const __ = this.translator.translate;
        let messageError = (<p style={Styles.OpdsList.errorMessage}>Veuillez remplir tous les champs</p>);
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
                    <label style={Styles.OpdsList.formElementLabel} >Nom :</label>
                        <input
                            type="text"
                            style={Styles.OpdsList.textZone}
                            value={this.state.opdsName}
                            onChange={this.handleOpdsNameChange}/><br/>
                </div>
                <div style={Styles.OpdsList.formElement}>
                    <label style={Styles.OpdsList.formElementLabel}>Url :</label>
                        <input
                            type="text"
                            style={Styles.OpdsList.textZone}
                            value={this.state.opdsUrl}
                            onChange={this.handleOpdsUrlChange}/><br/>
                </div>
                {this.props.opds ? (
                <div>
                    <FlatButton
                        label={__("opds.addForm.delete")}
                        primary={true}
                        onTouchTap={() => {
                            this.store.dispatch(opdsActions.remove(this.props.opds));
                            this.props.closeDialog();
                            this.props.closeFunction();
                        }}
                    />
                    <FlatButton
                        label={__("opds.addForm.update")}
                        primary={true}
                        onTouchTap={() => {
                            if (this.isFormValid()) {
                                let newOpds: OPDS = {
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
                    />
                </div>
                ) : (
                    <FlatButton
                        label={__("opds.addForm.addButton")}
                        primary={true}
                        onTouchTap={() => {
                            if (this.isFormValid()) {
                                let newOpds: OPDS = {
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
                    />
                )}
            </div>
        );
    }

    private handleOpdsUrlChange (event: any) {
        this.setState({opdsUrl: event.target.value});
    }

    private handleOpdsNameChange (event: any) {
        this.setState({opdsName: event.target.value});
    }

    private isFormValid (): boolean {
        if (this.state.opdsName !== "" && this.state.opdsUrl !== ""
            && this.state.opdsName !== undefined && this.state.opdsUrl !== undefined) {
            return true;
        }
        return false;
    }
}
