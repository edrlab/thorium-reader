// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions } from "readium-desktop/common/redux/actions";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import {
    reduxConnectDecorator,
} from "readium-desktop/renderer/common/decorator/reduxConnect.decorator";
import {
    translatorDecorator,
} from "readium-desktop/renderer/common/decorator/translator.decorator";
import { ReactBaseComponent } from "readium-desktop/renderer/common/ReactBaseComponent";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IProps {
}

const mapReduxDispatch = (dispatch: TDispatch, _props: IProps) => ({
    displayPublicationInfo: () => {
        dispatch(dialogActions.openRequest.build(DialogTypeName.AboutThorium,
            {},
        ));
    },
});

@translatorDecorator
@reduxConnectDecorator(undefined, mapReduxDispatch)
export default class AboutThoriumButton extends ReactBaseComponent<
    IProps,
    undefined,
    undefined,
    ReturnType<typeof mapReduxDispatch>
    > {

    constructor(props: IProps) {
        super(props);
    }

    public render() {
        const { __ } = this;
        return (
            <section id={styles.aboutThoriumButton}>
                <h2>{__("catalog.about.title")}</h2>
                <p>{`v${_APP_VERSION}`}</p>
                <button onClick={this.reduxDispatch.displayPublicationInfo}>
                    {__("catalog.about.button")}
                </button>
            </section>
        );
    }
}
