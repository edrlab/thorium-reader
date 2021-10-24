// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import classNames from "classnames";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as DoneIcon from "readium-desktop/renderer/assets/icons/done.svg";
import Dialog from "readium-desktop/renderer/common/components/dialog/Dialog";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TMouseEventOnInput } from "readium-desktop/typings/react";
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
    name: string | undefined;
    url: string | undefined;
}

class OpdsFeedAddForm extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            name: undefined,
            url: undefined,
        };

        this.add = this.add.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.open) {
            return (<></>);
        }

        const { __, closeDialog } = this.props;
        const { name, url } = this.state;
        return (
            <Dialog
                open={true}
                close={closeDialog} 
                id={styles.opds_form_dialog}
                title={__("opds.addMenu")}
            >
                <form className={styles.modal_dialog_form_wrapper}>
                    <div className={classNames(styles.modal_dialog_body, styles.modal_dialog_body_centered)}>
                        <div className={styles.w_50}>
                            <div className={styles.form_group}>
                                <label>{__("opds.addForm.name")}</label>
                                <input
                                    onChange={(e) => this.setState({
                                        name: e.target.value,
                                    })}
                                    type="text"
                                    aria-label={__("opds.addForm.name")}
                                    placeholder={__("opds.addForm.namePlaceholder")}
                                    defaultValue={name}
                                />
                            </div>
                            <div className={styles.form_group}>
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
                    <div className={styles.modal_dialog_footer}>
                        <button
                            onClick={closeDialog}
                            className={styles.button_transparency}
                        >
                            {__("opds.back")}
                        </button>
                        <button
                            disabled={!name || !url}
                            type="submit"
                            onClick={this.add}
                            className={styles.button_secondary}
                        >
                            <SVG svg={DoneIcon} />
                            {__("opds.addForm.addButton")}
                        </button>
                    </div>
                </form>
            </Dialog>
        );
    }

    public add(e: TMouseEventOnInput) {
        e.preventDefault();
        const title = this.state.name;
        const url = this.state.url;
        apiAction("opds/addFeed", { title, url }).catch((err) => {
            console.error("Error to fetch api opds/addFeed", err);
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
    open: state.dialog.type === DialogTypeName.OpdsFeedAddForm,
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsFeedAddForm));
