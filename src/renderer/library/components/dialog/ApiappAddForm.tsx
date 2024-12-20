// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";

import { shell } from "electron";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
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
                    backgroundColor: selectSearchResult === v ? "var(--color-light-blue)" : "transparent",
                    border: selectSearchResult === v ? "2px solid var(--color-blue)" : "2px solid transparent",
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
    const [infoOpen, setInfoOpen] = React.useState(false);

    return (
        <div>
            <button className={classNames("button_catalog_infos")} onClick={(e) => { e.preventDefault(); setInfoOpen(!infoOpen); }}>
                <SVG ariaHidden svg={InfoIcon} />
                {__("apiapp.howItWorks")}
                <SVG ariaHidden svg={infoOpen ? ChevronUp : ChevronDown} />
            </button>
            {infoOpen ?
                <div className={classNames("catalog_infos_text")}>
                    <p>
                        {__("apiapp.informations")}
                    </p>
                    <a href=""
                        onClick={async (ev) => {
                            ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                            await shell.openExternal("https://thorium.edrlab.org/");
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

    return <Dialog.Root>
        <Dialog.Trigger asChild>
            <button
                style={{ display: enableAPIAPP ? "" : "none" }}
                className={stylesButtons.button_nav_primary}
            >
                <SVG ariaHidden={true} svg={LibraryIcon} />
                <span>{__("opds.addFormApiapp.title")}</span>
            </button>
        </Dialog.Trigger>
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={stylesModals.modal_dialog} aria-describedby={undefined}>
                <div className={stylesModals.modal_dialog_header}>
                    <Dialog.Title>
                        {__("opds.addFormApiapp.title")}
                    </Dialog.Title>
                    <div>
                        <Dialog.Close asChild>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                </div>
                <form className={stylesModals.modal_dialog_body}>
                    <context.Provider value={contextValue}>
                        <div>
                        <ApiappAddForm />
                        </div>
                        <div className={stylesModals.modal_dialog_footer}>
                            <Dialog.Close asChild>
                                <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                            </Dialog.Close>
                            <Dialog.Close asChild>
                                <button type="submit" ref={submitButtonRef} className={stylesButtons.button_primary_blue} onClick={(e) => {
                                    e.preventDefault();
                                    addFeedAction();
                                }}>
                                    <SVG ariaHidden svg={AddIcon} />
                                    {__("opds.addForm.addButton")}</button>
                            </Dialog.Close>
                        </div>
                    </context.Provider>
                </form>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
