// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { I18nTyped } from "readium-desktop/common/services/translator";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import { TDispatch } from "readium-desktop/typings/redux";

// import { connectDecorator } from "../utils/decorator/connect.decorator";
import { translatorDecorator } from "../utils/decorator/translator.decorator";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.AboutThorium,
                {},
            ));
        },
    };
};

// @connectDecorator(undefined, mapDispatchToProps)
@translatorDecorator
class AboutThoriumButton extends React.Component<IProps, undefined> {

    public __: I18nTyped;
    constructor(props: IProps) {
        super(props);
    }

    public componentWillMount() {
        console.log("mounting");
    }

    public render() {
        const { __ } = this;
        return (
            <section id={styles.aboutThoriumButton}>
                <h2>{__("catalog.about.title")}</h2>
                <p>{`v${_APP_VERSION}`}</p>
                <button onClick={this.props.displayPublicationInfo}>
                    {__("catalog.about.button")}
                </button>
            </section>
        );
    }
}

export default connect(undefined, mapDispatchToProps)(AboutThoriumButton);
