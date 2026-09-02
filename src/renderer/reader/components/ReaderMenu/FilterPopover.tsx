// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as React from "react";
import type { ISVGProps } from "readium-desktop/renderer/common/components/SVG";
import FocusLock from "react-focus-lock";

import SVG from "readium-desktop/renderer/common/components/SVG";

import * as MenuIcon from "readium-desktop/renderer/assets/icons/filter3-icon.svg";

import * as Popover from "@radix-ui/react-popover";
import { TagGroup, TagList, Tag, Label, Selection } from "react-aria-components";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

interface FilterPopoverProps {
    filterOpen: boolean;
    setFilterOpen: (open: boolean) => void;
    nbOfFilters: number;
    tagArrayFilter: Selection;
    setTagArrayFilter: (selection: Selection) => void;
    colorArrayFilter: Selection;
    setColorArrayFilter: (selection: Selection) => void;
    drawTypeArrayFilter?: Selection;
    setDrawTypeArrayFilter?: (selection: Selection) => void;
    creatorArrayFilter: Selection;
    setCreatorArrayFilter: (selection: Selection) => void;
    selectTagOption: { name: string }[];
    colorSet: { name: string, hex: string }[];
    selectDrawtypesOptions?: { name: string, textValue: string, svg: ISVGProps }[];
    selectCreatorOptions: { name: string }[];
    popoverBoundary?: HTMLDivElement | null;
}


