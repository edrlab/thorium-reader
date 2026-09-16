// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import { shell } from "electron";
import * as React from "react";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// e__slint-disable-next-line @typescript-eslint/ban-ts-comment
// @__ts-ignore TS1479
import { nanoid } from "nanoid";

import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/outline-info-24px.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";
import * as FollowLinkIcon from "readium-desktop/renderer/assets/icons/followLink-icon.svg";
import classNames from "classnames";
import * as LibraryIcon from "readium-desktop/renderer/assets/icons/library-icon.svg";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { DialogRAC } from "readium-desktop/renderer/common/components/DialogComponent";

const context = React.createContext<{
    selectSearchResult: IApiappSearchResultView;
    setSelectSearchResult: React.Dispatch<React.SetStateAction<IApiappSearchResultView>>;
    submitAction: () => void;
}>(undefined);

const Item = ({v}: {v: IApiappSearchResultView}) => {

    const {selectSearchResult, setSelectSearchResult, submitAction } = React.useContext(context);
    return <li>
                <a style={{
                    display: "block",
                    cursor: "pointer",
                    padding: "8px",
                    marginTop: "1rem",
                    backgroundColor: selectSearchResult === v ? "var(--color-brand-secondary)" : "transparent",
                    border: selectSearchResult === v ? "2px solid var(--color-brand-primary)" : "2px solid transparent",
                    borderRadius: "8px",
                }}
                    role="option"
                    aria-selected={selectSearchResult === v}
                    tabIndex={0}
                    onClick={() => setSelectSearchResult(v)}
                    onDoubleClick={(_e) => {
                        // e.preventDefault();
                        setSelectSearchResult(v);
                        setTimeout(() => {
                            submitAction();
                        }, 0);
                    }}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            // e.preventDefault();
                            // e.stopPropagation();
                            setSelectSearchResult(v);
                            setTimeout(() => {
                                submitAction();
                            }, 0);
                        }
                    }}
                >
                    <strong>
                        {v.name}
                    </strong>
                    <br />
                    <span>{v.address}</span>
                </a>
            </li>;
};

export const ApiappHowDoesItWorkInfoBox = () => {


    const [__] = useTranslator();
    // const locale = useSelector((state: IRendererCommonRootState) => state.i18n.locale);
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const isRTL = langStringIsRTL(locale);
    const [infoOpen, setInfoOpen] = React.useState(false);

    return (
        <div>
            <button dir={isRTL ? "rtl" : "ltr"} className={classNames("button_catalog_infos")} onClick={(e) => { e.preventDefault(); setInfoOpen(!infoOpen); }}>
                <SVG ariaHidden svg={InfoIcon} />
                {__("apiapp.howItWorks")}
                <SVG ariaHidden svg={infoOpen ? ChevronUp : ChevronDown} />
            </button>
            {infoOpen ?
                <div className={classNames("catalog_infos_text")}>
                    <p dir={isRTL ? "rtl" : "ltr"}>
                        {__("apiapp.informations")}
                    </p>
                    <a dir={isRTL ? "rtl" : "ltr"} href=""
                        onClick={(ev) => {
                            ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                            const href = "https://support.thoriumreader.com/";
                            // if (href && /^https?:\/\//.test(href)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                            shell.openExternal(href).then(() => { /* noop */ }).catch((err: unknown) => { console.log(err); }); // .finally(() => { /* noop */ })
                            // }
                        }}>
                        {__("apiapp.documentation")}
                        <SVG ariaHidden svg={FollowLinkIcon} />
                    </a>
                </div>
                : <></>}
        </div>
    );
};

