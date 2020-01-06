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
import { TRootState } from "readium-desktop/renderer/redux/reducers";
import { TDispatch } from "readium-desktop/typings/redux";

import { apiDecorator, TApiDecorator } from "../utils/decorator/api.decorator";
import { reduxConnectDecorator } from "../utils/decorator/reduxConnect.decorator";
import { translatorDecorator } from "../utils/decorator/translator.decorator";
import { ReactComponent } from "../utils/reactComponent";
// import { shallowEqual } from "readium-desktop/utils/shallowEqual";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps  {
}

const mapReduxState = (state: TRootState) => ({
    test: state.i18n.locale,
    dialog: state.dialog,
});

const mapReduxDispatch = (dispatch: TDispatch, _props: IBaseProps) => ({
    displayPublicationInfo: () => {
        dispatch(dialogActions.openRequest.build(DialogTypeName.AboutThorium,
            {},
        ));
    },
});

@translatorDecorator
@reduxConnectDecorator(mapReduxState, mapReduxDispatch)
@apiDecorator("catalog/get", undefined, () => [])
@apiDecorator("publication/getAllTags", undefined, () => [])
export default class AboutThoriumButton extends ReactComponent<
    IProps,
    undefined,
    ReturnType<typeof mapReduxState>,
    ReturnType<typeof mapReduxDispatch>,
    TApiDecorator<"catalog/get"> & TApiDecorator<"publication/getAllTags">
    > {

    constructor(props: IProps) {
        super(props);
    }

    public render() {
        console.log("locale", this.reduxState.test);
        console.log("dialog", this.reduxState.dialog);
        console.log("catalog", this.api["catalog/get"]);
        console.log("tags", this.api["publication/getAllTags"]);

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
/*
    public shouldComponentUpdate(props: IBaseProps) {
        console.log("should update", props);
        if (shallowEqual({}, props)) {
            return false;
        }
        return true;
    }
    */
}
