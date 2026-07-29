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
import * as stylesBookmarks from "readium-desktop/renderer/assets/styles/components/bookmarks.scss";
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
import { ImportAnnotationsDialog } from "readium-desktop/renderer/common/components/ImportAnnotationsDialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { DockTypeName } from "readium-desktop/common/models/dock";
import { withoutPublicationNotesViewPagination, type PublicationNote } from "readium-desktop/common/publication-notes";
import { noteColorCodeToColorTranslatorKeySet } from "readium-desktop/common/publication-notes/colors";

import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { BookmarkCard } from "../ReaderMenu/BookmarkCard";
import { selectPublicationNoteViewTagsIndex, selectPublicationNotesViewState } from "../../publication-notes/selectors";
import { selectionToPublicationNotesViewSelection, selectionToPublicationNotesViewSort } from "../../publication-notes/viewFilters";

export const BookmarkList: React.FC<{ popoverBoundary: HTMLDivElement, hideBookmarkOnChange: () => void, START_PAGE: number, MAX_MATCHES_PER_PAGE: number } & Pick<IReaderMenuProps, "goToLocator">> = (props) => {

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);

    const { goToLocator, popoverBoundary, hideBookmarkOnChange, START_PAGE, MAX_MATCHES_PER_PAGE } = props;

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

    const { id: needToFocusOnID, edit: bookmarkEdit, focusRequestId } = dialogOrDockDataInfo;
    const [bookmarkUUID, setBookmarkUUID] = React.useState(needToFocusOnID);
    React.useEffect(() => {
        setBookmarkUUID(needToFocusOnID);
        setTagArrayFilter(new Set([]));
        setColorArrayFilter(new Set([]));
        setCreatorArrayFilter(new Set([]));
        setSortingOpen(false);
        setFilterOpen(false);
        setOptionsOpen(false);

    }, [focusRequestId, needToFocusOnID]);

    const paginatorBookmarksRef = React.useRef<HTMLSelectElement>();

    const [__] = useTranslator();
    const publicationNotesView = useSelector(selectPublicationNotesViewState);
    const bookmarksViewReady = publicationNotesView.filter.group === "bookmark";
    const bookmarkList = bookmarksViewReady ? publicationNotesView.notes : [];
    const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    const publicationView = useSelector((state: IReaderRootState) => state.reader.info.publicationView);
    const winId = useSelector((state: IReaderRootState) => state.win.identifier);
    const locale = useSelector((state: IReaderRootState) => state.i18n.locale);
    const [colorArrayFilter, setColorArrayFilter] = React.useState<Selection>(new Set([]));
    const [creatorArrayFilter, setCreatorArrayFilter] = React.useState<Selection>(new Set([]));
    const [tagArrayFilter, setTagArrayFilter] = React.useState<Selection>(new Set([]));
    const [sortType, setSortType] = React.useState<Selection>(new Set(["lastCreated"]));
    const publicationNotesViewFilter = React.useMemo(() => ({
        group: "bookmark" as const,
        tags: selectionToPublicationNotesViewSelection(tagArrayFilter),
        colors: selectionToPublicationNotesViewSelection(colorArrayFilter),
        creators: selectionToPublicationNotesViewSelection(creatorArrayFilter),
        sort: selectionToPublicationNotesViewSort(sortType),
    }), [colorArrayFilter, creatorArrayFilter, sortType, tagArrayFilter]);

    React.useEffect(() => {
        if (!pubId) {
            return;
        }
        dispatch(readerActions.publicationNotes.filter.build(pubId, {
            ...publicationNotesViewFilter,
            pagination: {
                page: START_PAGE,
                pageSize: MAX_MATCHES_PER_PAGE,
            },
        }));
    }, [MAX_MATCHES_PER_PAGE, START_PAGE, dispatch, pubId, publicationNotesViewFilter]);

    const creatorListName = React.useMemo(() => bookmarksViewReady ? publicationNotesView.facets.creators : [], [bookmarksViewReady, publicationNotesView.facets.creators]);
    const selectCreatorOptions = React.useMemo(() => [...(new Set(creatorListName))].map((name, index) => ({ id: `${index}_${name}`, name })), [creatorListName]);

    const bookmarksColors = React.useMemo(() => Object.entries(noteColorCodeToColorTranslatorKeySet).map(([k, v]) => ({ hex: k, name: __(v) })), [__]);

    const tagsIndexListAll = useSelector(selectPublicationNoteViewTagsIndex);
    const tagsIndexList = React.useMemo(() => bookmarksViewReady ? tagsIndexListAll : [], [bookmarksViewReady, tagsIndexListAll]);
    const selectTagOption = React.useMemo(() => tagsIndexList.map((v, i) => ({ id: i, name: v.tag })), [tagsIndexList]);

    const bookmarksPagination = publicationNotesView.pagination;
    const bookmarksPagedArray = bookmarksViewReady ? bookmarksPagination.notes : [];
    const pageNumber = bookmarksViewReady ? bookmarksPagination.page : START_PAGE;
    const pageTotal = bookmarksViewReady ? bookmarksPagination.pageTotal : 1;
    const totalCount = bookmarksViewReady ? bookmarksPagination.totalCount : 0;

    const isLastPage = pageTotal === pageNumber;
    const isFirstPage = pageNumber === 1;
    const isPaginated = pageTotal > 1;
    const pageOptions = Array.from({ length: pageTotal }, (_k, v) => (v += 1, ({ id: v, name: `${v} / ${pageTotal}` })));


    const begin = bookmarksViewReady ? bookmarksPagination.begin : 0;
    const end = bookmarksViewReady ? bookmarksPagination.end : 0;

    const requestPublicationNotesPage = React.useCallback((page: number, anchorUuid?: string) => {
        if (!pubId) {
            return;
        }
        dispatch(readerActions.publicationNotes.filter.build(pubId, {
            ...publicationNotesViewFilter,
            pagination: {
                page,
                pageSize: MAX_MATCHES_PER_PAGE,
                anchorUuid,
            },
        }));
    }, [MAX_MATCHES_PER_PAGE, dispatch, pubId, publicationNotesViewFilter]);

    const changePageNumber = React.useCallback((cb: (n: number) => number) => {
        setTimeout(() => paginatorBookmarksRef.current?.focus(), 100);
        updateDialogOrDockDataInfo({id: "", edit: false});
        requestPublicationNotesPage(Math.max(cb(pageNumber), START_PAGE));
    }, [START_PAGE, pageNumber, requestPublicationNotesPage, updateDialogOrDockDataInfo]);

    React.useEffect(() => {
        if (bookmarkUUID) {
            const anchorUuid = bookmarkUUID;
            setBookmarkUUID("");
            requestPublicationNotesPage(START_PAGE, anchorUuid);
        }
    }, [bookmarkUUID, requestPublicationNotesPage, START_PAGE]);

    const triggerEdition = (bookmarkItem: PublicationNote) =>
        (value: boolean) => value ? updateDialogOrDockDataInfo({id: bookmarkItem.uuid, edit: true}) : updateDialogOrDockDataInfo({id: "", edit: false});


    const nbOfFilters = ((tagArrayFilter === "all") ?
        selectTagOption.length : tagArrayFilter.size) + (creatorArrayFilter === "all" ?
            selectCreatorOptions.length : creatorArrayFilter.size) + ((colorArrayFilter === "all") ?
                bookmarksColors.length : colorArrayFilter.size);

    const bookmarkTitleRef = React.useRef<HTMLInputElement>();
    const selectFileTypeRef = React.useRef<HTMLSelectElement & { value: "html" | "annotation" }>();

    const textObj = publicationView.publicationTitle;
    const pubLangs = publicationView.languages;
    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
    // r2Publication.Metadata.Title
    const annoSetTitle = convertMultiLangStringToString(textObj_,  locale) || "thorium-notes_bookmarks";

    return (
        <>
            <div className={stylesBookmarks.bookmarks_filter_line}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Popover.Root modal open={sortingOpen} onOpenChange={(open) => setSortingOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.sorting.sortingOptions")} className={stylesBookmarks.bookmarks_filter_trigger_button}
                                title={__("reader.annotations.sorting.sortingOptions")}>
                                <SVG svg={SortIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_sorting_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2) }}
                            >
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
                    <Popover.Root modal open={filterOpen} onOpenChange={(open) => setFilterOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.filter.filterOptions")} className={stylesBookmarks.bookmarks_filter_trigger_button}
                                title={__("reader.annotations.filter.filterOptions")}>
                                <SVG svg={MenuIcon} />
                                {nbOfFilters > 0 ?
                                    <p className={stylesBookmarks.bookmarks_filter_nbOfFilters} style={{ fontSize: nbOfFilters > 9 ? "10px" : "12px", paddingLeft: nbOfFilters > 9 ? "3px" : "4px" }}>{nbOfFilters}</p>
                                    : <></>
                                }
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_filter_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2) }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                <FocusLock>
                                    <TagGroup
                                        selectionMode="multiple"
                                        selectedKeys={tagArrayFilter}
                                        onSelectionChange={setTagArrayFilter}
                                        aria-label={__("reader.annotations.filter.filterByTag")}
                                        style={{ marginBottom: "20px" }}
                                    >
                                        <details open id="bookmark-tags-list-details">
                                            <summary className={stylesBookmarks.bookmarks_filter_tagGroup} style={{ pointerEvents: !selectTagOption.length ? "none" : "auto", opacity: !selectTagOption.length ? "0.5" : "1" }}
                                                tabIndex={!selectTagOption.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByTag")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        disabled={!selectTagOption.length}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={tagArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setTagArrayFilter("all");
                                                            const detailsElement = document.getElementById("bookmark-tags-list-details") as HTMLDetailsElement;
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
                                                    <TagList items={selectTagOption} className={stylesBookmarks.bookmarks_filter_taglist} style={{ margin: !selectTagOption.length ? "0" : "20px 0" }}>
                                                        {(item) => <Tag className={stylesBookmarks.bookmarks_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
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
                                        <details open id="bookmark-color-list">
                                            <summary className={stylesBookmarks.bookmarks_filter_tagGroup}>
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByColor")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={colorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setColorArrayFilter("all");
                                                            const detailsElement = document.getElementById("bookmark-color-list") as HTMLDetailsElement;
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
                                            <TagList items={bookmarksColors} className={stylesBookmarks.bookmarks_filter_taglist}>
                                                {(item) => <Tag className={stylesBookmarks.bookmarks_filter_color} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name} ref={(r) => { if (r && (r as unknown as HTMLDivElement).setAttribute) { (r as unknown as HTMLDivElement).setAttribute("title", item.name); } }}></Tag>}
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
                                        <details id="bookmark-creator-list-details" open={!!selectCreatorOptions.length}>
                                            <summary className={stylesBookmarks.bookmarks_filter_tagGroup} style={{ pointerEvents: !selectCreatorOptions.length ? "none" : "auto", opacity: !selectCreatorOptions.length ? "0.5" : "1" }}
                                                tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                            >
                                                <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByCreator")}</Label>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <button
                                                        tabIndex={!selectCreatorOptions.length ? -1 : 0}
                                                        style={{ width: "fit-content", minWidth: "unset" }}
                                                        className={creatorArrayFilter === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                                                        onClick={() => {
                                                            setCreatorArrayFilter("all");
                                                            const detailsElement = document.getElementById("bookmark-creator-list-details") as HTMLDetailsElement;
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
                                            <TagList items={selectCreatorOptions} className={stylesBookmarks.bookmarks_filter_taglist} style={{ margin: !selectCreatorOptions.length ? "0" : "20px 0" }}>
                                                {(item) => <Tag className={stylesBookmarks.bookmarks_filter_tag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                                            </TagList>
                                        </details>
                                    </TagGroup>
                                </FocusLock>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <ImportAnnotationsDialog winId={winId} publicationView={publicationView}>
                        <button className={stylesBookmarks.bookmarks_filter_trigger_button}
                            title={__("catalog.importAnnotation")}
                            aria-label={__("catalog.importAnnotation")}>
                            <SVG svg={ImportIcon} />
                        </button>
                    </ImportAnnotationsDialog>

                    <Popover.Root modal>
                        <Popover.Trigger asChild>
                            <button className={stylesBookmarks.bookmarks_filter_trigger_button} disabled={!bookmarkList.length}
                                title={__("catalog.exportAnnotation")}
                                aria-label={__("catalog.exportAnnotation")}>
                                <SVG svg={SaveIcon} />
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_sorting_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                <div
                                    className={stylesBookmarks.bookmarksTitle_form_container}
                                >
                                    <p>{__("reader.annotations.annotationsExport.description")}</p>
                                    <div className={stylesInputs.form_group}>
                                        <label htmlFor="annotationsTitle">{__("reader.annotations.annotationsExport.title")}</label>
                                        <input
                                            type="text"
                                            defaultValue={annoSetTitle}
                                            name="annotationsTitle"
                                            id="annotationsTitle"
                                            ref={bookmarkTitleRef}
                                            className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                                        />
                                        <select defaultValue="annotation" style={{ height: "inherit", border: "none", marginLeft: "5px" }} ref={selectFileTypeRef} name="file_type">
                                            <option value="annotation">.annotation</option>
                                            <option value="html">.html</option>
                                        </select>
                                    </div>

                                    <Popover.Close aria-label={__("reader.annotations.export")} asChild>
                                        <button onClick={() => {
                                            if (!pubId) {
                                                return;
                                            }
                                            const fileType = selectFileTypeRef.current?.value || "annotation";
                                            dispatch(readerActions.publicationNotes.export.build(
                                                pubId,
                                                withoutPublicationNotesViewPagination(publicationNotesView.filter),
                                                bookmarkTitleRef?.current?.value || annoSetTitle,
                                                fileType,
                                            ));
                                        }} className={stylesButtons.button_primary_blue}>
                                            <SVG svg={SaveIcon} />
                                            {__("reader.annotations.export")}
                                        </button>
                                    </Popover.Close>
                                </div>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <AlertDialog.Root>
                        <AlertDialog.Trigger className={stylesBookmarks.bookmarks_filter_trigger_button} disabled={!bookmarkList.length} title={__("dialog.deleteBookmarks")} aria-label={__("dialog.deleteBookmarks")}>
                            <SVG svg={TrashIcon} ariaHidden />
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                            <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                            <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                                <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__("dialog.deleteBookmarks")}</AlertDialog.Title>
                                <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                                    {__("dialog.deleteBookmarksText", { count: bookmarkList.length })}
                                </AlertDialog.Description>
                                <div className={stylesAlertModals.AlertDialogButtonContainer}>
                                    <AlertDialog.Cancel asChild>
                                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                        <button className={stylesButtons.button_primary_blue} onClick={() => {
                                            updateDialogOrDockDataInfo({id: "", edit: false});
                                            for (const bookmark of bookmarkList) {

                                                dispatch(readerActions.publicationNotes.commands.remove.build(pubId, bookmark));
                                            }

                                            // reset filters
                                            setCreatorArrayFilter(new Set([]));
                                            setColorArrayFilter(new Set([]));
                                            setTagArrayFilter(new Set([]));
                                        }} type="button">
                                            <SVG ariaHidden svg={TrashIcon} />
                                            {__("dialog.yes")}</button>
                                    </AlertDialog.Action>
                                </div>
                            </AlertDialog.Content>
                        </AlertDialog.Portal>
                    </AlertDialog.Root>
                    <span style={{ height: "30px", width: "2px", borderRight: "2px solid var(--color-gray-50" }}></span>
                    <Popover.Root modal open={optionsOpen} onOpenChange={(open) => setOptionsOpen(open)}>
                        <Popover.Trigger className={stylesAnnotations.annotations_filter_trigger_button} title={__("reader.annotations.annotationsOptions")} aria-label={__("reader.annotations.annotationsOptions")}>
                            <SVG ariaHidden svg={OptionsIcon} />
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align="end"
                                hideWhenDetached
                                sideOffset={5}
                                className={stylesBookmarks.bookmarks_filter_container}
                                style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}
                            >
                                <div className={stylesAnnotations.annotations_checkbox}>
                                    <input type="checkbox" id="hideBookmark" name="hideBookmark" className={stylesGlobal.checkbox_custom_input} checked={readerConfig.annotation_defaultDrawView === "hide"} onChange={hideBookmarkOnChange} />
                                    <label htmlFor="hideBookmark" className={stylesGlobal.checkbox_custom_label} style={{ marginLeft: "10px" }}>
                                        <div
                                            tabIndex={0}
                                            role="checkbox"
                                            aria-checked={readerConfig.annotation_defaultDrawView === "hide"} // TODO: replace annotation_defaultDrawView with note_defaultDrawView, this is applicable both annotation and bookmark
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
                                                    hideBookmarkOnChange();
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
                                        <span aria-hidden>
                                            {__("reader.annotations.hide")}
                                        </span>
                                    </label>
                                </div>
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
            </div>
            <div className={stylesAnnotations.separator} />
            <ol style={{ paddingLeft: "0px" }}>
                {bookmarksPagedArray.map((bookmarkItem, _i) =>
                    <BookmarkCard
                        key={`bookmark-card_${bookmarkItem.uuid}`}
                        bookmark={bookmarkItem}
                        goToLocator={goToLocator}
                        isEdited={bookmarkItem.uuid === needToFocusOnID && bookmarkEdit}
                        isSelected={bookmarkItem.uuid === needToFocusOnID}
                        focusRequestId={focusRequestId}
                        triggerEdition={triggerEdition(bookmarkItem)}
                        setCreatorFilter={(v) => setCreatorArrayFilter(new Set([v]))}
                        setTagFilter={((v) => setTagArrayFilter(new Set([v])))}
                    />,
                )}
            </ol>
            {
                isPaginated ? <>
                    <div className={stylesPopoverDialog.navigation_container}>
                        <button title={__("opds.firstPage")} // TODO: change i18n label
                            onClick={() => { changePageNumber(() => 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")} // TODO: change i18n label
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
                            <label htmlFor="paginatorBookmarks" style={{ margin: "0" }}>{__("reader.navigation.page")}</label>
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
                                ref={paginatorBookmarksRef}
                                id="paginatorBookmarks"
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
                        <button title={__("opds.next")} // TODO: change i18n label
                            onClick={() => { changePageNumber((pageNumber) => pageNumber + 1); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")} // TODO: change i18n label
                            onClick={() => { changePageNumber(() => pageTotal); }}
                            disabled={isLastPage}>
                            <SVG ariaHidden={true} svg={ArrowLastIcon} />
                        </button>
                    </div>
                    {
                        totalCount &&
                        <p
                            style={{
                                textAlign: "center",
                                padding: 0,
                                margin: 0,
                                marginTop: "-16px",
                                marginBottom: "20px",
                            }}>{`[ ${begin === end ? `${end}` : `${begin} ... ${end}`} ] / ${totalCount}`}</p>
                    }
                </>
                    : <></>
            }
        </>
    );
};
