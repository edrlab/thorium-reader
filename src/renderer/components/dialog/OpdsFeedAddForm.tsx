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

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

interface State {
    name: string;
    url: string;
    opdsFeedList: {
        [name: string]: string;
    } | undefined;
    selectValue: string;
}

class OpdsFeedAddForm extends React.Component<IProps, State> {
    private defaultSelectValue = "undefined";
    private opdsFeedListServerUrl = "http://thorium-opds.edrlab.org/";

    constructor(props: IProps) {
        super(props);

        this.state = {
            name: "",
            url: "",
            opdsFeedList: undefined,
            selectValue: this.defaultSelectValue,
        };

        this.add = this.add.bind(this);
        this.close = this.close.bind(this);
        this.onSelectOpdsFeedChange = this.onSelectOpdsFeedChange.bind(this);
    }

    public async componentDidMount() {
        try {
            const response = await fetch(this.opdsFeedListServerUrl);
            const json = await response.json();
            this.setState({ opdsFeedList: json });

        } catch {
            // ignore
        }
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
                        <select
                            id="opdsFeedList"
                            onChange={this.onSelectOpdsFeedChange}
                            value={this.state.selectValue}
                            disabled={this.state.opdsFeedList === undefined}
                        >
                            <option key={"opdsFeedList"} value={this.defaultSelectValue}>Custom choice</option>
                            {this.setOpdsFeedInSelectOption("opdsFeedList")}
                        </select>
                        <div className={styles.field}>
                            <label>{__("opds.addForm.name")}</label>
                            <input
                                onChange={(e) => this.setState({
                                    name: e.target.value,
                                })}
                                onKeyUp={() => this.setState({
                                    selectValue: this.defaultSelectValue,
                                })}
                                type="text"
                                aria-label={__("opds.addForm.name")}
                                placeholder={__("opds.addForm.namePlaceholder")}
                                value={name}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>{__("opds.addForm.url")}</label>
                            <input
                                onChange={(e) => this.setState({
                                    url: e.target.value,
                                })}
                                onKeyUp={() => this.setState({
                                    selectValue: this.defaultSelectValue,
                                })}
                                type="text"
                                aria-label={__("opds.addForm.url")}
                                placeholder={__("opds.addForm.urlPlaceholder")}
                                value={url}
                            />
                        </div>
                        <div>
                            <input
                                disabled={!name || !url}
                                type="submit"
                                value={__("opds.addForm.addButton")}
                                onClick={this.add}
                            />
                            <button onClick={this.close}>{__("opds.back")}</button>
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

    private close() {
        this.props.closeDialog();
    }

    private setOpdsFeedInSelectOption(reactKey: string) {
        if (this.state.opdsFeedList) {
            return Object.entries(this.state.opdsFeedList)
                .map(([name, url], idx) =>
                    <option key={`${reactKey}-${idx}`} value={url}>{name}</option>);
        }
        return [];
    }

    private onSelectOpdsFeedChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const url = e.target.value;
        const name = Object.keys(this.state.opdsFeedList)
            .find((nameFind) => this.state.opdsFeedList[nameFind] === url);
        if (name) {
            this.setState({
                name,
                url,
                selectValue: url,
            });
        } else {
            this.setState({
                name: "",
                url: "",
                selectValue: this.defaultSelectValue,
            });
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        closeDialog: () => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

const mapStateToProps = (state: RootState) => ({
    open: state.dialog.type === "opds-feed-add-form",
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(OpdsFeedAddForm));
