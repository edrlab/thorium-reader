// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "regenerator-runtime/runtime"; 

import * as stylesPublication from "readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/arrowLast-icon.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/arrowFirst-icon.svg";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { IStringMap } from "readium-desktop/r2-xxx-js/r2-shared-js/models/metadata-multilang";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import * as EyeOpenIcon from "readium-desktop/renderer/assets/icons/eye-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { IColumns } from "./AllPublications";
import { Table } from "@tanstack/react-table";


export function convertMultiLangStringToStringArray(items: (string | IStringMap)[] | undefined, locale: keyof typeof availableLanguages): (string | undefined)[] {
    if (!items) {
        return [];
    }

    return items.map((item) => {
        if (typeof item === "object") {
            return convertMultiLangStringToString(item, locale);
        }
        return item;
    });
}

export const LibraryNavigation = (props: {
    table: Table<IColumns>;
    setShowColumnFilters: (show: boolean) => void;
    focusInputRef: React.RefObject<HTMLInputElement>;
    accessibilitySupportEnabled: boolean;
}) => {
    const { table } = props;
    const pageIndex = table.getState().pagination.pageIndex;
    const pageCount = table.getPageCount();
    const [__] = useTranslator();

    return (
        <div className={stylesPublication.allBooks_header_pagination}>
            <label htmlFor="pageSelect" className={stylesPublication.allBooks_header_pagination_title}>
                {__("catalog.numberOfPages")}
            </label>
            <div className={stylesPublication.allBooks_header_pagination_container}>

                <button
                    className={stylesPublication.allBooks_header_pagination_arrow}
                    aria-label={`${__("opds.firstPage")}`}
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                </button>

                <button
                    className={stylesPublication.allBooks_header_pagination_arrow}
                    style={{ transform: "rotate(180deg)" }}
                    aria-label={`${__("opds.previous")}`}
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <SVG ariaHidden={true} svg={ChevronRight} />
                </button>

                <select
                    id="pageSelect"
                    aria-label={`${__("reader.navigation.currentPageTotal", { current: pageIndex + 1, total: pageCount })}`}
                    className={stylesPublication.allBooks_header_pagination_select}
                    value={pageIndex}
                    onChange={(e) => table.setPageIndex(Number(e.target.value))}
                >
                    {Array.from({ length: pageCount }, (_, i) => (
                        <option key={i} value={i}>
                            {i + 1} / {pageCount}
                        </option>
                    ))}
                </select>

                <button
                    className={stylesPublication.allBooks_header_pagination_arrow}
                    aria-label={`${__("opds.next")}`}
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    <SVG ariaHidden={true} svg={ChevronRight} />
                </button>

                <button
                    className={stylesPublication.allBooks_header_pagination_arrow}
                    aria-label={`${__("opds.lastPage")}`}
                    onClick={() => table.setPageIndex(pageCount - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    <SVG ariaHidden={true} svg={ArrowLastIcon} />
                </button>

            </div>
        </div>
    );
};

export const SelectTableHeaders = (props: {
    editableColumnsArray: any[];
}) => {
    const { editableColumnsArray } = props;
    const [selectedFilterHeaderOpen, setSelectedFilterHeaderOpen] = React.useState(false);
    const [__] = useTranslator();

    return (
        <Popover.Root open={selectedFilterHeaderOpen} onOpenChange={setSelectedFilterHeaderOpen}>
            <Popover.Trigger asChild className={stylesPublication.allBooks_header_filter_trigger}
                title={__("catalog.selectTableHeaders")}>
                <button>
                    <SVG ariaHidden={true} svg={EyeOpenIcon} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content avoidCollisions sideOffset={5} align="end" alignOffset={-10} className={stylesAnnotations.annotation_form} style={{ paddingTop: "20px" }}>
                    {editableColumnsArray.map((col) => (
                        <div key={col.id} style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                            <input
                                    type="checkbox"
                                    id={col.id}
                                    checked={col.getIsVisible()}
                                    onChange={col.getToggleVisibilityHandler()} 
                                />
                            <label htmlFor={col.id} style={{ marginLeft: "8px", cursor: "pointer" }}>
                                {typeof col.Header === "string"
                                    ? col.Header
                                    // : typeof col.Header === "function"
                                    // ? (col.Header as unknown as (() => string))()
                                    : col.id.replace("col", "")}
                            </label>
                        </div>
                    ))}
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