const ApiappAddForm = () => {
    const [__] = useTranslator();
    const searchInputRef = React.useRef<HTMLInputElement>();

    const ItemListWithStyle = () =>
    <div>
        {
        searchResultView?.length ? <ul style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
        }}>
            {searchResultView.map((v) => <Item v={v} key={nanoid(10)}/>)}
        </ul>
        : searchInputRef?.current?.value ? __("apiapp.noLibraryFound", { name: searchInputRef?.current.value }) : <></>
        }
    </div>;

    const [resultApiAppSearchAction, apiAppSearchAction] = useApi(undefined, "apiapp/search");
    const searchResultView = resultApiAppSearchAction?.data?.result || [];

    return (
        <div className={stylesModals.modal_dialog_body}>
            <div className={stylesInputs.form_group_wrapper}>
                <div
                    style={{ marginBottom: "0" }}
                    className={classNames(stylesInputs.form_group, stylesInputs.form_group_catalog)}>
                        <label htmlFor="apiapp-search">{__("header.searchPlaceholder")}</label>
                    <input
                        className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                        ref={searchInputRef}
                        type="search"
                        id="apiapp_search"
                        // placeholder={__("header.searchPlaceholder")}
                        onKeyUp={(e) => {
                            if (e.key === "Enter") {
                                e.stopPropagation();
                                e.preventDefault();
                                const v = searchInputRef.current?.value;
                                if (!v) return ;
                                apiAppSearchAction(v);
                                // e.preventDefault();
                                // e.stopPropagation();
                            }
                        }}
                    />
                </div>
                <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (searchInputRef.current?.value) {
                                apiAppSearchAction(searchInputRef.current.value);
                            }
                        }}
                        className={stylesButtons.button_nav_primary}
                        style={{height: "24px"}}
                        title={__("header.searchTitle")}
                    >
                        <SVG ariaHidden={true} svg={magnifyingGlass} />
                        {__("header.searchPlaceholder")}
                    </button>
                </div>
                <ItemListWithStyle/>
                <ApiappHowDoesItWorkInfoBox />
            </div>
    );
};

export const ApiappAddFormDialog = () => {
    const [__] = useTranslator();
    const [, apiAddFeedAction] = useApi(undefined, "opds/addFeed");
    const [selectSearchResult, setSelectSearchResult] = React.useState<IApiappSearchResultView>(undefined);
    const [isOpen, setIsOpen] = React.useState(false);

    const addFeedAction = React.useCallback(() => {
        if (!selectSearchResult?.name || !selectSearchResult?.id || !selectSearchResult?.url) {
            return;
        }
        const title = selectSearchResult.name;
        const url = `apiapp://${selectSearchResult.id}:apiapp:${selectSearchResult.url}`;
        apiAddFeedAction({title, url});
    }, [selectSearchResult, apiAddFeedAction]);

    const submitButtonRef = React.useRef<HTMLButtonElement>();
    const contextValue = {selectSearchResult, setSelectSearchResult, submitAction: () => submitButtonRef.current.click()};

    const enableAPIAPP = useSelector((state: ILibraryRootState) => state.settings.enableAPIAPP);

    return <DialogRAC
        isOpen={isOpen}
        title={__("opds.addFormApiapp.title")}
        overlayClassName={stylesModals.modal_dialog_overlay}
        onOpenChange={setIsOpen}
        trigger={
            <button
                style={{ display: enableAPIAPP ? "" : "none" }}
                className={stylesButtons.button_nav_primary}
            >
                <SVG ariaHidden={true} svg={LibraryIcon} />
                <span>{__("opds.addFormApiapp.title")}</span>
            </button>
        }
        content={
            <>
                <div className={stylesModals.modal_dialog_header}>
                    <h1>
                        {__("opds.addFormApiapp.title")}
                    </h1>
                    <div>
                        <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")} onClick={() => setIsOpen(false)}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </div>
                </div>
                <form className={stylesModals.modal_dialog_body}>
                    <context.Provider value={contextValue}>
                        <div>
                        <ApiappAddForm />
                        </div>
                        <div className={stylesModals.modal_dialog_footer}>
                            <button type="button" className={stylesButtons.button_secondary_blue} onClick={() => setIsOpen(false)}>{__("dialog.cancel")}</button>
                            <button type="submit" ref={submitButtonRef} className={stylesButtons.button_primary_blue} onClick={() => {
                                    addFeedAction();
                                    setIsOpen(false);
                                }}>
                                <SVG ariaHidden svg={AddIcon} />
                                {__("opds.addForm.addButton")}</button>
                        </div>
                    </context.Provider>
                </form>
            </>
        }
    />;
};
