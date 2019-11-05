// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    section: number;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export class SettingsHeader extends React.Component<IProps> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        return (
            <SecondaryHeader id={styles.settings_header}>
                <ul>
                    <li {...(this.props.section === 2 && {className: styles.active})}>
                        <Link to={{pathname: "/settings/languages", search: "?focusInside=true"}}>
                            { __("settings.uiLanguage") }
                        </Link>
                    </li>
                    <li {...(this.props.section === 3 && {className: styles.active})}>
                        <Link to={{pathname: "/settings/information", search: "?focusInside=true"}}>
                            { __("settings.information") }
                        </Link>
                    </li>
                </ul>
            </SecondaryHeader>
        );
    }
}

export default withTranslator(SettingsHeader);
