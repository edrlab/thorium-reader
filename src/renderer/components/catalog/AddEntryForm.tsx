// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as AddIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";
import * as RemoveIcon from "readium-desktop/renderer/assets/icons/baseline-remove-24px.svg";

//import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import { withApi } from "readium-desktop/renderer/components/utils/api";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import SearchContainer from "./SearchTag";
import { TranslatorProps, withTranslator } from "../utils/translator";


interface AddEntryFormState {
    tag: string;
    tabTags: string[];
}

export interface AddEntryFormProps extends TranslatorProps {
    addEntry?: (entry: any) => void;
    getentry?: CatalogEntryView[];
    tags?: string[];
}

export class AddEntryForm extends React.Component<AddEntryFormProps, AddEntryFormState> {
    private selectRef: any;
    public constructor(props: any) {
        super(props);

        this.state = {
            tag: "",
            tabTags: [],
        };
        this.selectRef = React.createRef();
        this.submit = this.submit.bind(this);
        this.getValue = this.getValue.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <section>
                <p id={styles.selection_title}>
                        {this.props.__("settings.addNewTag")}
                </p>
                <form
                onSubmit={this.submit}
                id={styles.selection_add}
                >
                    <div id={styles.entry}>
                        <SearchContainer
                        tagTabs={this.props.tags}
                        onChange={this.getValue}
                        />
                        <button type="submit"
                            id={styles.tag_add_button}
                            onClick={this.submit}>
                            {this.props.__("settings.ConfirmAddTag")}
                        </button>
                    </div>
                </form>
            </section>
        );
    }

    /**
     * Get value enter in the Autosuggest input
     * @param val is the value of tag to add in the layout preview list (DragAndDropList)
     */

    private getValue(val: string) {
        console.log("value: " + val);
        this.setState({
            tag: val,
        });
        console.log("tag: " + this.state.tag);
    }
    private submit(e: any) {

        if (this.state.tag === "") {
            alert("tag input is empty.");
            return;
        }
        e.preventDefault();
        console.log("props" + this.props);
        console.log("tag state:" + this.state.tag);
        console.log("input value:" + e.target.value);
        for (const element of this.props.tags) {
            console.log(element);
        }
        this.props.addEntry({
            entry: {
                    title: this.state.tag,
                    tag: this.state.tag,
                },
            });
        this.setState({
            tag: "",
        });
        console.log("getentry: " + this.props.getentry.length);
        console.log("addentry: " + this.props.addEntry.length);
    }

}

export default withApi(
    AddEntryForm,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "getAllTags",
                resultProp: "tags",
                onLoad: true,
            },
            {
                moduleId: "catalog",
                methodId: "addEntry",
                callProp: "addEntry",
            },
            {
                moduleId: "catalog",
                methodId: "getEntries",
                callProp: "getentry",
            },
        ],
        refreshTriggers: [
            {
                moduleId: "catalog",
                methodId: "updateEntries",
            },
        ],
    },
);

export const translate = withTranslator(AddEntryForm);
