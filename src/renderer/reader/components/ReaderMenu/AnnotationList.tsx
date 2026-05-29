// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesInputs from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesAnnotations from "readium-desktop/renderer/assets/styles/components/annotations.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesAlertModals from "readium-desktop/renderer/assets/styles/components/alert.modals.scss";
import * as StylesCombobox from "readium-desktop/renderer/assets/styles/components/combobox.scss";
import classNames from "classnames";
import * as React from "react";
import FocusLock from "react-focus-lock";

import SVG from "readium-desktop/renderer/common/components/SVG";

import * as SaveIcon from "readium-desktop/renderer/assets/icons/export-icon.svg";
import * as ImportIcon from "readium-desktop/renderer/assets/icons/import-icon.svg";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/arrowLast-icon.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/arrowFirst-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/filter3-icon.svg";
import * as OptionsIcon from "readium-desktop/renderer/assets/icons/filter2-icon.svg";
import * as SortIcon from "readium-desktop/renderer/assets/icons/sort-icon.svg";
import * as HighLightIcon from "readium-desktop/renderer/assets/icons/highlight-icon.svg";
import * as UnderLineIcon from "readium-desktop/renderer/assets/icons/underline-icon.svg";
import * as TextStrikeThroughtIcon from "readium-desktop/renderer/assets/icons/TextStrikethrough-icon.svg";
import * as TextOutlineIcon from "readium-desktop/renderer/assets/icons/TextOutline-icon.svg";

import * as Popover from "@radix-ui/react-popover";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ListBox, ListBoxItem  } from "react-aria-components";
import type { Selection } from "react-aria-components";
import { TagGroup, TagList, Tag, Label } from "react-aria-components";

import { IReaderMenuProps } from "../options-values";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { dialogActions, dockActions, readerActions } from "readium-desktop/common/redux/actions";
import { IReaderDialogOrDockSettingsMenuState } from "readium-desktop/common/models/reader";
import { rgbToHex } from "readium-desktop/common/rgb";
import { ImportAnnotationsDialog } from "readium-desktop/renderer/common/components/ImportAnnotationsDialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { DockTypeName } from "readium-desktop/common/models/dock";
import { EDrawType, INoteState, noteColorCodeToColorTranslatorKeySet } from "readium-desktop/common/redux/states/renderer/note";

import { exportAnnotationSet } from "readium-desktop/renderer/common/redux/sagas/readiumAnnotation/export";
import { getSaga } from "../../createStore";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { AnnotationCard } from "../ReaderMenu/AnnotationCard";
import { computeProgression } from "./ReaderMenu";
import { canUseReadiumAnnotationImportExport, compareAnnotationPanelProgression, filterDeletableAnnotationPanelNotes } from "../../pdf/pdfAnnotationPanel";

