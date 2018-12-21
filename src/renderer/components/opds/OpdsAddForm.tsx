// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

interface OpdsAddFormProps {
    openOpdsFeedAddForm?: any;
}

export class OpdsAddForm extends React.Component<OpdsAddFormProps, undefined> {
    private urlRef: any;

    public constructor(props: any) {
        super(props);

        this.urlRef = React.createRef();

        this.add = this.add.bind(this);
    }
    public render(): React.ReactElement<{}>  {
        return (
            <section className={styles.opds_form}>
                <p>Ajouter un flux</p>
                <form onSubmit={this.add}>
                    <input
                        ref={this.urlRef}
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
        const url = this.urlRef.current.value;
        this.props.openOpdsFeedAddForm(url);
        this.urlRef.current.value = "";
    }
}

const mapDispatchToProps = (dispatch: any, __1: any) => {
    return {
        openOpdsFeedAddForm: (url: string) => {
            dispatch(dialogActions.open(
                DialogType.OpdsFeedAddForm,
                {
                    opds: { url },
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(OpdsAddForm);
