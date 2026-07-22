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
import * as FilterIcon from "readium-desktop/renderer/assets/icons/filter-icon.svg";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { HoverEvent } from "@react-types/shared";
import { IActiveFilter, IColumns } from "./AllPublications";
import { ColumnFiltersState, Table } from "@tanstack/react-table";

interface FilterComponentProps {
    table: any;
    target: string;
    targetColName: string;
    targetList: {
        id: number;
        value: number;
        name: string;
    }[] | string[];
    selection: string;
    setSelection: React.Dispatch<React.SetStateAction<string>>;
    activeFiltersArray: IActiveFilter[];
    setActiveFiltersArray: React.Dispatch<React.SetStateAction<IActiveFilter[]>>;
}

interface IFilterPopoverProps {
    table: any;
    filterPopoverOpen: boolean;
    setFilterPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
    formats: string[];
    selectedFormat: string;
    setSelectedFormat: React.Dispatch<React.SetStateAction<string>>;
    languages: string[];
    selectedLanguage: string;
    setSelectedLanguage: React.Dispatch<React.SetStateAction<string>>;
    readingStates: string[];
    selectedReadingState: string;
    setSelectedReadingState: React.Dispatch<React.SetStateAction<string>>;
    tagsOptions: {
        id: number;
        value: number;
        name: string;
    }[];
    selectedTag: string;
    setSelectedTag: React.Dispatch<React.SetStateAction<string>>;
    activeFiltersArray: IActiveFilter[];
    setActiveFiltersArray: React.Dispatch<React.SetStateAction<IActiveFilter[]>>;
}

export const activeFiltersGlobalArray: IActiveFilter[] = [];

export const resetAllFilters = (
    tableInstance: Table<IColumns>,
    setSelectedFormat: React.Dispatch<React.SetStateAction<string>>,
    setSelectedLanguage: React.Dispatch<React.SetStateAction<string>>,
    setSelectedReadingState: React.Dispatch<React.SetStateAction<string>>,
    setSelectedTag: React.Dispatch<React.SetStateAction<string>>,
    setActiveFiltersArray?: React.Dispatch<React.SetStateAction<IActiveFilter[]>>,
    setColumnFilters?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>,
) => {
    tableInstance.resetColumnFilters();
    tableInstance.setGlobalFilter("");
    if (setColumnFilters) setColumnFilters([]);
    activeFiltersGlobalArray.length = 0;
    setSelectedFormat("");
    setSelectedLanguage("");
    setSelectedReadingState("");
    setSelectedTag("");
    if (setActiveFiltersArray) setActiveFiltersArray([]);
};

export const FilterComponent = ({ table, target, targetColName, targetList, selection, setSelection, setActiveFiltersArray }: FilterComponentProps) => {
    const [__] = useTranslator();

    const formattedList = React.useMemo(() => 
    targetList.map((item, index) => ({
        id: index,
        value: index,
        name: typeof item === "string" ? item : item.name,
    }))
, [targetList]);

    return (
        <div className={stylesPublication.filter_container} style={{ margin: "20px 0" }}>
            <ComboBox
                label={`${__("library.filter.filterBy")} ${target}`}
                defaultItems={formattedList}
                placeholder={__("library.filter.selectOption")}
                selectedKey={formattedList.find(el => el.name?.toLowerCase() === selection?.toLowerCase())?.id ?? null}
                onSelectionChange={(key) => {
                    if (key === null || key === undefined) {
                        setSelection("");
                        table.getColumn(targetColName)?.setFilterValue(undefined);
                        setActiveFiltersArray(prevArray => prevArray.filter(f => f.filterType !== target));
                        return;
                    }

                    const found = formattedList.find((el) => el.id === key);

                    if (found) {
                        setSelection(found.name);
                        table.getColumn(targetColName)?.setFilterValue(found.name || undefined);

                        setActiveFiltersArray(prevArray => {
                            const filtered = prevArray.filter(f => f.filterType !== target);
                            return [...filtered, {
                                filterType: target,
                                value: found.name,
                                filterCol: targetColName,
                            }];
                        });
                    } else {
                        table.getColumn(targetColName)?.setFilterValue(undefined);
                        setActiveFiltersArray(prevArray => prevArray.filter(f => f.filterType !== target));
                    }
                }}
                allowsCustomValue
                onInputChange={(v) => {
                    setSelection(v);
                    if (v === "") {
                        table.getColumn(targetColName)?.setFilterValue(undefined);
                        setActiveFiltersArray(prev => prev.filter(f => f.filterType !== target));
                    }
                }}
                inputValue={selection}
                aria-label={__("header.fitlerTagTitle")}
            >
                {item => (
                    <ComboBoxItem
                        onHoverStart={(e: HoverEvent) => {
                            if (!(e.target as HTMLElement).getAttribute("title")) {
                                (e.target as HTMLElement).setAttribute("title", item.name);
                            }
                        }}
                    >
                        {item.name}
                    </ComboBoxItem>
                )}
            </ComboBox>
        </div>
    );
};


export const FilterPopover = (props: IFilterPopoverProps) => {
    const {
        table, filterPopoverOpen, setFilterPopoverOpen,
        formats, selectedFormat, setSelectedFormat,
        languages, selectedLanguage, setSelectedLanguage,
        readingStates, selectedReadingState, setSelectedReadingState,
        tagsOptions, selectedTag, setSelectedTag,
        activeFiltersArray, setActiveFiltersArray,
    } = props;
    const [__] = useTranslator();

    return (
        <Popover.Root>
            <Popover.Trigger asChild className={stylesPublication.allBooks_header_filter_trigger} title={__("library.filter.addFilters")}>
                <button onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}>
                    <SVG ariaHidden={true} svg={FilterIcon} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content avoidCollisions sideOffset={5} align="end" alignOffset={-10} className={stylesAnnotations.annotation_form} style={{ paddingTop: "20px" }}>
                    <FilterComponent table={table} target={__("catalog.format")} targetColName={"colFormat"} targetList={formats} selection={selectedFormat} setSelection={setSelectedFormat} activeFiltersArray={activeFiltersArray} setActiveFiltersArray={setActiveFiltersArray} />
                    <FilterComponent table={table} target={__("catalog.lang")} targetColName={"colLanguages"} targetList={languages} selection={selectedLanguage} setSelection={setSelectedLanguage} activeFiltersArray={activeFiltersArray} setActiveFiltersArray={setActiveFiltersArray} />
                    <FilterComponent table={table} target={__("publication.progression.title")} targetColName={"colReadingState"} targetList={readingStates} selection={selectedReadingState} setSelection={setSelectedReadingState} activeFiltersArray={activeFiltersArray} setActiveFiltersArray={setActiveFiltersArray} />
                    <FilterComponent table={table} target={__("catalog.tags")} targetColName={"colTags"} targetList={tagsOptions} selection={selectedTag} setSelection={setSelectedTag} activeFiltersArray={activeFiltersArray} setActiveFiltersArray={setActiveFiltersArray} />
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};