export const AnnotationList: React.FC<{ /*annotationUUIDFocused: string, resetAnnotationUUID: () => void, doFocus: number,*/ isPdf: boolean, popoverBoundary: HTMLDivElement, advancedAnnotationsOnChange: () => void, quickAnnotationsOnChange: () => void, marginAnnotationsOnChange: () => void, hideAnnotationOnChange: () => void, serialAnnotator: boolean, START_PAGE: number, selectionIsSet: (a: Selection) => a is Set<string>, MAX_MATCHES_PER_PAGE: number } & Pick<IReaderMenuProps, "goToLocator" | "goToPdfAnnotation">> = (props) => {

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    const { goToLocator,  goToPdfAnnotation, isPdf,/*annotationUUIDFocused, resetAnnotationUUID,*/ popoverBoundary, advancedAnnotationsOnChange, quickAnnotationsOnChange, marginAnnotationsOnChange, hideAnnotationOnChange, serialAnnotator, START_PAGE, selectionIsSet, MAX_MATCHES_PER_PAGE } = props;

    const dispatch = useDispatch();
    const dockedMode = useSelector((state: IReaderRootState) => state.reader.config.readerDockingMode !== "full");
    const dialogOrDockDataInfo = useSelector((state: IReaderRootState): IReaderDialogOrDockSettingsMenuState =>
        (state.dialog.open && state.dialog.type === DialogTypeName.ReaderMenu) ?
            state.dialog.data as IReaderDialogOrDockSettingsMenuState : (state.dock.open && state.dock.type === DockTypeName.ReaderMenu) ?
                state.dock.data : {} as unknown as IReaderDialogOrDockSettingsMenuState);
    const updateDialogOrDockDataInfo = React.useCallback((data: IReaderDialogOrDockSettingsMenuState) => {
        dispatch(dockedMode ? dockActions.updateRequest.build(data) : dialogActions.updateRequest.build(data));
    }, [dockedMode, dispatch]);

    const [sortingOpen, setSortingOpen] = React.useState(false);
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const { id: needToFocusOnID, edit: annotationEdit } = dialogOrDockDataInfo;
    const [annotationUUID, setAnnotationUUID] = React.useState(needToFocusOnID);
    React.useEffect(() => {
        setAnnotationUUID(needToFocusOnID);
        setTagArrayFilter(new Set([]));
        setColorArrayFilter(new Set([]));
        setDrawTypeArrayFilter(new Set([]));
        setCreatorArrayFilter(new Set([]));
        setSortingOpen(false);
        setFilterOpen(false);
        setOptionsOpen(false);

    }, [needToFocusOnID]);

    const [__] = useTranslator();
    const notes = useSelector((state: IReaderRootState) => state.reader.note);
    const annotationsListAll = React.useMemo(() => notes.filter(({ group }) => group === "annotation"), [notes]);
    const readiumAnnotationImportExportEnabled = canUseReadiumAnnotationImportExport(isPdf);
    const publicationView = useSelector((state: IReaderRootState) => state.reader.info.publicationView);
    const winId = useSelector((state: IReaderRootState) => state.win.identifier);
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const locale = useSelector((state: IReaderRootState) => state.i18n.locale);
    const [tagArrayFilter, setTagArrayFilter] = React.useState<Selection>(new Set([]));
    const [colorArrayFilter, setColorArrayFilter] = React.useState<Selection>(new Set([]));
    const [drawTypeArrayFilter, setDrawTypeArrayFilter] = React.useState<Selection>(new Set([]));
    const [creatorArrayFilter, setCreatorArrayFilter] = React.useState<Selection>(new Set([]));

    // r2Publication.Metadata.Title
    const annoSetTitle = convertMultiLangStringToString(publicationView.publicationTitle,  locale) || "thorium-notes_annotations";

    const [pageNumber, setPageNumber] = React.useState(START_PAGE);
    const changePageNumber = React.useCallback((cb: (n: number) => number) => {
        setTimeout(() => paginatorAnnotationsRef.current?.focus(), 100);
        updateDialogOrDockDataInfo({id: "", edit: false});
        setPageNumber(cb);
    }, [setPageNumber, updateDialogOrDockDataInfo]);

    const tagsIndexList = useSelector((state: IReaderRootState) => state.noteTagsIndex);
    const selectTagOption = React.useMemo(() => tagsIndexList.map((v, i) => ({ id: i, name: v.tag })), [tagsIndexList]);

    // if tagArrayFilter value not include in the selectTagOption then take only the intersection between tagArrayFilter and selectTagOption
    const selectTagOptionFilteredNameArray = React.useMemo(() => selectTagOption.map((v) => v.name), [selectTagOption]);
    // const tagArrayFilterArray = selectionIsSet(tagArrayFilter) ? Array(...tagArrayFilter) : [];
    // if (tagArrayFilterArray.filter((tagValue) => !selectTagOptionFilteredNameArray.includes(tagValue)).length) {
    //     const tagArrayFilterArrayDifference = tagArrayFilterArray.filter((tagValue) => selectTagOptionFilteredNameArray.includes(tagValue));
    //     setTagArrayFilter(new Set(tagArrayFilterArrayDifference));
    // }

    const creatorListName = React.useMemo(() => annotationsListAll.map(({ creator }) => creator?.name).filter(v => v), [annotationsListAll]);
    const selectCreatorOptions = React.useMemo(() => [...(new Set(creatorListName))].map((name, index) => ({ id: `${index}_${name}`, name })), [creatorListName]);
    const annotationsColors = React.useMemo(() => Object.entries(noteColorCodeToColorTranslatorKeySet).map(([k, v]) => ({ hex: k, name: __(v) })), [__]);
    const selectDrawtypesOptions = React.useMemo(() => [
        { name: "solid_background", svg: HighLightIcon, textValue: `${__("reader.annotations.type.solid")}` },
        { name: "underline", svg: UnderLineIcon, textValue: `${__("reader.annotations.type.underline")}` },
        { name: "strikethrough", svg: TextStrikeThroughtIcon, textValue: `${__("reader.annotations.type.strikethrough")}` },
        { name: "outline", svg: TextOutlineIcon,  textValue: `${__("reader.annotations.type.outline")}` },
    ], [__]);

    const annotationListFiltered = React.useMemo(() => {

        return (
            (selectionIsSet(tagArrayFilter) && tagArrayFilter.size) ||
            (tagArrayFilter === "all") ||
            (selectionIsSet(colorArrayFilter) && colorArrayFilter.size) ||
            (colorArrayFilter === "all") ||
            (selectionIsSet(drawTypeArrayFilter) && drawTypeArrayFilter.size) ||
            (drawTypeArrayFilter === "all") ||
            (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size) ||
            (creatorArrayFilter === "all")
        )
            ? annotationsListAll.filter(({ tags, color, drawType: _drawType, creator }) => {

                const colorHex = rgbToHex(color);
                const drawType = EDrawType[_drawType];
                const creatorName = creator?.name || "";

                return ((tagArrayFilter === "all" && tags?.some((tagsValueName) => selectTagOptionFilteredNameArray.includes(tagsValueName))) || (selectionIsSet(tagArrayFilter) && tagArrayFilter.size && tags?.some((tagsValueName) => tagArrayFilter.has(tagsValueName)))) ||
                    ((colorArrayFilter === "all" && annotationsColors.some(({hex}) => hex === colorHex)) || (selectionIsSet(colorArrayFilter) && colorArrayFilter.size && colorArrayFilter.has(colorHex))) ||
                    ((drawTypeArrayFilter === "all" && selectDrawtypesOptions.some(({name}) => drawType === name)) || (selectionIsSet(drawTypeArrayFilter) && drawTypeArrayFilter.size && drawTypeArrayFilter.has(drawType))) ||
                    ((creatorArrayFilter === "all" && creatorListName.includes(creatorName)) || (selectionIsSet(creatorArrayFilter) && creatorArrayFilter.size && creatorArrayFilter.has(creatorName)));

            })
            : annotationsListAll;
    }, [annotationsListAll, tagArrayFilter, colorArrayFilter, drawTypeArrayFilter, creatorArrayFilter, annotationsColors, creatorListName, selectDrawtypesOptions, selectTagOptionFilteredNameArray, selectionIsSet]);

    const [sortType, setSortType] = React.useState<Selection>(new Set(["lastCreated"]));

    if (sortType !== "all" && sortType.has("progression")) {

        annotationListFiltered.sort((a, b) => {

            return compareAnnotationPanelProgression(a, b, (left, right) => {
                const la = left.locatorExtended!.locator;
                const lb = right.locatorExtended!.locator;
                const pcta = computeProgression(r2Publication.Spine, la);
                const pctb = computeProgression(r2Publication.Spine, lb);
                return pcta - pctb;
            });
        });
    } else if (sortType !== "all" && sortType.has("lastCreated")) {
        annotationListFiltered.sort(({ created: ca }, { created: cb }) => {
            return cb - ca;
        });
    } else if (sortType !== "all" && sortType.has("lastModified")) {
        annotationListFiltered.sort(({ modified: ma }, { modified: mb }) => {
            return ma && mb ? mb - ma : ma ? -1 : mb ? 1 : 0;
        });
    }

    const deletableAnnotationListFiltered = filterDeletableAnnotationPanelNotes(annotationListFiltered);

    const annotationFocusFoundIndex = annotationUUID ? annotationListFiltered.findIndex(({ uuid }) => annotationUUID === uuid) : -1;
    React.useEffect(() => {
        if (annotationUUID) {
            setAnnotationUUID("");
            const annotationFocusItemPageNumber = Math.ceil((annotationFocusFoundIndex + 1 /* 0 based */) / MAX_MATCHES_PER_PAGE);
            setPageNumber((pageNumber) => annotationFocusItemPageNumber !== pageNumber ? annotationFocusItemPageNumber : pageNumber);

        }
    }, [annotationUUID, annotationFocusFoundIndex, MAX_MATCHES_PER_PAGE]);

    const pageTotal = Math.ceil(annotationListFiltered.length / MAX_MATCHES_PER_PAGE) || 1;
    if (pageNumber <= 0) {
        setPageNumber(START_PAGE);
    } else if (pageNumber > pageTotal) {
        setPageNumber(pageTotal);
    }

    const startIndex = (pageNumber - 1) * MAX_MATCHES_PER_PAGE;
    const annotationsPagedArray = annotationListFiltered.slice(startIndex, startIndex + MAX_MATCHES_PER_PAGE);

    const isLastPage = pageTotal === pageNumber;
    const isFirstPage = pageNumber === 1;
    const isPaginated = pageTotal > 1;
    const pageOptions = Array.from({ length: pageTotal }, (_k, v) => (v += 1, ({ id: v, name: `${v} / ${pageTotal}` })));
    const begin = startIndex + 1;
    const end = Math.min(startIndex + MAX_MATCHES_PER_PAGE, annotationListFiltered.length);

    const triggerEdition = (annotationItem: INoteState) =>
        (value: boolean) => value ? updateDialogOrDockDataInfo({id: annotationItem.uuid, edit: true}) : updateDialogOrDockDataInfo({id: "", edit: false});

    const nbOfFilters = ((tagArrayFilter === "all") ?
        selectTagOption.length : tagArrayFilter.size) + ((colorArrayFilter === "all") ?
            annotationsColors.length : colorArrayFilter.size) + ((drawTypeArrayFilter === "all") ?
                selectDrawtypesOptions.length : drawTypeArrayFilter.size) + ((creatorArrayFilter === "all") ?
                    selectCreatorOptions.length : creatorArrayFilter.size);

    const paginatorAnnotationsRef = React.useRef<HTMLSelectElement>();
    const annotationTitleRef = React.useRef<HTMLInputElement>();
    const selectFileTypeRef = React.useRef<HTMLSelectElement & { value: "html" | "annotation" }>();

    return (
        <>
            <div className={stylesAnnotations.annotations_filter_line}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Popover.Root open={sortingOpen} onOpenChange={(open) => setSortingOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.sorting.sortingOptions")} className={stylesAnnotations.annotations_filter_trigger_button}
                                title={__("reader.annotations.sorting.sortingOptions")}>
                                <SVG svg={SortIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_sorting_container} style={{ maxHeight: Math.round(window.innerHeight / 2) }}>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                <ListBox
                                    selectedKeys={sortType}
                                    onSelectionChange={setSortType}
                                    selectionMode="multiple"
                                    selectionBehavior="replace"
                                    aria-label={__("reader.annotations.sorting.sortingOptions")}
                                >
                                    <ListBoxItem id="progression" key="progression" aria-label="progression" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                        style={{ marginBottom: "5px" }}
                                    >
                                        {__("reader.annotations.sorting.progression")}
                                    </ListBoxItem>
                                    <ListBoxItem id="lastCreated" key="lastCreated" aria-label="lastCreated" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                        style={{ marginBottom: "5px" }}
                                    >
                                        {__("reader.annotations.sorting.lastcreated")}
                                    </ListBoxItem>
                                    <ListBoxItem id="lastModified" key="lastModified" aria-label="lastModified" className={({ isFocused, isSelected }) =>
                                        classNames(StylesCombobox.my_item, isFocused ? StylesCombobox.focused : "", isSelected ? StylesCombobox.selected : "")}
                                    >
                                        {__("reader.annotations.sorting.lastmodified")}
                                    </ListBoxItem>
                                </ListBox>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <Popover.Root open={filterOpen} onOpenChange={(open) => setFilterOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.filter.filterOptions")} className={stylesAnnotations.annotations_filter_trigger_button}
                                title={__("reader.annotations.filter.filterOptions")}>
                                <SVG svg={MenuIcon} />
                                {nbOfFilters > 0 ?
                                    <p className={stylesAnnotations.annotations_filter_nbOfFilters} style={{ fontSize: nbOfFilters > 9 ? "10px" : "12px", paddingLeft: nbOfFilters > 9 ? "3px" : "4px" }}>{nbOfFilters}</p>
                                    : <></>
                                }
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_filter_container} style={{ maxHeight: Math.round(window.innerHeight / 2) }}>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                <FocusLock>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={tagArrayFilter}
                                        onSelectionChange={setTagArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByTag")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="annotationListTagDetails">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: !selectTagOption.length ? "none" : "auto", opacity: !selectTagOption.length ? "0.5" : "1" }}
                                             tabIndex={!selectTagOption.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByTag")}</Label>
                                                <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={tagArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter("all");
                                                            const detailsElement = document.getElementById("annotationListTagDetails") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            {
                                                selectTagOption.length ?
                                            <TagList items={selectTagOption} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: !selectTagOption.length ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                            </TagList>
                                            : <></>
                                            }
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={colorArrayFilter}
                                        onSelectionChange={setColorArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByColor")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="annotationListColorDetails">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup}>
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByColor")}</Label>
                                                <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={colorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setColorArrayFilter("all");
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
                                                            setColorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={annotationsColors} className={stylesAnnotations.annotations_filter_taglist}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_color} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name} ref={(r) => { if (r && (r as unknown as HTMLDivElement).setAttribute) { (r as unknown as HTMLDivElement).setAttribute("title", item.name); } }}></Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={drawTypeArrayFilter}
                                        onSelectionChange={setDrawTypeArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByDrawtype")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="annotationListDrawDetails">
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup}>
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByDrawtype")}</Label>
                                                <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={drawTypeArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setDrawTypeArrayFilter("all");
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
                                                            setDrawTypeArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={selectDrawtypesOptions} className={stylesAnnotations.annotations_filter_taglist}>
                                                {(item) => <Tag id={item.name} className={stylesAnnotations.annotations_filter_drawtype} textValue={item.textValue}><SVG svg={item.svg} /></Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={creatorArrayFilter}
                                        onSelectionChange={setCreatorArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByCreator")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details id="annotationListCreator" open={!!selectCreatorOptions.length}>
                                            <summary className={stylesAnnotations.annotations_filter_tagGroup} style={{ pointerEvents: !selectCreatorOptions.length ? "none" : "auto", opacity: !selectCreatorOptions.length ? "0.5" : "1" }}
                                                tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByCreator")}</Label>
                                                <div style={{ display: "flex", gap: "10px", marginRight: "10px" }}>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={creatorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter("all");
                                                            const detailsElement = document.getElementById("annotationListCreator") as HTMLDetailsElement;
                                                            if (detailsElement) {
                                                                detailsElement.open = true;
                                                            }

                                                        }}>
                                                        {__("reader.annotations.filter.all")}
                                                    </button>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter(new Set([]));

                                                        }}>
                                                        {__("reader.annotations.filter.none")}
                                                    </button>
                                                </div>
                                            </summary>
                                            <TagList items={selectCreatorOptions} className={stylesAnnotations.annotations_filter_taglist} style={{ margin: !selectCreatorOptions.length ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesAnnotations.annotations_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                </FocusLock>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {readiumAnnotationImportExportEnabled ? <>
                        <ImportAnnotationsDialog winId={winId} publicationView={publicationView}>
                            <button className={stylesAnnotations.annotations_filter_trigger_button}
                                title={__("catalog.importAnnotation")}
                                aria-label={__("catalog.importAnnotation")}>
                                <SVG svg={ImportIcon} />
                            </button>
                        </ImportAnnotationsDialog>

                    <Popover.Root>
                            <Popover.Trigger asChild>
                                <button className={stylesAnnotations.annotations_filter_trigger_button} disabled={!annotationListFiltered.length}
                                    title={__("catalog.exportAnnotation")}
                                    aria-label={__("catalog.exportAnnotation")}>
                                    <SVG svg={SaveIcon} />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} align="end" hideWhenDetached sideOffset={5} className={stylesAnnotations.annotations_sorting_container} style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}>
                                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                    <div
                                        className={stylesAnnotations.annotationsTitle_form_container}
                                    >
                                        <p>{__("reader.annotations.annotationsExport.description")}</p>
                                        <div className={stylesInputs.form_group}>
                                            <label htmlFor="annotationsTitle">{__("reader.annotations.annotationsExport.title")}</label>
                                            <input
                                                type="text"
                                                defaultValue={annoSetTitle}
                                                name="annotationsTitle"
                                                id="annotationsTitle"
                                                ref={annotationTitleRef}
                                                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                            />
                                            <select defaultValue="annotation" style={{ height: "inherit", border: "none", marginLeft: "5px" }} ref={selectFileTypeRef} name="file_type">
                                                <option value="annotation">.annotation</option>
                                                <option value="html">.html</option>
                                            </select>
                                        </div>

                                    <Popover.Close aria-label={__("reader.annotations.export")} asChild>
                                            <button onClick={async () => {
                                                const fileType = selectFileTypeRef.current?.value || "annotation";
                                                await getSaga().run(exportAnnotationSet, annotationListFiltered, publicationView, annotationTitleRef?.current?.value || annoSetTitle, fileType).toPromise();
                                            }} className={stylesButtons.button_primary_blue}>
                                                <SVG svg={SaveIcon} />
                                                {__("reader.annotations.export")}
                                            </button>
                                        </Popover.Close>
                                    </div>
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </> : <></>}
                    <AlertDialog.Root>
                        <AlertDialog.Trigger className={stylesAnnotations.annotations_filter_trigger_button} disabled={!deletableAnnotationListFiltered.length} title={__("dialog.deleteAnnotations")} aria-label={__("dialog.deleteAnnotations")}>
                            <SVG svg={TrashIcon} ariaHidden />
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                            <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                            <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                                <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deleteAnnotations")}</AlertDialog.Title>
                                <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                                    {__("dialog.deleteAnnotationsText", { count: deletableAnnotationListFiltered.length })}
                                </AlertDialog.Description>
                                <div className={stylesAlertModals.AlertDialogButtonContainer}>
                                    <AlertDialog.Cancel asChild>
                                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                        <button className={stylesButtons.button_primary_blue} onClick={() => {
                                            updateDialogOrDockDataInfo({id: "", edit: false});
                                            for (const annotation of deletableAnnotationListFiltered) {

                                                dispatch(readerActions.note.remove.build(annotation));
                                            }

                                            // reset filters
                                            setTagArrayFilter(new Set([]));
                                            setColorArrayFilter(new Set([]));
                                            setDrawTypeArrayFilter(new Set([]));
                                            setCreatorArrayFilter(new Set([]));
                                        }} type="button">
                                            <SVG ariaHidden svg={TrashIcon} />
                                            {__("dialog.yes")}</button>
                                    </AlertDialog.Action>
                                </div>
                            </AlertDialog.Content>
                        </AlertDialog.Portal>
                    </AlertDialog.Root>
                    <span style={{height: "30px", width: "2px", borderRight: "2px solid var(--color-gray-50"}}></span>
                    <Popover.Root open={optionsOpen} onOpenChange={(open) => setOptionsOpen(open)}>
                        <Popover.Trigger className={stylesAnnotations.annotations_filter_trigger_button} title={__("reader.annotations.annotationsOptions")} aria-label={__("reader.annotations.annotationsOptions")}>
                            <SVG ariaHidden svg={OptionsIcon} />
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary} avoidCollisions alignOffset={-10} /* hideWhenDetached */ sideOffset={5} className={stylesAnnotations.annotations_filter_container} hideWhenDetached>
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="advancedAnnotations" className={stylesGlobal.checkbox_custom_input} name="advancedAnnotations" checked={serialAnnotator} onChange={advancedAnnotationsOnChange} />
                                    <label htmlFor="advancedAnnotations" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={serialAnnotator}
                                            aria-label={__("reader.annotations.advancedMode")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    advancedAnnotationsOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: serialAnnotator ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: serialAnnotator ? "var(--color-brand-primary)" : "transparent" }}>
                                            {serialAnnotator ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            }
                                        </div>
                                        <div aria-hidden>
                                            <h3>{__("reader.annotations.advancedMode")}</h3>
                                        </div>
                                    </label>
                                </div>
                                {/* : <></>} */}
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="quickAnnotations" name="quickAnnotations" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_popoverNotOpenOnNoteTaking}
                                        onChange={quickAnnotationsOnChange}
                                    />
                                    <label htmlFor="quickAnnotations" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_popoverNotOpenOnNoteTaking}
                                            aria-label={__("reader.annotations.quickAnnotations")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    quickAnnotationsOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: readerConfig.annotation_popoverNotOpenOnNoteTaking ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: readerConfig.annotation_popoverNotOpenOnNoteTaking ? "var(--color-brand-primary)" : "transparent" }}>
                                            {readerConfig.annotation_popoverNotOpenOnNoteTaking ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            } </div>
                                        <h3 aria-hidden>{__("reader.annotations.quickAnnotations")}</h3></label>
                                </div>
                                {!isPdf ?
                                    <div className={stylesAnnotations.annotations_checkbox}>
                                        <input type="checkbox" id="marginAnnotations" name="marginAnnotations" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_defaultDrawView === "margin"} onChange={marginAnnotationsOnChange} />
                                        <label htmlFor="marginAnnotations" className={stylesGlobal.checkbox_custom_label}>
                                            <div
                                                tabIndex={0}
                                                role="checkbox"
                                                aria-checked={readerConfig.annotation_defaultDrawView === "margin"}
                                                aria-label={__("reader.annotations.toggleMarginMarks")}
                                                onKeyDown={(e) => {
                                                    // if (e.code === "Space") {
                                                    if (e.key === " ") {
                                                        e.preventDefault(); // prevent scroll
                                                    }
                                                }}
                                                onKeyUp={(e) => {
                                                    // if (e.code === "Space") {
                                                    if (e.key === " ") {
                                                        e.preventDefault();
                                                        marginAnnotationsOnChange();
                                                    }
                                                }}
                                                className={stylesGlobal.checkbox_custom}
                                                style={{ border: readerConfig.annotation_defaultDrawView === "margin" ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: readerConfig.annotation_defaultDrawView === "margin" ? "var(--color-brand-primary)" : "transparent" }}>
                                                {readerConfig.annotation_defaultDrawView === "margin" ?
                                                    <SVG ariaHidden svg={CheckIcon} />
                                                    :
                                                    <></>
                                                }
                                            </div>
                                            <h3 aria-hidden>{__("reader.annotations.toggleMarginMarks")}</h3></label>
                                    </div> : <></>}
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="hideAnnotation" name="hideAnnotation" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_defaultDrawView === "hide"} onChange={hideAnnotationOnChange} />
                                    <label htmlFor="hideAnnotation" className={stylesGlobal.checkbox_custom_label}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_defaultDrawView === "hide"}
                                            aria-label={__("reader.annotations.hide")}
                                            onKeyDown={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault(); // prevent scroll
                                                }
                                            }}
                                            onKeyUp={(e) => {
                                                // if (e.code === "Space") {
                                                if (e.key === " ") {
                                                    e.preventDefault();
                                                    hideAnnotationOnChange();
                                                }
                                            }}
                                            className={stylesGlobal.checkbox_custom}
                                            style={{ border: readerConfig.annotation_defaultDrawView === "hide" ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: readerConfig.annotation_defaultDrawView === "hide" ? "var(--color-brand-primary)" : "transparent" }}>
                                            {readerConfig.annotation_defaultDrawView === "hide" ?
                                                <SVG ariaHidden svg={CheckIcon} />
                                                :
                                                <></>
                                            }
                                        </div>
                                        <h3 aria-hidden>{__("reader.annotations.hide")}</h3></label>
                                </div>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
            </div>
            <div className={stylesAnnotations.separator} />
            <ol>
                {annotationsPagedArray.map((annotationItem, _i) =>
                    <AnnotationCard
                        key={`annotation-card_${annotationItem.uuid}`}
                        annotation={annotationItem}
                        goToLocator={goToLocator}
                        goToPdfAnnotation={goToPdfAnnotation}
                        isEdited={annotationItem.uuid === needToFocusOnID && annotationEdit}
                        isSelected={annotationItem.uuid === needToFocusOnID}
                        triggerEdition={triggerEdition(annotationItem)}
                        setTagFilter={(v) => setTagArrayFilter(new Set([v]))}
                        setCreatorFilter={(v) => setCreatorArrayFilter(new Set([v]))}
                    />,
                )}
            </ol>
            {
                isPaginated ? <>
                    <div className={stylesPopoverDialog.navigation_container}>
                        <button title={__("opds.firstPage")}
                            onClick={() => { changePageNumber(() => 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")}
                            onClick={() => { changePageNumber((pageNumber) => pageNumber - 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>
                        <div className={stylesPopoverDialog.pages}>
                            {/* <SelectRef
                                ref={paginatorAnnotationsRef}
                                aria-label={__("reader.navigation.page")}
                                items={pageOptions}
                                selectedKey={pageNumber}
                                defaultSelectedKey={1}
                                onSelectionChange={(id) => {
                                    setPageNumber(id as number);
                                }}
                                label={__("reader.navigation.page")}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </SelectRef> */}
                            <label htmlFor="paginatorAnnotations" style={{ margin: "0" }}>{__("reader.navigation.page")}</label>
                            <select
                             onChange={(e) => {
                                if (!e.currentTarget?.value) {
                                    // console.error("No select Page currentTarget !!! ", e.currentTarget);
                                    return ;
                                }
                                const value = e.currentTarget.value;
                                const cb = () => pageOptions.find((option) => option.id === parseInt(value, 10)).id;
                                changePageNumber(cb);
                            }}
                                ref={paginatorAnnotationsRef}
                                id="paginatorAnnotations"
                                aria-label={__("reader.navigation.page")}
                                // defaultValue={1}
                                value={pageNumber}
                            >
                                {pageOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                            {/* <ComboBox
                                aria-label={__("reader.navigation.page")}
                                items={pageOptions}
                                selectedKey={pageNumber}
                                defaultSelectedKey={1}
                                onSelectionChange={(id) => {
                                    changePageNumber(() => id as number); setItemToEdit(-1);
                                }}
                            >
                                {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                            </ComboBox> */}
                        </div>
                        <button title={__("opds.next")}
                            onClick={() => { changePageNumber((pageNumber) => pageNumber + 1); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")}
                            onClick={() => { changePageNumber(() => pageTotal); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowLastIcon} />
                        </button>
                    </div>
                    {
                        annotationListFiltered.length &&
                        <p
                            style={{
                                textAlign: "center",
                                padding: 0,
                                margin: 0,
                                marginTop: "-16px",
                                marginBottom: "20px",
                            }}>{`[ ${begin === end ? `${end}` : `${begin} ... ${end}`} ] / ${annotationListFiltered.length}`}</p>
                    }
                </>
                    : <></>
            }
        </>
    );
};
