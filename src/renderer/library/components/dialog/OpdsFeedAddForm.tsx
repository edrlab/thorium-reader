// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.css";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

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
    name: string | undefined;
    url: string | undefined;
}

class OpdsFeedAddForm extends React.Component<IProps, IState> {
    private focusRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.focusRef = React.createRef<HTMLInputElement>();

        this.state = {
            name: undefined,
            url: undefined,
        };

    }

    public componentDidMount() {
        if (this.focusRef?.current) {
            this.focusRef.current.focus();
        }
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open) {
            return (<></>);
        }

        const { __ } = this.props;
        const { name, url } = this.state;
        return (
            <Dialog
                // close={closeDialog}
                id={stylesModals.opds_form_dialog}
                title={__("opds.addMenu")}
                onSubmitButton={this.add}
                submitButtonTitle={
                    __("opds.addForm.addButton")
                }
                submitButtonDisabled={!(this.state.name && this.state.url)}
            >
                    <div className={classNames(stylesModals.modal_dialog_body, stylesModals.modal_dialog_body_centered)}>
                        <div className={stylesGlobal.w_50}>
                            <div className={stylesInputs.form_group}>
                                <label>{__("opds.addForm.name")}</label>
                                <input
                                    onChange={(e) => this.setState({
                                        name: e.target.value,
                                    })}
                                    type="text"
                                    aria-label={__("opds.addForm.name")}
                                    placeholder={__("opds.addForm.namePlaceholder")}
                                    defaultValue={name}
                                    ref={this.focusRef}
                                />
                            </div>
                            <div className={stylesInputs.form_group}>
                                <label>{__("opds.addForm.url")}</label>
                                <input
                                    onChange={(e) => this.setState({
                                        url: e.target.value,
                                    })}
                                    type="text"
                                    aria-label={__("opds.addForm.url")}
                                    placeholder={__("opds.addForm.urlPlaceholder")}
                                    defaultValue={url}
                                />
                            </div>
                        </div>
                    </div>

            </Dialog>
        );
    }

    public add = () => {
        const title = this.state.name;
        const url = this.state.url;
        apiAction("opds/addFeed", { title, url }).catch((err) => {
            console.error("Error to fetch api opds/addFeed", err);
        });
    };

}
const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => ({
    open: state.dialog.type === DialogTypeName.OpdsFeedAddForm,
});

export default connect(mapStateToProps)(withTranslator(OpdsFeedAddForm));
