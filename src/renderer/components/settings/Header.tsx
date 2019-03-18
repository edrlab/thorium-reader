// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";

import { Link } from "react-router-dom";

import * as styles from "readium-desktop/renderer/assets/styles/settings.css";
import { TranslatorProps, withTranslator } from "../utils/translator";

export interface Props extends TranslatorProps {
    section: number;
}

export class SettingsHeader extends React.Component<Props, undefined> {

    /*@lazyInject("translator")
    private translator: Translator;*/

    public render(): React.ReactElement<{}> {
        //const __ = this.translator.translate.bind(this.translator);

        return (
            <SecondaryHeader id={styles.settings_header}>
                <ul>
                    <li {...(this.props.section === 0 && {className: styles.active})}>
                        <Link to="/settings/tags">
                            {this.props.__("settings.manageTags")}
                        </Link>
                    </li>
                    <li {...(this.props.section === 2 && {className: styles.active})}>
                        <Link to="/settings/languages">
                            {this.props.__("settings.language")}
                        </Link>
                    </li>
                </ul>
            </SecondaryHeader>
        );
    }
}

export default withTranslator(SettingsHeader);
