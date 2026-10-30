// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as React from "react";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerActions } from "readium-desktop/common/redux/actions";

export const AllowCustom = () => {
    const [__] = useTranslator();
    const overridePublisherDefault = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const deactivateTextFormatting = !overridePublisherDefault;
    const dispatch = useDispatch();

    const toggleDeactivateTextFormatting = React.useCallback(() => {
        dispatch(readerActions.allowCustom.build(!overridePublisherDefault));
    }, [dispatch, overridePublisherDefault]);

    return (
        <>
            <label htmlFor="allow-custom" className={stylesGlobal.checkbox_custom_label}>
                <input
                    id="allow-custom"
                    className={stylesGlobal.checkbox_custom_input}
                    type="checkbox"
                    role="switch"
                    checked={deactivateTextFormatting}
                    aria-label={__("reader.settings.deactivateTextFormatting")}
                    onChange={toggleDeactivateTextFormatting}
                />
                <span
                    aria-hidden
                    style={{
                        position: "relative",
                        width: "34px",
                        height: "20px",
                        borderRadius: "999px",
                        border: "1px solid transparent",
                        backgroundColor: deactivateTextFormatting ? "var(--color-brand-primary)" : "#61646B",
                        display: "inline-flex",
                        alignItems: "center",
                        transition: "background-color 140ms ease",
                    }}>
                    <span
                        style={{
                            width: "14px",
                            height: "14px",
                            borderRadius: "50%",
                            backgroundColor: "white",
                            transform: deactivateTextFormatting ? "translateX(16px)" : "translateX(4px)",
                            transition: "transform 140ms ease",
                        }}
                    />
                </span>
                <span aria-hidden>
                    {__("reader.settings.deactivateTextFormatting")}
                </span>
            </label>
        </>
    );
};
