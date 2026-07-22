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
import * as SortIcon from "readium-desktop/renderer/assets/icons/sort-icon.svg";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

interface SortComponentProps {
    table: any;
}

const SortComponent = ({ table }: SortComponentProps) => {
    const [__] = useTranslator();
    const sortOptions = [
        { id: "colTitle", label: __("library.sorting.title") },
        { id: "colAuthors", label: __("library.sorting.author") },
        { id: "colLanguages", label: __("library.sorting.language") },
        { id: "colReadingState", label: __("library.sorting.readingState") },
    ];

    const sorting = table.getState().sorting ?? [];

    const handleSort = (columnId: string) => {
        const column = table.getColumn(columnId);
        if (!column) return;

        const currentSort = sorting.find((s: any) => s.id === columnId);

        if (!currentSort) {
            column.toggleSorting(false, false); 
        } else if (!currentSort.desc) {
            column.toggleSorting(true, false); 
        } else {
            column.clearSorting();
        }
    };

    return (
        <div className={stylesPublication.sorting_container}>
            <p>{__("library.sorting.sortBy")}</p>
            <ul style={{ display: "flex", gap: "10px", listStyle: "none", padding: 0, flexDirection: "column" }}>
                {sortOptions.map((option) => {
                    const sortedEntry = sorting.find((s: any) => s.id === option.id);
                    const isSorted = !!sortedEntry;
                    const isDesc = sortedEntry?.desc;

                    return (
                        <li key={option.id}>
                            <button
                                onClick={() => handleSort(option.id)}
                                style={{ fontWeight: isSorted ? "bold" : "normal", cursor: "pointer" }}
                            >
                                {option.label}
                                <span>{isSorted ? (isDesc ? " ↓" : " ↑") : ""}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export const SortingPopover = (props: {
    table: any;
    filterPopoverOpen: boolean;
    setFilterPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const { table, filterPopoverOpen, setFilterPopoverOpen } = props;
    const [__] = useTranslator();

    return (
        <Popover.Root>
            <Popover.Trigger asChild className={stylesPublication.allBooks_header_filter_trigger} title={__("library.sorting.addSorting")}>
                <button onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}>
                    <SVG ariaHidden={true} svg={SortIcon} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content avoidCollisions sideOffset={5} align="end" alignOffset={-10} className={stylesAnnotations.annotation_form} style={{ width: "200px" }}>
                    <SortComponent table={table} />
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
