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
import * as HighLightIcon from "readium-desktop/renderer/assets/icons/highlight-icon.svg";
import * as UnderLineIcon from "readium-desktop/renderer/assets/icons/underline-icon.svg";
import * as TextStrikeThroughtIcon from "readium-desktop/renderer/assets/icons/TextStrikethrough-icon.svg";
import * as TextOutlineIcon from "readium-desktop/renderer/assets/icons/TextOutline-icon.svg";

import * as Popover from "@radix-ui/react-popover";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ListBox, ListBoxItem  } from "react-aria-components";
import type { Selection } from "react-aria-components";
import { TagGroup, TagList, Tag, Label } from "react-aria-components";
import { replace } from "redux-first-history";
import { matchPath, useLocation } from "react-router-dom";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerAnalyticsEvents } from "readium-desktop/common/analytics/reader";
import { dialogActions, dockActions, readerActions } from "readium-desktop/common/redux/actions";
import { IReaderDialogOrDockSettingsMenuState } from "readium-desktop/common/models/reader";
import { ImportAnnotationsDialog } from "readium-desktop/renderer/common/components/ImportAnnotationsDialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { DockTypeName } from "readium-desktop/common/models/dock";
import {
    withoutPublicationNotesViewPagination,
    type PublicationNote,
    type PublicationNoteGroup,
    type PublicationNotesViewFilter,
} from "readium-desktop/common/publication-notes";
import { noteColorCodeToColorTranslatorKeySet } from "readium-desktop/common/publication-notes/colors";

import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import {
    selectPublicationNotes,
    selectPublicationNotesHydratedView,
    selectPublicationNotesHydratedViewTagsIndex,
} from "../../publication-notes/selectors";
import { publicationNotesViewSortToSelection, selectionToEffectivePublicationNotesViewSort, selectionToPublicationNotesViewSelection } from "../../publication-notes/viewFilters";
import { logEvent } from "readium-desktop/renderer/common/analytics";
import {
    buildReaderMenuRoute,
    isReaderMenuRouteGroup,
    readerMenuRoutePattern,
} from "readium-desktop/renderer/reader/routing";

interface NoteListStyleSet {
    filterLine: string;
    filterTriggerButton: string;
    sortingContainer: string;
    filterContainer: string;
    filterNbOfFilters: string;
    filterTagGroup: string;
    filterTaglist: string;
    filterTag: string;
    filterColor: string;
    titleFormContainer: string;
    filterDrawtype?: string;
}

const noteListStyles: Record<PublicationNoteGroup, NoteListStyleSet> = {
    annotation: {
        filterLine: stylesAnnotations.annotations_filter_line,
        filterTriggerButton: stylesAnnotations.annotations_filter_trigger_button,
        sortingContainer: stylesAnnotations.annotations_sorting_container,
        filterContainer: stylesAnnotations.annotations_filter_container,
        filterNbOfFilters: stylesAnnotations.annotations_filter_nbOfFilters,
        filterTagGroup: stylesAnnotations.annotations_filter_tagGroup,
        filterTaglist: stylesAnnotations.annotations_filter_taglist,
        filterTag: stylesAnnotations.annotations_filter_tag,
        filterColor: stylesAnnotations.annotations_filter_color,
        titleFormContainer: stylesAnnotations.annotationsTitle_form_container,
        filterDrawtype: stylesAnnotations.annotations_filter_drawtype,
    },
    bookmark: {
        filterLine: stylesBookmarks.bookmarks_filter_line,
        filterTriggerButton: stylesBookmarks.bookmarks_filter_trigger_button,
        sortingContainer: stylesBookmarks.bookmarks_sorting_container,
        filterContainer: stylesBookmarks.bookmarks_filter_container,
        filterNbOfFilters: stylesBookmarks.bookmarks_filter_nbOfFilters,
        filterTagGroup: stylesBookmarks.bookmarks_filter_tagGroup,
        filterTaglist: stylesBookmarks.bookmarks_filter_taglist,
        filterTag: stylesBookmarks.bookmarks_filter_tag,
        filterColor: stylesBookmarks.bookmarks_filter_color,
        titleFormContainer: stylesBookmarks.bookmarksTitle_form_container,
    },
};

interface NoteListIds {
    colorDetails: string;
    creatorDetails: string;
    drawDetails?: string;
    paginator: string;
    tagDetails: string;
}

