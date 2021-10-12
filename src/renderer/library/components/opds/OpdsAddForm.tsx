// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TDispatch } from "readium-desktop/typings/redux";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

export class OpdsAddForm extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <section className={ styles.opds_form }>
                <button 
                    onClick={this.props.openOpdsFeedAddForm}
                    className={styles.button_primary}
                >
                    <SVG svg={AddIcon}/>
                    <span>{ __("opds.addForm.title")}</span>
                </button>
            </section>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        openOpdsFeedAddForm: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.OpdsFeedAddForm, {}));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(OpdsAddForm));
