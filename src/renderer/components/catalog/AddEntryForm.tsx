// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import SVG from "readium-desktop/renderer/components/utils/SVG"

import * as AddIcon from "readium-desktop/renderer/assets/icons/baseline-add-24px.svg";
import * as RemoveIcon from "readium-desktop/renderer/assets/icons/baseline-remove-24px.svg";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import { withApi } from "readium-desktop/renderer/components/utils/api";

interface AddEntryFormProps {
    addEntry?: (entry: any) => void;
    tags?: string[];
}

interface AddEntryFormState {
    open: boolean;
}

export class AddEntryForm extends React.Component<AddEntryFormProps, AddEntryFormState> {
    private selectRef: any;
    public constructor(props: any) {
        super(props);

        this.state = {
            open: false,
        }

        this.selectRef = React.createRef();

        this.submit = this.submit.bind(this);
        this.switchForm = this.switchForm.bind(this);
    }

    public render(): React.ReactElement<{}> {
        return (
            <section >
                <button onClick={this.switchForm} className={styles.tag_add_button}>
                    { this.state.open ?
                        <SVG svg={RemoveIcon} />
                        :
                        <SVG svg={AddIcon} />
                    }
                    <span>Ajouter une sélection</span>
                </button>
                <form onSubmit={this.submit} style={{display: this.state.open ? "inline-block" : "none"}} id={styles.tag_search}>
                    <select ref={this.selectRef} className={styles.tag_inputs} id={styles.tag_inputs} placeholder="Rechercher un tag" title="rechercher un tag">
                        { this.props.tags && this.props.tags.map((tag: string, index: number) =>
                            <option key={index} value={tag}>{tag}</option>
                        )}
                    </select>
                    <button onClick={this.submit} className={styles.launch}>
                        <SVG svg={AddIcon} title="Créer la séléction" />
                    </button>
                </form>
            </section>
        );
    }

    private submit(e: any) {
        e.preventDefault();
        this.props.addEntry({
            entry: {
                    title: this.selectRef.current.value,
                    tag: this.selectRef.current.value,
                },
            });
    }

    private switchForm() {
        this.setState({open: !this.state.open})
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
        ],
        refreshTriggers: [
            {
                moduleId: "publication",
                methodId: "updateTags",
            },
        ],
    },
);
