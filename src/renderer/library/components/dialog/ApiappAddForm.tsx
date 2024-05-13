// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
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
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as CloseIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";

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
                    backgroundColor: selectSearchResult === v ? "#DDDDDD" : "transparent",
                    border: selectSearchResult === v ? "2px solid black" : "2px solid transparent",
                    borderRadius: "8px",
                }}
                    role="option"
                    aria-selected={selectSearchResult === v}
                    tabIndex={0}
                    onClick={() => setSelectSearchResult(v)}
                    onDoubleClick={() => {
                        // e.preventDefault();
                        setSelectSearchResult(v);
                        setTimeout(() => {
                            submitAction();
                        }, 0);
                    }}
                    onKeyDown={(e) => {
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

const ApiappAddForm = () => {
    const [__] = useTranslator();
    const searchInputRef = React.useRef<HTMLInputElement>();
    const [infoOpen, setInfoOpen] = React.useState(false);

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

    const openInfo = (e: any) => {
        e.preventDefault();
        setInfoOpen(!infoOpen);
    };

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
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.stopPropagation();
                                e.preventDefault();
                                const v = searchInputRef.current?.value;
                                if (!v) return;
                                apiAppSearchAction(v);
                                // e.preventDefault();
                                // e.stopPropagation();
                            }
                        }}
                    />
                    {searchInputRef.current ?
                        <button
                            className={stylesGlobal.button_clear}
                            type="reset"
                            onClick={() => {
                                searchInputRef.current.value = "";
                            }}
                            style={{minWidth: "35px"}}
                        >
                            <SVG ariaHidden svg={CloseIcon} />
                        </button>
                        : <></>
                    }
                </div>
                <button
                        onClick={() => searchInputRef.current?.value ? apiAppSearchAction(searchInputRef.current.value) : ""}
                        className={stylesButtons.button_secondary_blue}
                        title={__("header.searchTitle")}
                    >
                        <SVG ariaHidden={true} svg={magnifyingGlass} />
                        {__("header.searchPlaceholder")}
                    </button>
                </div>
                <ItemListWithStyle/>
                <div>
                    <button className="button_catalog_infos" onClick={(e) => openInfo(e)}>
                        <SVG ariaHidden svg={InfoIcon} />
                        {__("apiapp.howItWorks")}
                        <SVG ariaHidden svg={infoOpen ? ChevronUp : ChevronDown} />
                    </button>
                    { infoOpen ?
                    <div className="catalog_infos_text">
                        <p>
                        {__("apiapp.informations")}
                        </p>
                        <a href="https://thorium.edrlab.org/docs/">
                        {__("apiapp.documentation")}
                            <SVG ariaHidden svg={FollowLinkIcon} />
                        </a>
                    </div>
                    : <></>}
                </div>
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

    return <Dialog.Root>
        <Dialog.Trigger asChild>
            <button
                className={stylesButtons.button_nav_primary}
            >
                <SVG ariaHidden={true} svg={LibraryIcon} />
                <span>{__("opds.addFormApiapp.title")}</span>
            </button>
        </Dialog.Trigger>
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={stylesModals.modal_dialog}>
                <div className={stylesModals.modal_dialog_header}>
                    <Dialog.Title>
                        {__("opds.addFormApiapp.title")}
                    </Dialog.Title>
                    <div>
                        <Dialog.Close asChild>
                            <button className={stylesButtons.button_transparency_icon} aria-label="Close">
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
                                <button type="submit" ref={submitButtonRef} className={stylesButtons.button_primary_blue} onClick={() => addFeedAction()}>
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

export default ApiappAddFormDialog;
