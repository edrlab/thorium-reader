// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.css";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { IApiappSearchResultView } from "readium-desktop/common/api/interface/apiappApi.interface";
import { DialogCloseButton, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogWithRadix, DialogWithRadixTrigger, DialogWithRadixContent } from "readium-desktop/renderer/common/components/dialog/DialogWithRadix";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { nanoid } from "nanoid";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";

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
        <div style={{display:"flex", flexDirection: "column", width: "100%"}}>
                <div
                    style={{ marginBottom: "0" }}
                    className={stylesInputs.form_group}>
                    <input
                        ref={searchInputRef}
                        type="search"
                        id="apiapp_search"
                        placeholder={__("header.searchPlaceholder")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const v = searchInputRef.current?.value;
                                if (!v) return ;
                                apiAppSearchAction(v);
                                // e.preventDefault();
                                // e.stopPropagation();
                            }
                        }}
                    />
                    <button
                        onClick={() => searchInputRef.current?.value ? apiAppSearchAction(searchInputRef.current.value) : ""}
                        className={stylesButtons.button_primary_small}
                        style={{ fontWeight: "bold" }}
                        title={__("header.searchTitle")}
                    >
                        {__("header.searchPlaceholder")}<SVG ariaHidden={true} svg={magnifyingGlass} />
                    </button>
                </div>
                <ItemListWithStyle/>
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

    return <DialogWithRadix>
        <DialogWithRadixTrigger asChild>
            <button
                className={stylesButtons.button_primary}
            >
                <SVG ariaHidden={true} svg={AddIcon} />
                <span>{__("opds.addFormApiapp.title")}</span>
            </button>
        </DialogWithRadixTrigger>
        <DialogWithRadixContent>
            <DialogHeader>
                <DialogTitle>
                    {__("opds.addFormApiapp.title")}
                </DialogTitle>
                <div>
                    <DialogCloseButton />
                </div>
            </DialogHeader>
            <context.Provider value={contextValue}>
            <ApiappAddForm />
                <DialogFooter>
                    <DialogClose asChild>
                        <button className={stylesButtons.button_primary}>{__("dialog.cancel")}</button>
                    </DialogClose>
                    <DialogClose asChild>
                        <button ref={submitButtonRef} className={stylesButtons.button_secondary} onClick={() => addFeedAction()}>{__("opds.addForm.addButton")}</button>
                    </DialogClose>
                </DialogFooter>
            </context.Provider>
        </DialogWithRadixContent>
    </DialogWithRadix>;
};

export default ApiappAddFormDialog;
