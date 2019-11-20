// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
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
                <button onClick={this.props.openOpdsFeedAddForm}>
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
            dispatch(dialogActions.openRequest.build("opds-feed-add-form", {}));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(OpdsAddForm));
