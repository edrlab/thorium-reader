// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";

interface Props extends TranslatorProps {
    url?: any;
    addFeed?: any;
    closeDialog?: any;
}

interface State {
    name: string;
    url: string;
}

export class OpdsFeedAddForm extends React.Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            name: undefined,
            url: props.url,
        };

        this.add = this.add.bind(this);
        this.close = this.close.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const {__} = this.props;
        const { name, url } = this.state;
        return (
            <div>
                <h2>{__("opds.addMenu")}</h2>
                <form onSubmit={ this.add }>
                    <div className={styles.field}>
                        <label>{__("opds.addForm.name")}</label>
                        <input
                            onChange={(e) => this.onFieldChange("name", e.target.value)}
                            type="text"
                            aria-label={__("opds.addForm.name")}
                            placeholder={__("opds.addForm.namePlaceholder")}
                            defaultValue={name}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>{__("opds.addForm.url")}</label>
                        <input
                            onChange={(e) => this.onFieldChange("url", e.target.value)}
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
                        />
                        <button onClick={this.close}>{__("opds.back")}</button>
                    </div>
                </form>
            </div>
        );
    }

    public onFieldChange(name: string, value: any) {
        const change: any = {[name]: value};
        this.setState(change);
    }

    public add(e: any) {
        e.preventDefault();
        const title = this.state.name;
        const url = this.state.url;
        this.props.addFeed({ title, url});
        this.props.closeDialog();
    }

    private close() {
        this.props.closeDialog();
    }
}

const mapDispatchToProps = (dispatch: any, ownProps: any) => {
    return {
        closeDialog: (data: any) => {
            dispatch(
                dialogActions.close(),
            );
        },
    };
};

export default withApi(
    OpdsFeedAddForm,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "addFeed",
                callProp: "addFeed",
            },
        ],
        mapDispatchToProps,
    },
);
