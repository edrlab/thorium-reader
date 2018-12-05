// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { withApi } from "../utils/api";

interface AddOpdsFormProps {
    addOpds?: (data: any) => void;
}

export class AddOpdsForm extends React.Component<AddOpdsFormProps, undefined> {
    private pathRef: any;

    public constructor(props: any) {
        super(props);

        this.pathRef = React.createRef();

        this.add = this.add.bind(this);
    }
    public render(): React.ReactElement<{}>  {
        return (
            <section className={styles.opds_form}>
                <p>Ajouter un flux</p>
                <form onSubmit={this.add}>
                    <input
                        ref={this.pathRef}
                        type="text"
                        placeholder="Coller l'URL d'un flux"
                        title="Coller l'URL d'un flux"
                    />
                </form>
            </section>
        );
    }

    private add(e: any) {
        e.preventDefault();
        const newOpds = {path: this.pathRef.current.value};
        console.log("Add new OPDS : ", newOpds);
        this.props.addOpds(newOpds);
    }
}

export default withApi(
    AddOpdsForm,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "add",
                callProp: "addOpds",
            },
        ],
    },
);
