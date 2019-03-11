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
import { SearchContainer } from "./SearchTag";

interface AddEntryFormProps {
    addEntry?: (entry: any) => void;
    getentry?: CatalogEntryView[];
    tags?: string[];
}

interface AddEntryFormState {
    tag: string;
    tabTags: string[];
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
            <section >
                <div id={styles.selection_title}>
                        Ajouter une sélection
                </div>
                <form
                onSubmit={this.submit}
                id={styles.selection_add}
                >
                    <span id={styles.search}>
                        <SearchContainer
                        tagTabs={this.props.tags}
                        onChange={this.getValue}
                        />
                        <button type="submit"
                            id={styles.tag_add_button}
                            onClick={this.submit}>
                            Valider
                        </button>
                    </span>
                </form>
            </section>
        );
    }

    private getValue(val: string) {
        console.log("value: " + val);
        this.setState({
            tag: val,
        });
        console.log("tag: " + this.state.tag);
    }
    private submit(e: any) {
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
                moduleId: "publication",
                methodId: "updateTags",
            },
        ],
    },
);
