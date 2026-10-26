// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as Dialog from "readium-desktop/renderer/common/components/Dialog";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { RegistryFeed } from "readium-desktop/common/models/registry";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";
import * as GlobeIcon from "readium-desktop/renderer/assets/icons/globe-icon-bold.svg";
import * as AddIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";

const CatalogIcon = ({ url }: { url?: string }) => {
    const [failed, setFailed] = React.useState(false);
    return <span style={{ width: "40px", height: "40px", flexShrink: 0, display: "grid", placeItems: "center" }}>
        {url && !failed ? <img src={url} alt="" width={40} height={40}
            style={{ objectFit: "contain" }} referrerPolicy="no-referrer" onError={() => setFailed(true)} /> :
            <SVG ariaHidden svg={GlobeIcon} />}
    </span>;
};

const Results = ({ query, page, selected, onSelect, onActivate, onPage }: {
    query: string; page: number; selected: RegistryFeed | undefined;
    onSelect: (feed: RegistryFeed) => void; onPage: (page: number) => void;
    onActivate: (feed: RegistryFeed) => void;
}) => {
    const [__] = useTranslator();
    const [response, search] = useApi(undefined, "opds/searchRegistry");
    React.useEffect(() => { search(query, page); }, [query, page, search]);
    const data = response?.data;
    return <div aria-live="polite" aria-busy={!data}>
        {!data ? <p>{__("opds.registry.loading")}</p> : data.error ?
            <p role="alert">{__("opds.registry.error")}</p> : <>
                {!data.result?.feeds.length && <p>{__("opds.registry.empty")}</p>}
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {data.result?.feeds.map((feed) => <li key={feed.url}>
                        <button type="button" aria-pressed={selected?.url === feed.url}
                            onClick={() => onSelect(feed)} onDoubleClick={() => onActivate(feed)}
                            onKeyUp={(event) => {
                                if (event.key === "Enter") onActivate(feed);
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: "12px", padding: "8px",
                                justifyContent: "flex-start", height: "auto", minHeight: "60px",
                                boxSizing: "border-box", flexShrink: 0,
                                width: "100%", textAlign: "start", cursor: "pointer", color: "inherit",
                                font: "inherit", overflowWrap: "anywhere", marginTop: "1rem",
                                backgroundColor: selected?.url === feed.url ? "var(--color-brand-secondary)" : "transparent",
                                border: selected?.url === feed.url ? "2px solid var(--color-brand-primary)" : "2px solid transparent",
                                borderRadius: "8px",
                            }}>
                            <CatalogIcon url={feed.iconUrl} />
                            <span style={{ minWidth: 0, flex: 1, textAlign: "start" }}><strong>{feed.title}</strong><br /><span>{feed.url}</span></span>
                        </button>
                    </li>)}
                </ul>
                {page > 1 && <button type="button" onClick={() => onPage(page - 1)}>{__("opds.previous")}</button>}
                {data.result?.hasNext && <button type="button" onClick={() => onPage(page + 1)}>{__("opds.next")}</button>}
            </>}
    </div>;
};

const RegistryForm = () => {
    const [__] = useTranslator();
    const [input, setInput] = React.useState("");
    const [request, setRequest] = React.useState<{ query: string; page: number; id: number }>();
    const [selected, setSelected] = React.useState<RegistryFeed>();
    const [, addFeed] = useApi(undefined, "opds/addFeed");
    const addButtonRef = React.useRef<HTMLButtonElement>();
    const search = (query: string, page = 1) => {
        setSelected(undefined);
        setRequest((previous) => ({ query, page, id: (previous?.id || 0) + 1 }));
    };
    return <div className={stylesModals.modal_dialog_body}>
        <div>
        <form style={{ padding: "0 20px 16px" }} onSubmit={(event) => {
            event.preventDefault();
            if (input.trim()) search(input.trim());
        }}>
            <div className={stylesInputs.form_group_wrapper} style={{ flexShrink: 0 }}>
            <div className={`${stylesInputs.form_group} ${stylesInputs.form_group_catalog}`}
                style={{ flex: 1, minWidth: 0 }}>
                <label htmlFor="registry-search">{__("header.searchPlaceholder")}</label>
                <input id="registry-search" type="search" value={input}
                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" onChange={(event) => {
                    setInput(event.target.value);
                    setSelected(undefined);
                    setRequest(undefined);
                }} />
            </div>
            <button type="submit" disabled={!input.trim()} className={stylesButtons.button_nav_primary}
                style={{ boxSizing: "border-box", height: "36px", flexShrink: 0 }}>
                <SVG ariaHidden svg={SearchIcon} />{__("header.searchPlaceholder")}
            </button>
            </div>
            {request && <Results key={request.id} {...request} selected={selected} onSelect={setSelected}
                onActivate={(feed) => {
                    setSelected(feed);
                    setTimeout(() => addButtonRef.current?.click(), 0);
                }}
                onPage={(page) => search(request.query, page)} />}
        </form>
        </div>
        <div className={stylesModals.modal_dialog_footer}>
            <Dialog.Close asChild><button type="button" className={stylesButtons.button_secondary_blue}>
                {__("dialog.cancel")}
            </button></Dialog.Close>
            <Dialog.Close asChild><button type="button" disabled={!selected} ref={addButtonRef}
                className={stylesButtons.button_primary_blue} onClick={() => {
                    if (selected) {
                        const { iconUrl, ...feed } = selected;
                        addFeed(feed, "registry", iconUrl);
                    }
                }}><SVG ariaHidden svg={AddIcon} />{__("opds.addForm.addButton")}</button></Dialog.Close>
        </div>
    </div>;
};

export const RegistryAddFormDialog = () => {
    const [__] = useTranslator();
    return <Dialog.Root>
        <Dialog.Trigger asChild><button className={stylesButtons.button_nav_primary}>
            <SVG ariaHidden svg={SearchIcon} /><span>{__("opds.registry.title")}</span>
        </button></Dialog.Trigger>
        <Dialog.Portal className={stylesModals.modal_dialog_overlay}>
            <Dialog.Content className={stylesModals.modal_dialog} aria-describedby={undefined}>
                <div className={stylesModals.modal_dialog_header}>
                    <Dialog.Title>{__("opds.registry.title")}</Dialog.Title>
                    <Dialog.Close asChild><button type="button" data-css-override=""
                        className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                        <SVG ariaHidden svg={QuitIcon} />
                    </button></Dialog.Close>
                </div>
                <RegistryForm />
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
