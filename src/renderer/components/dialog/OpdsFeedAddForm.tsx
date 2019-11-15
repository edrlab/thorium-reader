// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { TMouseEvent } from "readium-desktop/typings/react";
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
            <Dialog open={true} close={closeDialog} id={styles.opds_form_dialog}>
                <div>
                    <h2>{__("opds.addMenu")}</h2>
                    <form>
                        <div className={styles.field}>
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
                        <div className={styles.field}>
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
                        <div>
                            <input
                                disabled={!name || !url}
                                type="submit"
                                value={__("opds.addForm.addButton")}
                                onClick={this.add}
                            />
                            <button onClick={closeDialog}>{__("opds.back")}</button>
                        </div>
                    </form>
                </div>
            </Dialog>
        );
    }

    public add(e: TMouseEvent) {
        e.preventDefault();
        const title = this.state.name;
        const url = this.state.url;
        apiAction("opds/addFeed", { title, url }).catch((err) => {
            console.error("Error to fetch api opds/findAllFeeds", err);
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
    open: state.dialog.type === "opds-feed-add-form",
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsFeedAddForm));
