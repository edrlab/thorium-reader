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
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TDispatch } from "readium-desktop/typings/redux";

interface Props extends TranslatorProps, ReturnType<typeof mapDispatchToProps> {
}

export class OpdsAddForm extends React.Component<Props> {

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <section className={ styles.opds_form }>
                <button onClick={this.props.openOpdsFeedAddForm}>
                    <SVG svg={AddIcon}/>
                    <span>{ __("opds.addForm.title")}</span>
                </button>
            </section>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        openOpdsFeedAddForm: () => {
            dispatch(dialogActions.open(DialogType.OpdsFeedAddForm, {}));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(OpdsAddForm));
