// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
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

class AboutThoriumButton extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <section id={style.aboutThoriumButton}>
                <h2>{__("catalog.about.title")}</h2>
                <p>{`v${_APP_VERSION}`}</p>
                <button onClick={this.props.displayPublicationInfo}>
                    {__("catalog.about.button")}
                </button>
            </section>
        );
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build("about-thorium",
                {},
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(AboutThoriumButton));
