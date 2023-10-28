// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { withTranslator} from "readium-desktop/renderer/common/components/hoc/translator";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import classNames from "classnames";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesThemes from "readium-desktop/renderer/assets/styles/components/themes.css";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.css";

const Themes = () => {
    const [ __ ] = useTranslator();
    return (
        <section className={stylesSettings.settings_tab_container}>
            <div className={stylesGlobal.heading}>
                <h2>{__("reader.settings.theme.title")}</h2>
            </div>
            <div>
                <button className={stylesThemes.theme_preview_button}>
                    <div className={classNames(stylesThemes.theme_preview_circle, stylesThemes.dark_theme)}>               
                    </div>
                    <p>{__("reader.settings.theme.name.Night")}</p>
                </button>
                <button>
                    <div className={classNames(stylesThemes.theme_preview_circle, stylesThemes.light_theme)}>               
                    </div>
                    <p>{__("reader.settings.theme.name.Neutral")}</p>
                </button>
            </div>
        </section>
    )
}


export default (withTranslator(Themes));