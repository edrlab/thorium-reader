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
import { TranslatorProps, withTranslator } from "../utils/translator";

interface OpdsAddFormProps extends TranslatorProps {
    openOpdsFeedAddForm?: any;
}

export class OpdsAddForm extends React.Component<OpdsAddFormProps, undefined> {
    private formRef: any;

    public constructor(props: any) {
        super(props);

        this.formRef = React.createRef();

        this.add = this.add.bind(this);
    }
    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <section className={ styles.opds_form }>
                <p> { __("opds.addForm.title")} </p>
                <form ref={this.formRef} onSubmit={ this.add }>
                    <input
                        name="url"
                        type="text"
                        placeholder={ __("opds.addForm.pasteUrl")}
                        title={ __("opds.addForm.pasteUrl")}
                        defaultValue=""
                    />
                </form>
            </section>
        );
    }

    private add(e: any) {
        e.preventDefault();
        const url = this.formRef.current.url.value;
        this.props.openOpdsFeedAddForm(url);
        this.formRef.current.url.value = "";
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

export default withTranslator(connect(undefined, mapDispatchToProps)(OpdsAddForm));
