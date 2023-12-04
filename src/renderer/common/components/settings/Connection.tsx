// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useTranslator } from "../../hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as BinIcon from "readium-desktop/renderer/assets/icons/bin-icon.svg";
import { useDispatch } from "../../hooks/useDispatch";
import { authActions, sessionActions } from "readium-desktop/common/redux/actions";
import SVG from "../SVG";
import { useSelector } from "../../hooks/useSelector";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";

export const Auth = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    return (
        <button
            className={stylesSettings.btn_primary}
            onClick={() => dispatch(authActions.wipeData.build())}>
            <SVG ariaHidden svg={BinIcon} />
            {__("settings.auth.wipeData")}
        </button>
    );
};

export const Session = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const sessionState = useSelector((state: IRendererCommonRootState) => state.session.state);

    return (
        <>
            <form>
                <input
                    id={"session-true"}
                    type="checkbox"
                    lang={__("settings.session.yes")}
                    name="language"
                    defaultChecked={sessionState}
                    onChange={(e) => dispatch(sessionActions.enable.build(e.target.checked))}
                />
                <label htmlFor={"session-true"}>{__("settings.session.title")}</label>
            </form>
            <div className={stylesSettings.session_text}>
                <p>{__("settings.session.description")}</p>
            </div>
        </>
    );
};

const ConnectionSettings: React.FC<{}> = () => {
    const [__] = useTranslator();
    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <div>
                <h4>{__("catalog.opds.auth.login")}</h4>
            </div>
            <Session />
            <Auth />
        </section>
    );
};

export default ConnectionSettings;