const FilterPopover = (props: FilterPopoverProps) => {

    const [__] = useTranslator();
    return (
        <Popover.Root modal open={props.filterOpen} onOpenChange={(open) => props.setFilterOpen(open)}>
            <Popover.Trigger asChild>
                <button aria-label={__("reader.annotations.filter.filterOptions")} className={stylesAnnotations.annotations_filter_trigger_button}
                    title={__("reader.annotations.filter.filterOptions")}>
                    <SVG svg={MenuIcon} />
                    {props.nbOfFilters > 0 ?
                        <p className={stylesAnnotations.annotations_filter_nbOfFilters} style={{ fontSize: props.nbOfFilters > 9 ? "10px" : "12px", paddingLeft: props.nbOfFilters > 9 ? "3px" : "4px" }}>{props.nbOfFilters}</p>
                        : <></>
                    }
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content collisionBoundary={props.popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_filter_container} style={{ maxHeight: Math.round(window.innerHeight / 2) }}>
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                    <FocusLock>
                        <TagGroup
                            selectionMode="multiple"
                            selectedKeys={props.tagArrayFilter}
                            onSelectionChange={props.setTagArrayFilter}
                            aria-label={__("reader.annotations.filter.filterByTag")}
                            style={{ marginBottom: "20px" }}
                        >
                            <details open id="annotationListTagDetails">
                                <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: !props.selectTagOption.length ? "none" : "auto", opacity: !props.selectTagOption.length ? "0.5" : "1" }}
                                    tabIndex={!props.selectTagOption.length ? -1 : 0}
                                >
                                    <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByTag")}</Label>
                                    <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                        <button
                                            disabled={!props.selectTagOption.length}
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={props.tagArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setTagArrayFilter("all");
                                                const detailsElement = document.getElementById("annotationListTagDetails") as HTMLDetailsElement;
                                                if (detailsElement) {
                                                    detailsElement.open = true;
                                                }

                                            }}>
                                            {__("reader.annotations.filter.all")}
                                        </button>
                                        <button
                                            disabled={!props.selectTagOption.length}
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setTagArrayFilter(new Set([]));

                                            }}>
                                            {__("reader.annotations.filter.none")}
                                        </button>
                                    </div>
                                </summary>
                                {
                                    props.selectTagOption.length ?
                                        <TagList items={props.selectTagOption} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: !props.selectTagOption.length ? "0" : "20px 0" }}>
                                            {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                        </TagList>
                                        : <></>
                                }
                            </details>
                        </TagGroup>
                        <TagGroup
                            selectionMode="multiple"
                            selectedKeys={props.colorArrayFilter}
                            onSelectionChange={props.setColorArrayFilter}
                            aria-label={__("reader.annotations.filter.filterByColor")}
                            style={{ marginBottom: "20px" }}
                        >
                            <details open id="annotationListColorDetails">
                                <summary className={stylesAnnotations.annotations_filter_tagGroup}>
                                    <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByColor")}</Label>
                                    <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                        <button
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={props.colorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setColorArrayFilter("all");
                                                const detailsElement = document.getElementById("annotationListColorDetails") as HTMLDetailsElement;
                                                if (detailsElement) {
                                                    detailsElement.open = true;
                                                }

                                            }}>
                                            {__("reader.annotations.filter.all")}
                                        </button>
                                        <button
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setColorArrayFilter(new Set([]));

                                            }}>
                                            {__("reader.annotations.filter.none")}
                                        </button>
                                    </div>
                                </summary>
                                <TagList items={props.colorSet} className={stylesAnnotations.annotations_filter_taglist}>
                                    {(item) => <Tag className={stylesAnnotations.annotations_filter_color} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name} ref={(r) => { if (r && (r as unknown as HTMLDivElement).setAttribute) { (r as unknown as HTMLDivElement).setAttribute("title", item.name); } }}></Tag>}
                                </TagList>
                            </details>
                        </TagGroup>
                        {props.selectDrawtypesOptions && props.setDrawTypeArrayFilter ?
                        <TagGroup
                            selectionMode="multiple"
                            selectedKeys={props.drawTypeArrayFilter}
                            onSelectionChange={props.setDrawTypeArrayFilter}
                            aria-label={__("reader.annotations.filter.filterByDrawtype")}
                            style={{ marginBottom: "20px" }}
                        >
                            <details open id="annotationListDrawDetails">
                                <summary className={stylesAnnotations.annotations_filter_tagGroup}>
                                    <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByDrawtype")}</Label>
                                    <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                        <button
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={props.drawTypeArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setDrawTypeArrayFilter("all");
                                                const detailsElement = document.getElementById("annotationListDrawDetails") as HTMLDetailsElement;
                                                if (detailsElement) {
                                                    detailsElement.open = true;
                                                }

                                            }}>
                                            {__("reader.annotations.filter.all")}
                                        </button>
                                        <button
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setDrawTypeArrayFilter(new Set([]));

                                            }}>
                                            {__("reader.annotations.filter.none")}
                                        </button>
                                    </div>
                                </summary>
                                <TagList items={props.selectDrawtypesOptions} className={stylesAnnotations.annotations_filter_taglist}>
                                    {(item) => <Tag id={item.name} className={stylesAnnotations.annotations_filter_drawtype} textValue={item.textValue}><SVG svg={item.svg} /></Tag>}
                                </TagList>
                            </details>
                        </TagGroup>
                        : <></>}
                        <TagGroup
                            selectionMode="multiple"
                            selectedKeys={props.creatorArrayFilter}
                            onSelectionChange={props.setCreatorArrayFilter}
                            aria-label={__("reader.annotations.filter.filterByCreator")}
                            style={{ marginBottom: "20px" }}
                        >
                            <details id="annotationListCreator" open={!!props.selectCreatorOptions.length}>
                                <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: !props.selectCreatorOptions.length ? "none" : "auto", opacity: !props.selectCreatorOptions.length ? "0.5" : "1" }}
                                    tabIndex={!props.selectCreatorOptions.length ? -1 : 0}
                                >
                                    <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByCreator")}</Label>
                                    <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                        <button
                                            tabIndex={!props.selectCreatorOptions.length ? -1 : 0}
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={props.creatorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setCreatorArrayFilter("all");
                                                const detailsElement = document.getElementById("annotationListCreator") as HTMLDetailsElement;
                                                if (detailsElement) {
                                                    detailsElement.open = true;
                                                }

                                            }}>
                                            {__("reader.annotations.filter.all")}
                                        </button>
                                        <button
                                            tabIndex={!props.selectCreatorOptions.length ? -1 : 0}
                                            style={{ width: "fit-content", minWidth: "unset" }}
                                            className={stylesButtons.button_secondary_blue}
                                            onClick={() => {
                                                props.setCreatorArrayFilter(new Set([]));

                                            }}>
                                            {__("reader.annotations.filter.none")}
                                        </button>
                                    </div>
                                </summary>
                                <TagList items={props.selectCreatorOptions} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: !props.selectCreatorOptions.length ? "0" : "20px 0" }}>
                                    {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                </TagList>
                            </details>
                        </TagGroup>
                    </FocusLock>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

export default FilterPopover;