const noteListIds: Record<PublicationNoteGroup, NoteListIds> = {
    annotation: {
        colorDetails: "annotationListColorDetails",
        creatorDetails: "annotationListCreator",
        drawDetails: "annotationListDrawDetails",
        paginator: "paginatorAnnotations",
        tagDetails: "annotationListTagDetails",
    },
    bookmark: {
        colorDetails: "bookmark-color-list",
        creatorDetails: "bookmark-creator-list-details",
        paginator: "paginatorBookmarks",
        tagDetails: "bookmark-tags-list-details",
    },
};

interface TextFilterOption {
    id: number | string;
    name: string;
}

interface ColorFilterOption {
    hex: string;
    name: string;
}

interface DrawTypeFilterOption {
    name: string;
    svg: {};
    textValue: string;
}

export interface NoteListOption {
    ariaLabel?: string;
    checked: boolean;
    hidden?: boolean;
    id: string;
    label: string;
    labelStyle?: React.CSSProperties;
    name?: string;
    onChange: () => void;
}

export interface NoteListRenderContext {
    focusRequestId?: string;
    isEdited: boolean;
    isSelected: boolean;
    setCreatorFilter: (v: string) => void;
    setTagFilter: (v: string) => void;
    triggerEdition: (v: boolean) => void;
}

interface NoteListProps {
    cardKeyPrefix: string;
    exportTitleFallback: string;
    group: PublicationNoteGroup;
    importExportEnabled?: boolean;
    maxMatchesPerPage: number;
    options: NoteListOption[];
    popoverBoundary: HTMLDivElement;
    renderNote: (note: PublicationNote, context: NoteListRenderContext) => React.ReactNode;
    startPage: number;
}

const getSelectionSize = (selection: Selection, allSize: number) =>
    selection === "all" ? allSize : selection.size;

const openDetailsElement = (detailsId: string) => {
    const detailsElement = document.getElementById(detailsId) as HTMLDetailsElement;
    if (detailsElement) {
        detailsElement.open = true;
    }
};

