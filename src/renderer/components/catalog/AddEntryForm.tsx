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

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import { withApi } from "readium-desktop/renderer/components/utils/api";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import * as SearchContainer from "./SearchTag";

//import SearchTag from "./SearchTag";

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
        const tabTags: string[] = [];
        this.selectRef = React.createRef();
        this.updateTagValue = this.updateTagValue.bind(this);
        this.submit = this.submit.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <section >
                <div>
                    <button className={styles.tag_add_button}>
                        <span>Ajouter une sélection</span>
                    </button>
                </div>
                <div>
                    <form
                        onSubmit={this.submit}
                        style={{display: "inline-block"}}
                        id={styles.tag_search}
                    >
                    <input type="text"
                    style={{border: "6px", margin: "5px 5px 5px 5px"}}
                    placeholder="Indiquez votre #tag"
                    value={this.state.tag}
                    onChange={this.updateTagValue}
                    >
                    </input>
                    <SearchContainer
                    tagTags = {this.getTags}>

                    </SearchContainer>

                    <button type="submit"
                    style={{border: "6px", margin: "5px 5px 5px 5px", textAlign: "left"}}
                    onClick={this.submit}>
                            Valider
                    </button>
                    </form>
                </div>
            </section>
        );
    }

    private getTags(tab: string[]): string[] {
        this.props.tags.map((tag: string, index: number) =>
        tab.push(tag));
        this.setState({
            tabTags: tab,
        });
        return (this.state.tabTags);
    }

    private updateTagValue(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
              tag: e.target.value,
          });
    }

    private submit(e: any) {
        e.preventDefault();
        console.log("props" + this.props);
        console.log("tag state:" + this.state.tag);
        this.props.addEntry({
            entry: {
                    title: "L'outsider",
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
