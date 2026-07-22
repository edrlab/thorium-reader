// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesPublication from "readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";
import { I18nFunction } from "readium-desktop/common/services/translator";
import { DisplayType } from "../../routing";
import { IActiveFilter, IColumns } from "./AllPublications";
import { Column, Row } from "@tanstack/react-table";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

interface ITableCellProps_GlobalFilter {
    __: I18nFunction;
    displayType: DisplayType;

    preGlobalFilteredRows: Row<IColumns>[];
    globalFilteredRows: Row<IColumns>[];
    globalFilter: string;
    setGlobalFilter: (filterValue: string) => void;
    focusInputRef: React.RefObject<HTMLInputElement>;
    accessibilitySupportEnabled: boolean;
    setShowColumnFilters: (show: boolean) => void;
}

const useAsyncDebounce = <T extends (...args: any[]) => any>(fn: T, wait: number) => {
    const callback = React.useRef(fn);
    React.useEffect(() => {
        callback.current = fn;
    }, [fn]);

    return React.useMemo(() => {
        let timer: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timer);
            timer = setTimeout(() => callback.current(...args), wait);
        };
    }, [wait]);
};

export const CellGlobalFilter: React.FC<ITableCellProps_GlobalFilter> = (props) => {

    React.useEffect(() => {
        if (props.focusInputRef?.current &&
            props.focusInputRef.current.value !== props.globalFilter) {
            props.focusInputRef.current.value = props.globalFilter || "";
        }
    }, [props.focusInputRef, props.globalFilter]);
    // const [value, setValue] = React.useState(props.globalFilter);
    // const [, forceReRender] = React.useState(NaN);

    // https://github.com/TanStack/table/blob/7535f8fd51a2aa784949e32a68b9bb24c8a6c811/src/publicUtils.js#L163
    const onInputChange = useAsyncDebounce((v) => {
        console.log("onInputChange", v);

        // if (v) {}
        props.setShowColumnFilters(true);

        props.setGlobalFilter(v);
    }, 500);

    return (
        <div className={classNames(stylesInput.form_group, stylesInput.form_group_allPubSearch)}>
            <label
                id="globalSearchLabel"
                htmlFor="globalSearchInput"
                style={{ display: "flex", gap: "2px" }}>
                {`${props.__("header.searchPlaceholder")}`}
                <div
                    aria-live="assertive">
                    {props.globalFilteredRows.length !== props.preGlobalFilteredRows.length ? ` (${props.globalFilteredRows.length} / ${props.preGlobalFilteredRows.length})` : ` (${props.preGlobalFilteredRows.length})`}
                </div>
            </label>
            <i><SVG ariaHidden svg={SearchIcon} /></i>
            {/*
            value={value || ""}
            */}
            <input
                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                id="globalSearchInput"
                aria-labelledby="globalSearchLabel"
                ref={props.focusInputRef}
                type="search"

                onChange={(e) => {
                    // setValue(e.target.value);
                    if (!props.accessibilitySupportEnabled) {
                        onInputChange((e.target.value || "").trim() || undefined);
                    }
                }}
                onKeyUp={(e) => {
                    if (props.accessibilitySupportEnabled && e.key === "Enter") {
                        props.setShowColumnFilters(true);
                        props.setGlobalFilter( // value
                            (props.focusInputRef?.current?.value || "").trim() || undefined);
                    }
                }}
                placeholder={`${props.__("header.searchTitle")}`}
            />
            {props.accessibilitySupportEnabled ? <button
                onClick={() => {
                    props.setShowColumnFilters(true);
                    props.setGlobalFilter( // value
                        (props.focusInputRef?.current?.value || "").trim() || undefined);
                }}
            >{`${props.__("header.searchPlaceholder")}`}</button> : <></>}
        </div>
    );
};


interface ITableCellProps_ColumnFilter {
    __: I18nFunction;
    column: Column<IColumns>;
    showColumnFilters: boolean;
    setShowColumnFilters: (show: boolean) => void;
    accessibilitySupportEnabled: boolean;
    selectedTag: string;
    setSelectedTag: React.Dispatch<React.SetStateAction<string>>;
    setActiveFiltersArray: React.Dispatch<React.SetStateAction<IActiveFilter[]>>;
    setSelection?: React.Dispatch<React.SetStateAction<string>>;
}

export const CellColumnFilter: React.FC<ITableCellProps_ColumnFilter> = (props) => {

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const filterValue = props.column.getFilterValue() as string | undefined;
        if (inputRef?.current && inputRef.current.value !== (filterValue ?? "")) {
            inputRef.current.value = filterValue ?? "";
        }
    }, [props.column]);

    const onInputChange = useAsyncDebounce((v: string | undefined) => {
        props.column.setFilterValue(v);
    }, 500);

    const [searchParams] = useSearchParams();
    const searchParamsFocus = searchParams.get("focus");
    const searchParamsValue = searchParams.get("value");
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (searchParamsFocus === "tags" && props.column.id === "colTags") {
            if (!inputRef.current) {
                if (!props.showColumnFilters) {
                    props.setShowColumnFilters(true);
                }
                return;
            }
            inputRef.current.focus();
            inputRef.current.value = decodeURIComponent(searchParamsValue ?? "");
            if (!props.accessibilitySupportEnabled) {
                onInputChange((inputRef.current.value || "").trim() || undefined);
            } else {
                props.column.setFilterValue(
                    (inputRef.current.value || "").trim() || undefined,
                );
            }
        }
    }, [onInputChange, props.showColumnFilters, props.column, props.accessibilitySupportEnabled, searchParamsFocus, searchParamsValue, props]);

    const applyFilter = (value: string) => {
        const trimmed = value.trim();
        props.column.setFilterValue(trimmed || undefined);

        if (props.column.id === "colTags") {
            props.setSelectedTag(trimmed);
        }

        props.setActiveFiltersArray(prev => {
            const filtered = prev.filter(f => f.filterCol !== props.column.id);
            if (!trimmed) return filtered;
            return [...filtered, {
                filterType: props.column.columnDef.header?.toString() ?? "",
                value: trimmed,
                filterCol: props.column.id,
            }];
        });

        if (props.setSelection) {
            props.setSelection(trimmed);
        }
    };


    if (!props.showColumnFilters) return <></>;

    return (
        <div className={stylesPublication.showColFilters_wrapper}>
            <input
                ref={inputRef}
                type="search"
                onChange={(e) => {
                    const queryParams = new URLSearchParams(location.search);
                    if (queryParams.has("focus") || queryParams.has("value")) {
                        navigate(location.pathname, { state: location.state, replace: true });
                    }

                    if (!props.accessibilitySupportEnabled) {
                        onInputChange((e.target.value || "").trim() || undefined);
                        if (props.column.id === "colTags") {
                            props.setSelectedTag(e.target.value.trim());
                        }
                    }
                }}
                onKeyUp={(e) => {
                    if (e.key === "Enter") {
                        applyFilter(inputRef.current?.value ?? "");
                    }
                }}
                aria-label={`${props.__("header.searchPlaceholder")} (${props.column.columnDef.header})`}
                className={stylesPublication.showColFilters_input}
                style={{
                    width: props.accessibilitySupportEnabled ? "calc(100% - 30px)" : "100%",
                }}
            />
            {props.accessibilitySupportEnabled && (
                <button
                    aria-label={`${props.__("header.searchPlaceholder")}`}
                    onClick={() => applyFilter(inputRef.current?.value ?? "")}
                >
                    <SVG ariaHidden svg={SearchIcon} />
                </button>
            )}
        </div>
    );
};
