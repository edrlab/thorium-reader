// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerActions } from "readium-desktop/common/redux/actions";

export const AllowCustom = () => {
    const [__] = useTranslator();
    const overridePublisherDefault = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const dispatch = useDispatch();
    const set = React.useCallback(() => {
        dispatch(readerActions.allowCustom.build(!overridePublisherDefault));
    }, [dispatch, overridePublisherDefault]);

    return (
        <>
            <input id="allow-custom" className={stylesGlobal.checkbox_custom_input} type="checkbox" checked={overridePublisherDefault} onChange={() => { set(); }} />
            <label htmlFor="allow-custom" className={stylesGlobal.checkbox_custom_label}>
                <div
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={overridePublisherDefault}
                    aria-label={__("reader.settings.customizeReader")}
                    onKeyDown={(e) => {
                        // if (e.code === "Space") {
                        if (e.key === " ") {
                            e.preventDefault(); // prevent scroll
                        }
                    }}
                    onKeyUp={(e) => {
                        // if (e.code === "Space") {
                        if (e.key === " ") {
                            e.preventDefault();
                            set();
                        }
                    }}
                    className={stylesGlobal.checkbox_custom}
                    style={{ border: overridePublisherDefault ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: overridePublisherDefault ? "var(--color-brand-primary)" : "transparent" }}>
                    {overridePublisherDefault ?
                        <SVG ariaHidden svg={CheckIcon} />
                        :
                        <></>
                    }
                </div>
                <span aria-hidden>
                    {__("reader.settings.customizeReader")}
                </span>
            </label>
        </>
    );
};
