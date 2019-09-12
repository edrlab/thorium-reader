// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { apiFetch } from "readium-desktop/renderer/apiFetch";
import * as styles from "readium-desktop/renderer/assets/styles/dialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { TMouseEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
}

interface State {
    name: string;
    url: string;
}

class OpdsFeedAddForm extends React.Component<IProps, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            name: undefined,
            url: undefined,
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
                <form>
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
                            onClick={ this.add }
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

    public async add(e: TMouseEvent) {
        e.preventDefault();
        const title = this.state.name;
        const url = this.state.url;
        try {
            await apiFetch("opds/addFeed", { title, url});
        } catch (e) {
            console.error("Error to fetch api opds/findAllFeeds", e);
        }
        this.props.closeDialog();
    }

    private close() {
        this.props.closeDialog();
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

export default connect(undefined, mapDispatchToProps)(withTranslator(OpdsFeedAddForm));
/*
withApi(
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
*/
