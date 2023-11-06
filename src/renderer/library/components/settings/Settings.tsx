// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";

import AuthSettings from "./AuthSettings";
import KeyboardSettings from "./KeyboardSettings";
import LanguageSettings from "./LanguageSettings";
import SessionSettings from "./SessionSettings";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

class Settings extends React.Component<IProps, undefined> {

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <>
                <LibraryLayout
                    title={__("header.settings")}
                >
                    <div id="settings-container">
                        <LanguageSettings></LanguageSettings>
                        <div className="settings-container_right">
                            <SessionSettings></SessionSettings>
                            <KeyboardSettings></KeyboardSettings>
                            <AuthSettings></AuthSettings>
                        </div>
                    </div>
                </LibraryLayout>
            </>
        );
    }
}

export default withTranslator(Settings);
