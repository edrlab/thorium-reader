// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { noteExport } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import debounce from "debounce";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { TextArea } from "react-aria-components";
import { noteExportHtmlMustacheTemplate } from "readium-desktop/common/readium/annotation/htmlTemplate";

const OverloadNoteExportToHtml: React.FC<{}> = () => {

    const MAX_LEN = 100 * 1024;
    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const dispatch = useDispatch();
    const enableCheckbox = useSelector((state: ILibraryRootState) => state.noteExport.overrideHTMLTemplate);
    const htmlContent = useSelector((state: ILibraryRootState) => state.noteExport.htmlContent);
    const textAreaRef = React.useRef<HTMLTextAreaElement>();
    const toggleEnableCheckbox = () => {
        dispatch(noteExport.overrideHTMLTemplate.build(!enableCheckbox, htmlContent));
    };
    const updateHtmlContent = React.useCallback((str: string) => {
        const slicedStr = str.slice(0, MAX_LEN);
        dispatch(noteExport.overrideHTMLTemplate.build(true, slicedStr));
    }, [dispatch, MAX_LEN]);
    const updateHtmlContentDebounced = React.useMemo(() =>
        debounce(
            updateHtmlContent
            , 500)
        , [updateHtmlContent]);
    const resetHtmlContent = () => {
        dispatch(noteExport.overrideHTMLTemplate.build(enableCheckbox, noteExportHtmlMustacheTemplate));
        textAreaRef.current.value = noteExportHtmlMustacheTemplate;
    };

    return (<>

        <section className={stylesSettings.section} style={{ position: "relative" }}>

            <h3 dir={isRTL ? "rtl" : "ltr"}>{__("settings.note.export.overrideHTMLTemplate")}</h3>
            <input type="checkbox" className={stylesGlobal.checkbox_custom_input} name="enableCheckbox" />
            <div dir={isRTL ? "rtl" : "ltr"} className={stylesAnnotations.annotations_checkbox}>
                <input type="checkbox" id="enableCheckbox" className={stylesGlobal.checkbox_custom_input} name="enableCheckbox" checked={enableCheckbox} onChange={toggleEnableCheckbox} />
                <label htmlFor="enableCheckbox" className={stylesGlobal.checkbox_custom_label}>
                    <div
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={enableCheckbox}
                        aria-label={__("settings.note.export.enableCheckbox")}
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
                                toggleEnableCheckbox();
                            }
                        }}
                        className={stylesGlobal.checkbox_custom}
                        style={{ border: enableCheckbox ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: enableCheckbox ? "var(--color-brand-primary)" : "transparent" }}>
                        {enableCheckbox ?
                            <SVG ariaHidden svg={CheckIcon} />
                            :
                            <></>
                        }
                    </div>
                    <span aria-hidden dir={isRTL ? "rtl" : "ltr"}>{__("settings.note.export.enableCheckbox")}</span>
                </label>
            </div>
            {
                enableCheckbox ? <>
                    <TextArea style={{ minWidth: "-webkit-fill-available", maxWidth: "-webkit-fill-available" }} name="htmlContent" wrap="hard" ref={textAreaRef} defaultValue={htmlContent} maxLength={MAX_LEN} onChange={(a) => updateHtmlContentDebounced(a.currentTarget.value)}></TextArea>
                    <button dir={isRTL ? "rtl" : "ltr"} className={stylesButtons.button_secondary_blue} onClick={resetHtmlContent}>{__("settings.note.export.applyDefaultTemplate")}</button>
                </>
                    : <></>
            }

        </section>
    </>);
};

export default OverloadNoteExportToHtml;