export const NoteList: React.FC<NoteListProps> = (props) => {

    const {
        cardKeyPrefix,
        exportTitleFallback,
        group,
        importExportEnabled = true,
        maxMatchesPerPage,
        options,
        popoverBoundary,
        renderNote,
        startPage,
    } = props;

    const styles = noteListStyles[group];
    const ids = noteListIds[group];
    const [__] = useTranslator();

    const dispatch = useDispatch();
    const dockedMode = useSelector((state: IReaderRootState) => state.reader.config.readerDockingMode !== "full");
    const location = useLocation();
    const dialogOrDockDataInfo = useSelector((state: IReaderRootState): IReaderDialogOrDockSettingsMenuState =>
        (state.dialog.open && state.dialog.type === DialogTypeName.ReaderMenu) ?
            state.dialog.data as IReaderDialogOrDockSettingsMenuState : (state.dock.open && state.dock.type === DockTypeName.ReaderMenu) ?
                state.dock.data : {} as unknown as IReaderDialogOrDockSettingsMenuState);

    const [sortingOpen, setSortingOpen] = React.useState(false);
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const { id: needToFocusOnID, edit: noteEdit, focusRequestId, sort: routeSort } = dialogOrDockDataInfo;
    const updateDialogOrDockDataInfo = React.useCallback((data: Partial<IReaderDialogOrDockSettingsMenuState>) => {
        const nextData: IReaderDialogOrDockSettingsMenuState = {
            id: needToFocusOnID || "",
            edit: !!noteEdit,
            focusRequestId,
            sort: routeSort,
            ...data,
        };
        dispatch(dockedMode ? dockActions.updateRequest.build(nextData) : dialogActions.updateRequest.build(nextData));
    }, [dockedMode, dispatch, focusRequestId, needToFocusOnID, noteEdit, routeSort]);

    const [noteUUID, setNoteUUID] = React.useState("");
    const skipNextPageResetAfterAnchorRef = React.useRef(false);
    const focusedNoteUuidRef = React.useRef<string | undefined>();

    const paginatorRef = React.useRef<HTMLSelectElement>();
    const noteTitleRef = React.useRef<HTMLInputElement>();
    const selectFileTypeRef = React.useRef<HTMLSelectElement & { value: "html" | "annotation" }>();

    const pubId = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    const publicationView = useSelector((state: IReaderRootState) => state.reader.info.publicationView);
    const winId = useSelector((state: IReaderRootState) => state.win.identifier);
    const locale = useSelector((state: IReaderRootState) => state.i18n.locale);
    const publicationNotes = useSelector(selectPublicationNotes);

    const [tagArrayFilter, setTagArrayFilter] = React.useState<Selection>(new Set([]));
    const [colorArrayFilter, setColorArrayFilter] = React.useState<Selection>(new Set([]));
    const [drawTypeArrayFilter, setDrawTypeArrayFilter] = React.useState<Selection>(new Set([]));
    const [creatorArrayFilter, setCreatorArrayFilter] = React.useState<Selection>(new Set([]));

    const [sortType, setSortType] = React.useState<Selection>(() => publicationNotesViewSortToSelection(routeSort));

    const tagFilterSelection = React.useMemo(() => selectionToPublicationNotesViewSelection(tagArrayFilter), [tagArrayFilter]);
    const colorFilterSelection = React.useMemo(() => selectionToPublicationNotesViewSelection(colorArrayFilter), [colorArrayFilter]);
    const drawTypeFilterSelection = React.useMemo(() => selectionToPublicationNotesViewSelection(drawTypeArrayFilter), [drawTypeArrayFilter]);
    const creatorFilterSelection = React.useMemo(() => selectionToPublicationNotesViewSelection(creatorArrayFilter), [creatorArrayFilter]);

    const publicationNotesPageResetFilter = React.useMemo<PublicationNotesViewFilter>(() => {
        const filter: PublicationNotesViewFilter = {
            group,
            tags: tagFilterSelection,
            colors: colorFilterSelection,
            creators: creatorFilterSelection,
        };

        if (group === "annotation") {
            filter.drawTypes = drawTypeFilterSelection;
        }

        return filter;
    }, [colorFilterSelection, creatorFilterSelection, drawTypeFilterSelection, group, tagFilterSelection]);

    const publicationNotesViewBaseFilter = React.useMemo<PublicationNotesViewFilter>(() => ({
        ...publicationNotesPageResetFilter,
        sort: selectionToEffectivePublicationNotesViewSort(sortType),
    }), [publicationNotesPageResetFilter, sortType]);

    const [paginationRequest, setPaginationRequest] = React.useState<{
        anchorUuid?: string | undefined;
        page: number;
    }>(() => ({ page: startPage }));
    const previousRouteSortRef = React.useRef(routeSort);

    const publicationNotesViewFilter = React.useMemo<PublicationNotesViewFilter>(() => ({
        ...publicationNotesViewBaseFilter,
        pagination: {
            page: paginationRequest.page,
            pageSize: maxMatchesPerPage,
            ...(paginationRequest.anchorUuid ? { anchorUuid: paginationRequest.anchorUuid } : {}),
        },
    }), [maxMatchesPerPage, paginationRequest, publicationNotesViewBaseFilter]);

    const publicationNotesView = useSelector((state: IReaderRootState) =>
        selectPublicationNotesHydratedView(state, publicationNotesViewFilter));
    const viewReady = publicationNotesView.filter.group === group;
    const noteList = viewReady ? publicationNotesView.notes : [];
    const knownNoteUuidSet = React.useMemo(
        () => new Set(publicationNotes
            .filter((note) => note.group === group)
            .map((note) => note.uuid)),
        [group, publicationNotes],
    );
    const knownNoteUuidSetRef = React.useRef(knownNoteUuidSet);
    knownNoteUuidSetRef.current = knownNoteUuidSet;

    const getFocusedNoteUuid = React.useCallback((target: EventTarget | null): string | undefined => {
        if (!(target instanceof HTMLElement)) {
            return undefined;
        }

        return target.closest<HTMLElement>("[data-publication-note-uuid]")?.dataset.publicationNoteUuid;
    }, []);

    const getKnownNoteUuid = React.useCallback((uuid: string | undefined): string | undefined =>
        uuid && knownNoteUuidSetRef.current.has(uuid) ? uuid : undefined, []);

    const rememberFocusedNoteUuid = React.useCallback((target: EventTarget | null) => {
        const noteUuid = getKnownNoteUuid(getFocusedNoteUuid(target));
        if (noteUuid) {
            focusedNoteUuidRef.current = noteUuid;
        }
    }, [getFocusedNoteUuid, getKnownNoteUuid]);

    const getReaderMenuRouteMatch = React.useCallback(() => {
        const match = matchPath<"group" | "uuid", string>(readerMenuRoutePattern, location.pathname);
        const routeGroup = match?.params.group;
        const uuid = match?.params.uuid;
        if (!isReaderMenuRouteGroup(routeGroup) || routeGroup !== group || !uuid) {
            return undefined;
        }

        return { group: routeGroup, uuid };
    }, [group, location.pathname]);

    const getSortAnchorUuid = React.useCallback(
        () =>
            getKnownNoteUuid(focusedNoteUuidRef.current) ||
            getKnownNoteUuid(needToFocusOnID) ||
            getKnownNoteUuid(getReaderMenuRouteMatch()?.uuid),
        [getKnownNoteUuid, getReaderMenuRouteMatch, needToFocusOnID],
    );

    const requestPageForSortChange = React.useCallback((anchorUuid: string | undefined) => {
        if (anchorUuid) {
            skipNextPageResetAfterAnchorRef.current = true;
        }
        setPaginationRequest({
            page: startPage,
            ...(anchorUuid ? { anchorUuid } : {}),
        });
    }, [startPage]);

    const resetFilters = React.useCallback(() => {
        setTagArrayFilter(new Set([]));
        setColorArrayFilter(new Set([]));
        setDrawTypeArrayFilter(new Set([]));
        setCreatorArrayFilter(new Set([]));
    }, []);

    React.useEffect(() => {
        const noteUuid = getKnownNoteUuid(needToFocusOnID);
        if (noteUuid) {
            focusedNoteUuidRef.current = noteUuid;
        }
        setNoteUUID(noteUuid || "");
        resetFilters();
        setSortingOpen(false);
        setFilterOpen(false);
        setOptionsOpen(false);
    }, [focusRequestId, getKnownNoteUuid, needToFocusOnID, resetFilters]);

    const onSortTypeChange = React.useCallback((selection: Selection) => {
        const sort = selectionToEffectivePublicationNotesViewSort(selection);
        setSortType(publicationNotesViewSortToSelection(sort));
        requestPageForSortChange(getSortAnchorUuid());
        updateDialogOrDockDataInfo({
            id: needToFocusOnID || "",
            edit: !!noteEdit,
            focusRequestId,
            sort,
        });

        const routeMatch = getReaderMenuRouteMatch();
        if (routeMatch) {
            dispatch(replace(buildReaderMenuRoute(routeMatch.group, routeMatch.uuid, {
                edit: !!noteEdit,
                sort,
            })));
        }
    }, [dispatch, focusRequestId, getReaderMenuRouteMatch, getSortAnchorUuid, needToFocusOnID, noteEdit, requestPageForSortChange, updateDialogOrDockDataInfo]);

    React.useEffect(() => {
        const sortChanged = previousRouteSortRef.current !== routeSort;
        previousRouteSortRef.current = routeSort;

        if (focusRequestId) {
            setSortType(publicationNotesViewSortToSelection(routeSort));
            if (sortChanged) {
                requestPageForSortChange(getSortAnchorUuid());
            }
        }
    }, [focusRequestId, getSortAnchorUuid, requestPageForSortChange, routeSort]);

    React.useEffect(() => {
        if (noteUUID) {
            return;
        }
        if (skipNextPageResetAfterAnchorRef.current) {
            skipNextPageResetAfterAnchorRef.current = false;
            return;
        }
        setPaginationRequest((current) =>
            current.page === startPage && !current.anchorUuid
                ? current
                : { page: startPage });
    }, [noteUUID, publicationNotesPageResetFilter, startPage]);

    const textObj = publicationView.publicationTitle;
    const pubLangs = publicationView.languages;
    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;
    // r2Publication.Metadata.Title
    const noteSetTitle = convertMultiLangStringToString(textObj_,  locale) || exportTitleFallback;

    const pagination = publicationNotesView.pagination;
    const notesPagedArray = viewReady ? pagination.notes : [];
    const pageNumber = viewReady ? pagination.page : startPage;
    const pageTotal = viewReady ? pagination.pageTotal : 1;
    const totalCount = viewReady ? pagination.totalCount : 0;

    const isLastPage = pageTotal === pageNumber;
    const isFirstPage = pageNumber === 1;
    const isPaginated = pageTotal > 1;
    const pageOptions = Array.from({ length: pageTotal }, (_k, v) => (v += 1, ({ id: v, name: `${v} / ${pageTotal}` })));
    const begin = viewReady ? pagination.begin : 0;
    const end = viewReady ? pagination.end : 0;

    const requestPublicationNotesPage = React.useCallback((page: number, anchorUuid?: string) => {
        setPaginationRequest({
            page,
            ...(anchorUuid ? { anchorUuid } : {}),
        });
    }, []);

    const changePageNumber = React.useCallback((cb: (n: number) => number) => {
        focusedNoteUuidRef.current = undefined;
        setTimeout(() => paginatorRef.current?.focus(), 100);
        updateDialogOrDockDataInfo({id: "", edit: false});
        requestPublicationNotesPage(Math.max(cb(pageNumber), startPage));
    }, [pageNumber, requestPublicationNotesPage, startPage, updateDialogOrDockDataInfo]);

    const tagsIndexListAll = useSelector((state: IReaderRootState) =>
        selectPublicationNotesHydratedViewTagsIndex(state, publicationNotesViewFilter));
    const tagsIndexList = React.useMemo(() => viewReady ? tagsIndexListAll : [], [tagsIndexListAll, viewReady]);
    const selectTagOption = React.useMemo(() => tagsIndexList.map((v, i) => ({ id: i, name: v.tag })), [tagsIndexList]);

    const creatorListName = React.useMemo(() => viewReady ? publicationNotesView.facets.creators : [], [publicationNotesView.facets.creators, viewReady]);
    const selectCreatorOptions = React.useMemo(() => [...(new Set(creatorListName))].map((name, index) => ({ id: `${index}_${name}`, name })), [creatorListName]);
    const noteColors = React.useMemo(() => Object.entries(noteColorCodeToColorTranslatorKeySet).map(([k, v]) => ({ hex: k, name: __(v) })), [__]);
    const selectDrawtypesOptions = React.useMemo(() => [
        { name: "solid_background", svg: HighLightIcon, textValue: `${__("reader.annotations.type.solid")}` },
        { name: "underline", svg: UnderLineIcon, textValue: `${__("reader.annotations.type.underline")}` },
        { name: "strikethrough", svg: TextStrikeThroughtIcon, textValue: `${__("reader.annotations.type.strikethrough")}` },
        { name: "outline", svg: TextOutlineIcon, textValue: `${__("reader.annotations.type.outline")}` },
    ], [__]);

    React.useEffect(() => {
        if (noteUUID) {
            const anchorUuid = noteUUID;
            skipNextPageResetAfterAnchorRef.current = true;
            setNoteUUID("");
            requestPublicationNotesPage(startPage, anchorUuid);
        }
    }, [noteUUID, requestPublicationNotesPage, startPage]);

    const triggerEdition = (noteItem: PublicationNote) =>
        (value: boolean) => value ? updateDialogOrDockDataInfo({id: noteItem.uuid, edit: true}) : updateDialogOrDockDataInfo({id: "", edit: false});

    const nbOfFilters = getSelectionSize(tagArrayFilter, selectTagOption.length) +
        getSelectionSize(colorArrayFilter, noteColors.length) +
        getSelectionSize(creatorArrayFilter, selectCreatorOptions.length) +
        (group === "annotation" ? getSelectionSize(drawTypeArrayFilter, selectDrawtypesOptions.length) : 0);

    const summaryButtonContainerStyle: React.CSSProperties = group === "annotation" ?
        { display: "flex", gap: "10px", marginRight: "10px" } :
        { display: "flex", gap: "10px" };

    const renderSelectionButtons = (selection: Selection, setSelection: (selection: Selection) => void, detailsId: string, disabled = false) => (
        <div style={summaryButtonContainerStyle}>
            <button
                disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                style={{ width: "fit-content", minWidth: "unset" }}
                className={selection === "all" ? stylesButtons.button_primary_blue : stylesButtons.button_secondary_blue}
                onClick={() => {
                    setSelection("all");
                    openDetailsElement(detailsId);
                }}>
                {__("reader.annotations.filter.all")}
            </button>
            <button
                disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                style={{ width: "fit-content", minWidth: "unset" }}
                className={stylesButtons.button_secondary_blue}
                onClick={() => setSelection(new Set([]))}>
                {__("reader.annotations.filter.none")}
            </button>
        </div>
    );

    const renderTextFilterGroup = (
        label: string,
        detailsId: string,
        selection: Selection,
        setSelection: (selection: Selection) => void,
        items: TextFilterOption[],
        open: boolean,
    ) => (
        <TagGroup
            selectionMode="multiple"
            selectedKeys={selection}
            onSelectionChange={setSelection}
            aria-label={label}
            style={{ marginBottom: "20px" }}
        >
            <details open={open} id={detailsId}>
                <summary
                    className={styles.filterTagGroup}
                    style={{ pointerEvents: !items.length ? "none" : "auto", opacity: !items.length ? "0.5" : "1" }}
                    tabIndex={!items.length ? -1 : 0}
                >
                    <Label style={{ fontSize: "13px" }}>{label}</Label>
                    {renderSelectionButtons(selection, setSelection, detailsId, !items.length)}
                </summary>
                {
                    items.length ?
                        <TagList items={items} className={styles.filterTaglist} style={{ margin: !items.length ? "0" : "20px 0" }}>
                            {(item) => <Tag className={styles.filterTag} id={item.name} textValue={item.name}>{item.name}</Tag>}
                        </TagList>
                        : <></>
                }
            </details>
        </TagGroup>
    );

    const renderColorFilterGroup = (items: ColorFilterOption[]) => (
        <TagGroup
            selectionMode="multiple"
            selectedKeys={colorArrayFilter}
            onSelectionChange={setColorArrayFilter}
            aria-label={__("reader.annotations.filter.filterByColor")}
            style={{ marginBottom: "20px" }}
        >
            <details open id={ids.colorDetails}>
                <summary className={styles.filterTagGroup}>
                    <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByColor")}</Label>
                    {renderSelectionButtons(colorArrayFilter, setColorArrayFilter, ids.colorDetails)}
                </summary>
                <TagList items={items} className={styles.filterTaglist}>
                    {(item) => <Tag className={styles.filterColor} style={{ backgroundColor: item.hex, outlineColor: item.hex }} id={item.hex} textValue={item.name} ref={(r) => { if (r && (r as unknown as HTMLDivElement).setAttribute) { (r as unknown as HTMLDivElement).setAttribute("title", item.name); } }}></Tag>}
                </TagList>
            </details>
        </TagGroup>
    );

    const renderDrawTypeFilterGroup = (items: DrawTypeFilterOption[]) => (
        <TagGroup
            selectionMode="multiple"
            selectedKeys={drawTypeArrayFilter}
            onSelectionChange={setDrawTypeArrayFilter}
            aria-label={__("reader.annotations.filter.filterByDrawtype")}
            style={{ marginBottom: "20px" }}
        >
            <details open id={ids.drawDetails}>
                <summary className={styles.filterTagGroup}>
                    <Label style={{ fontSize: "13px" }}>{__("reader.annotations.filter.filterByDrawtype")}</Label>
                    {renderSelectionButtons(drawTypeArrayFilter, setDrawTypeArrayFilter, ids.drawDetails)}
                </summary>
                <TagList items={items} className={styles.filterTaglist}>
                    {(item) => <Tag id={item.name} className={styles.filterDrawtype} textValue={item.textValue}><SVG svg={item.svg} /></Tag>}
                </TagList>
            </details>
        </TagGroup>
    );

    const renderOptions = () => (
        <>
            {options.filter((option) => !option.hidden).map((option) => (
                <div className={stylesAnnotations.annotations_checkbox} key={option.id}>
                    <input
                        type="checkbox"
                        id={option.id}
                        name={option.name || option.id}
                        className={stylesGlobal.checkbox_custom_input}
                        checked={option.checked}
                        onChange={() => option.onChange()}
                    />
                    <label htmlFor={option.id} className={stylesGlobal.checkbox_custom_label} style={option.labelStyle}>
                        <div
                            tabIndex={0}
                            role="checkbox"
                            aria-checked={option.checked}
                            aria-label={option.ariaLabel || option.label}
                            onKeyDown={(e) => {
                                if (e.key === " ") {
                                    e.preventDefault();
                                }
                            }}
                            onKeyUp={(e) => {
                                if (e.key === " ") {
                                    e.preventDefault();
                                    option.onChange();
                                }
                            }}
                            className={stylesGlobal.checkbox_custom}
                            style={{ border: option.checked ? "2px solid transparent" : "2px solid var(--color-text-primary)", backgroundColor: option.checked ? "var(--color-brand-primary)" : "transparent" }}>
                            {option.checked ?
                                <SVG ariaHidden svg={CheckIcon} />
                                :
                                <></>
                            }
                        </div>
                        <span aria-hidden>
                            {option.label}
                        </span>
                    </label>
                </div>
            ))}
        </>
    );

    return (
        <>
            <div className={styles.filterLine}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Popover.Root modal open={sortingOpen} onOpenChange={(open) => setSortingOpen(open)}>
                        <Popover.Trigger asChild>
                            <button aria-label={__("reader.annotations.sorting.sortingOptions")} className={styles.filterTriggerButton}
                                title={__("reader.annotations.sorting.sortingOptions")}>
                                <SVG svg={SortIcon} />
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
                                className={styles.sortingContainer}
                                style={{ maxHeight: Math.round(window.innerHeight / 2) }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                <ListBox
                                    selectedKeys={sortType}
                                    onSelectionChange={onSortTypeChange}
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
                            <button aria-label={__("reader.annotations.filter.filterOptions")} className={styles.filterTriggerButton}
                                title={__("reader.annotations.filter.filterOptions")}>
                                <SVG svg={MenuIcon} />
                                {nbOfFilters > 0 ?
                                    <p className={styles.filterNbOfFilters} style={{ fontSize: nbOfFilters > 9 ? "10px" : "12px", paddingLeft: nbOfFilters > 9 ? "3px" : "4px" }}>{nbOfFilters}</p>
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
                                className={styles.filterContainer}
                                style={{ maxHeight: Math.round(window.innerHeight / 2) }}
                            >
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                <FocusLock>
                                    {renderTextFilterGroup(
                                        __("reader.annotations.filter.filterByTag"),
                                        ids.tagDetails,
                                        tagArrayFilter,
                                        setTagArrayFilter,
                                        selectTagOption,
                                        true,
                                    )}
                                    {renderColorFilterGroup(noteColors)}
                                    {group === "annotation" ? renderDrawTypeFilterGroup(selectDrawtypesOptions) : <></>}
                                    {renderTextFilterGroup(
                                        __("reader.annotations.filter.filterByCreator"),
                                        ids.creatorDetails,
                                        creatorArrayFilter,
                                        setCreatorArrayFilter,
                                        selectCreatorOptions,
                                        !!selectCreatorOptions.length,
                                    )}
                                </FocusLock>
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {importExportEnabled ? <>
                        <ImportAnnotationsDialog winId={winId} publicationView={publicationView}>
                            <button className={styles.filterTriggerButton}
                                title={__("catalog.importAnnotation")}
                                aria-label={__("catalog.importAnnotation")}>
                                <SVG svg={ImportIcon} />
                            </button>
                        </ImportAnnotationsDialog>

                        <Popover.Root modal>
                            <Popover.Trigger asChild>
                                <button className={styles.filterTriggerButton} disabled={!noteList.length}
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
                                    className={styles.sortingContainer}
                                    style={{ maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" }}
                                >
                                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                                    <div
                                        className={styles.titleFormContainer}
                                    >
                                        <p>{__("reader.annotations.annotationsExport.description")}</p>
                                        <div className={stylesInputs.form_group}>
                                            <label htmlFor="annotationsTitle">{__("reader.annotations.annotationsExport.title")}</label>
                                            <input
                                                type="text"
                                                defaultValue={noteSetTitle}
                                                name="annotationsTitle"
                                                id="annotationsTitle"
                                                ref={noteTitleRef}
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
                                                    noteTitleRef?.current?.value || noteSetTitle,
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
                    </> : <></>}
                    <AlertDialog.Root>
                        <AlertDialog.Trigger className={styles.filterTriggerButton} disabled={!noteList.length} title={__(group === "bookmark" ? "dialog.deleteBookmarks" : "dialog.deleteAnnotations")} aria-label={__(group === "bookmark" ? "dialog.deleteBookmarks" : "dialog.deleteAnnotations")}>
                            <SVG svg={TrashIcon} ariaHidden />
                        </AlertDialog.Trigger>
                        <AlertDialog.Portal>
                            <AlertDialog.Overlay className={stylesAlertModals.AlertDialogOverlay} />
                            <AlertDialog.Content className={stylesAlertModals.AlertDialogContent}>
                                <AlertDialog.Title className={stylesAlertModals.AlertDialogTitle}>{__(group === "bookmark" ? "dialog.deleteBookmarks" : "dialog.deleteAnnotations")}</AlertDialog.Title>
                                <AlertDialog.Description className={stylesAlertModals.AlertDialogDescription}>
                                    {__(group === "bookmark" ? "dialog.deleteBookmarksText" : "dialog.deleteAnnotationsText", { count: noteList.length })}
                                </AlertDialog.Description>
                                <div className={stylesAlertModals.AlertDialogButtonContainer}>
                                    <AlertDialog.Cancel asChild>
                                        <button className={stylesButtons.button_secondary_blue}>{__("dialog.cancel")}</button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                        <button className={stylesButtons.button_primary_blue} onClick={() => {
                                            updateDialogOrDockDataInfo({id: "", edit: false});
                                            for (const note of noteList) {

                                                dispatch(readerActions.publicationNotes.commands.remove.build(pubId, note));
                                                if (group === "bookmark") {
                                                    logEvent(readerAnalyticsEvents.bookmarkToggle);
                                                }
                                            }

                                            resetFilters();
                                        }} type="button">
                                            <SVG ariaHidden svg={TrashIcon} />
                                            {__("dialog.yes")}</button>
                                    </AlertDialog.Action>
                                </div>
                            </AlertDialog.Content>
                        </AlertDialog.Portal>
                    </AlertDialog.Root>
                    <span style={{height: "30px", width: "2px", borderRight: "2px solid var(--color-gray-50"}}></span>
                    <Popover.Root modal open={optionsOpen} onOpenChange={(open) => setOptionsOpen(open)}>
                        <Popover.Trigger className={stylesAnnotations.annotations_filter_trigger_button} title={__("reader.annotations.annotationsOptions")} aria-label={__("reader.annotations.annotationsOptions")}>
                            <SVG ariaHidden svg={OptionsIcon} />
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                collisionBoundary={popoverBoundary}
                                avoidCollisions
                                alignOffset={-10}
                                align={group === "bookmark" ? "end" : undefined}
                                hideWhenDetached
                                sideOffset={5}
                                className={styles.filterContainer}
                                style={group === "bookmark" ? { maxHeight: Math.round(window.innerHeight / 2), padding: "15px 0" } : undefined}
                            >
                                {renderOptions()}
                                <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden style={{ fill: "var(--color-gray-50" }} />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                </div>
            </div>
            <div className={stylesAnnotations.separator} />
            <ol
                onFocusCapture={(event) => rememberFocusedNoteUuid(event.target)}
                onMouseDownCapture={(event) => rememberFocusedNoteUuid(event.target)}
                style={group === "bookmark" ? { paddingLeft: "0px" } : undefined}>
                {notesPagedArray.map((noteItem) =>
                    <React.Fragment key={`${cardKeyPrefix}_${noteItem.uuid}`}>
                        {renderNote(noteItem, {
                            isEdited: noteItem.uuid === needToFocusOnID && noteEdit,
                            isSelected: noteItem.uuid === needToFocusOnID,
                            focusRequestId,
                            triggerEdition: triggerEdition(noteItem),
                            setCreatorFilter: (v) => setCreatorArrayFilter(new Set([v])),
                            setTagFilter: (v) => setTagArrayFilter(new Set([v])),
                        })}
                    </React.Fragment>,
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
                            onClick={() => { changePageNumber((page) => page - 1); }}
                            disabled={isFirstPage}>
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>
                        <div className={stylesPopoverDialog.pages}>
                            <label htmlFor={ids.paginator} style={{ margin: "0" }}>{__("reader.navigation.page")}</label>
                            <select
                                onChange={(e) => {
                                    if (!e.currentTarget?.value) {
                                        return;
                                    }
                                    const value = e.currentTarget.value;
                                    const option = pageOptions.find((item) => item.id === parseInt(value, 10));
                                    if (!option) {
                                        return;
                                    }
                                    changePageNumber(() => option.id);
                                }}
                                ref={paginatorRef}
                                id={ids.paginator}
                                aria-label={__("reader.navigation.page")}
                                value={pageNumber}
                            >
                                {pageOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                        <button title={__("opds.next")}
                            onClick={() => { changePageNumber((page) => page + 1); }}
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
