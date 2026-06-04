import * as React from "react";
import { ipcRenderer } from "electron";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    Row,
    ColumnFiltersState,
    getPaginationRowModel,
    PaginationState,
    CellContext,
    Table,
} from "@tanstack/react-table";
import { Location } from "history";
import { PublicationView, canOpenPublication } from "readium-desktop/common/views/publication";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import moment from "moment";
import DOMPurify from "dompurify";
import { formatTime } from "readium-desktop/common/utils/time";
import { availableLanguages, I18nFunction } from "readium-desktop/common/services/translator";
import { convertMultiLangStringToLangString } from "readium-desktop/common/language-string";
import SVG from "readium-desktop/renderer/common/components/SVG";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import CatalogMenu from "../publication/menu/CatalogMenu";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as stylesPublication from "readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss";
import { CellColumnFilter, CellGlobalFilter } from "./AllPublicationsSearch";
import { DisplayType, IRouterLocationState } from "../../routing";
import { FilterPopover, resetAllFilters } from "readium-desktop/renderer/library/components/allPublications/AllPublicationsFilter";
import { SortingPopover } from "readium-desktop/renderer/library/components/allPublications/AllPublicationsSorting";
import { LibraryNavigation, SelectTableHeaders } from "readium-desktop/renderer/library/components/allPublications/AllPublicationsUtils";
import PublicationCard from "../publication/PublicationCard";
import { dialogActions, readerActions } from "readium-desktop/common/redux/actions";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";
import { CellCoverImage, CellDescription, CellAuthors, CellDate, CellFormat, CellLangs, CellPublishers, CellReadingState, CellRemainingDays, CellTags, CellTitle } from "./AllPublicationsCells";
import LibraryLayout from "../layout/LibraryLayout";
import AboutThoriumButton from "../catalog/AboutThoriumButton";
import Header from "../catalog/Header";
import { TranslatorProps } from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

export interface IColumnValue_BaseString { label: string }

export interface IColumnValue_Remain {
    label: string;
    hasEnded: boolean;
    isLcp: boolean;
}

export interface IColumnValue_Actions {
    isReading: boolean;
    label: string;
    publication: PublicationView | IOpdsPublicationView;
}

export interface IColumnValue_Cover extends IColumnValue_BaseString {
    title: string;
    publicationViewIdentifier: string;
    isOpenable?: boolean;
    openReader?: (publicationViewIdentifier: string) => void;
}

export interface IColumnValue_Tags extends IColumnValue_BaseString { tags: string[] }
export interface IColumnValue_Date extends IColumnValue_BaseString { date: string }
export interface IColumnValue_Langs extends IColumnValue_BaseString { langs: string[] }
export interface IColumnValue_Publishers extends IColumnValue_BaseString {
    publishersLangString: (string | IStringMap)[];
}
export interface IColumnValue_Authors extends IColumnValue_BaseString {
    authorsLangString: (string | IStringMap)[];
}
export interface IColumnValue_Title extends IColumnValue_BaseString {
    pubTitle: string | IStringMap;
    publicationViewIdentifier: string;
}

export interface IColumns {
    colCover: IColumnValue_Cover;
    colTitle: IColumnValue_Title;
    colAuthors: IColumnValue_Authors;
    colReadingState: IColumnValue_BaseString;
    colPublishers: IColumnValue_Publishers;
    colRemainingDays: IColumnValue_Remain;
    colLanguages: IColumnValue_Langs;
    colPublishedDate: IColumnValue_Date;
    colDescription: string;
    colLCP: string;
    colFormat: string;
    colLastReadTimestamp: IColumnValue_Date;
    colTags: IColumnValue_Tags;
    colDuration: string;
    colActions: IColumnValue_Actions;
    col_a11y_accessibilitySummary: string;
}

interface ITableCellProps_TableView {
    publicationViews: PublicationView[];
    focusInputRef: React.RefObject<HTMLInputElement>;
    location: Location;
    accessibilitySupportEnabled: boolean;
    tags: string[];
    setTableInstance: React.Dispatch<React.SetStateAction<Table<IColumns> | null>>;

    openReader?: (publicationViewIdentifier: string) => void;
}

export interface ITableCellProps_Common {
    displayType: DisplayType;
    displayPublicationInfo: (publicationViewIdentifier: string) => void;
}

export interface IActiveFilter {
    filterType: string;
    value: string;
    filterCol: string;
}

// ---- Helpers ----

function mapPublicationToColumns(
    publicationView: PublicationView,
    locale: keyof typeof availableLanguages,
    __: I18nFunction,
): IColumns {
    const toCanonicalAndVisual = (timestamp: string | number | undefined, timeStyle?: "short") => {
        const mom_ = timestamp ? moment(timestamp).locale([locale, "en"]) : undefined;
        const mom = mom_?.isValid() ? mom_.utc() : undefined;
        if (!mom) return { canonical: "", visual: "" };

        const MM = (mom.month() || 0) + 1;
        const DD = mom.date() || 1;
        const canonical = `${mom.year().toString().padStart(4, "0")}-${MM.toString().padStart(2, "0")}-${DD.toString().padStart(2, "0")}T${(mom.hour() || 0).toString().padStart(2, "0")}:${(mom.minute() || 0).toString().padStart(2, "0")}:${(mom.second() || 0).toString().padStart(2, "0")}Z`;
        let visual = canonical;
        try {
            visual = new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle,
            }).format(new Date(canonical));
        } catch (err) {
            console.log(err);
        }
        return { canonical, visual };
    };

    const { canonical: publishedDateCanonical, visual: publishedDateVisual } =
        toCanonicalAndVisual(publicationView.publishedAt);
    const { canonical: lastReadDateCanonical, visual: lastReadDateVisual } =
        toCanonicalAndVisual(publicationView.lastReadTimeStamp, "short");

    const isLcp = !!publicationView.lcp?.rights;
    const lcpRightsEndDate = publicationView.lcp?.rights?.end;
    let remainingDays = "";
    let hasEnded = false;
    if (lcpRightsEndDate) {
        const now = moment().locale([locale, "en"]);
        const momentEnd = moment(lcpRightsEndDate).locale([locale, "en"]);
        const timeEndDif = momentEnd.diff(now, "days");
        if (timeEndDif > 1) {
            remainingDays = `${timeEndDif} ${__("publication.days")}`;
        } else if (timeEndDif === 1) {
            remainingDays = `${timeEndDif} ${__("publication.day")}`;
        } else if (now.isAfter(momentEnd)) {
            remainingDays = __("publication.expired");
            hasEnded = true;
        } else {
            remainingDays = formatTime(momentEnd.diff(now, "seconds"));
        }
    }

    const langsArray = publicationView.languages?.map((lang) => {
        const l = lang.split("-")[0] as keyof typeof availableLanguages;
        const ll = availableLanguages[l] || lang;
        return ll + (lang !== ll ? ` (${lang})` : "");
    }) ?? [];

    const description = publicationView.description
        ? DOMPurify.sanitize(publicationView.description).replace(/font-size:/g, "font-sizexx:")
        : "";
    const lcp = publicationView.lcp ? "LCP" : "";
    const format = publicationView.isAudio ? "Audio"
        : publicationView.isDivina ? "Divina"
            : publicationView.isPDF ? "PDF"
                : publicationView.isDaisy ? "DAISY"
                    : publicationView.isFixedLayoutPublication ? "EPUB (FXL)"
                        : "EPUB";
    const duration = (publicationView.duration ? formatTime(publicationView.duration) : "")
        + (publicationView.nbOfTracks ? ` (${__("publication.audio.tracks")}: ${publicationView.nbOfTracks})` : "");

    const reduceLangString = (arr: (string | IStringMap)[] | undefined) =>
        arr?.reduce<string>((prev, text) => {
            const textLangStr = convertMultiLangStringToLangString(text, locale as keyof typeof availableLanguages);
            const textStr = textLangStr?.[1] ?? "";
            return prev ? `${prev}, ${textStr}` : textStr;
        }, "") ?? "";

    let strA11Summary = "";
    if (publicationView.a11y_accessibilitySummary) {
        const langStr = convertMultiLangStringToLangString(publicationView.a11y_accessibilitySummary, locale as keyof typeof availableLanguages);
        if (langStr && langStr[1]) {
            strA11Summary = DOMPurify.sanitize(langStr[1]).replace(/font-size:/g, "font-sizexx:");
        }
    }

    return {
        colCover: {
            label: publicationView.cover?.thumbnailUrl ?? publicationView.cover?.coverUrl ?? "",
            publicationViewIdentifier: publicationView.identifier,
            title: publicationView.documentTitle,
            isOpenable: canOpenPublication(publicationView),
        },
        colTitle: {
            label: publicationView.documentTitle,
            publicationViewIdentifier: publicationView.identifier,
            pubTitle: publicationView.publicationTitle,
        },
        colAuthors: {
            label: reduceLangString(publicationView.authorsLangString),
            authorsLangString: publicationView.authorsLangString ?? [],
        },
        colReadingState: {
            label: publicationView.readingFinished
                ? __("publication.read")
                : publicationView.lastReadingLocation
                    ? __("publication.onGoing")
                    : __("publication.notStarted"),
        },
        colRemainingDays: { label: remainingDays, hasEnded, isLcp },
        colPublishers: {
            label: reduceLangString(publicationView.publishersLangString),
            publishersLangString: publicationView.publishersLangString ?? [],
        },
        colLanguages: {
            label: langsArray.join(", "),
            langs: langsArray,
        },
        colPublishedDate: { label: publishedDateCanonical, date: publishedDateVisual },
        colLCP: lcp,
        colFormat: format,
        colLastReadTimestamp: { label: lastReadDateCanonical, date: lastReadDateVisual },
        colTags: {
            label: publicationView.tags?.join(", ") ?? "",
            tags: publicationView.tags ?? [],
        },
        colDuration: duration,
        colDescription: description,
        col_a11y_accessibilitySummary: strA11Summary,
        colActions: {
            isReading: !!publicationView.lastReadingLocation,
            label: publicationView.documentTitle,
            publication: publicationView,
        },
    };
}

const columnHelper = createColumnHelper<IColumns>();

const sortFunction = (rowA: Row<IColumns>, rowB: Row<IColumns>, columnId: string): number => {
    const v1 = rowA.getValue<string | IColumnValue_BaseString>(columnId);
    const v2 = rowB.getValue<string | IColumnValue_BaseString>(columnId);

    const toString = (v: string | IColumnValue_BaseString): string =>
        typeof v === "string" ? v : v?.label ?? "";

    const s1 = toString(v1);
    const s2 = toString(v2);

    if (!s1) return 1;
    if (!s2) return -1;
    if (s1 === s2) return 0;
    return s1 < s2 ? -1 : 1;
};

const objectLabelFilterFn = (
    row: Row<IColumns>,
    columnId: string,
    filterValue: string,
): boolean => {
    const cellValue = row.getValue(columnId);

    if (typeof cellValue === "string") {
        return cellValue.toLowerCase().includes(filterValue.toLowerCase());
    }

    if (cellValue && typeof (cellValue as IColumnValue_BaseString).label === "string") {
        return (cellValue as IColumnValue_BaseString).label
            .toLowerCase()
            .includes(filterValue.toLowerCase());
    }

    return false;
};

objectLabelFilterFn.autoRemove = (val: unknown) => !val;

const globalFilterFn = (
    row: Row<IColumns>,
    columnId: string,
    filterValue: string,
): boolean => {
    const cellValue = row.getValue(columnId);
    const search = filterValue.toLowerCase().trim();

    if (!search) return true;
    if (typeof cellValue === "string") {
        return cellValue.toLowerCase().includes(search);
    }
    if (cellValue && typeof (cellValue as IColumnValue_BaseString).label === "string") {
        return (cellValue as IColumnValue_BaseString).label.toLowerCase().includes(search);
    }
    return false;
};

globalFilterFn.autoRemove = (val: unknown) => !val;

export const PublicationsTable: React.FC<ITableCellProps_TableView & ITableCellProps_Common> = (props) => {
    const { displayType, focusInputRef, publicationViews, accessibilitySupportEnabled, tags, openReader, setTableInstance } = props;
    const [__] = useTranslator();
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const dispatch = useDispatch();

    const scrollToViewRef = React.useRef<HTMLDivElement>(null);

    // const openReader = React.useCallback((id: string) => {
    //     dispatch(readerActions.openRequest.build(id));
    // }, [dispatch]);

    const displayPublicationInfo = React.useCallback((id: string) => {
        dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib, {
            publicationIdentifier: id,
        }));
    }, [dispatch]);

    // ---- Table states ----

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState<string>("");
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [showColumnFilters, setShowColumnFilters] = React.useState<boolean>(false);

    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    // ---- Legacy filter states ----
    const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false);
    const [selectedFormat, setSelectedFormat] = React.useState("");
    const [selectedLanguage, setSelectedLanguage] = React.useState("");
    const [selectedReadingState, setSelectedReadingState] = React.useState("");
    const [selectedTag, setSelectedTag] = React.useState("");
    const [activeFiltersArray, setActiveFiltersArray] = React.useState<IActiveFilter[]>([]);

    // ---- Static options ----

    const formatsOptions = ["EPUB", "PDF", "Audio", "Divina", "DAISY"];
    const languagesOptions = ["Français", "English", "Español"];
    const readingStatesOptions = [
        __("publication.read"),
        __("publication.onGoing"),
        __("publication.notStarted"),
    ];

    const tagsOptions = tags.map((v, i) => ({ id: i, value: i, name: v }));

    const columnWidths = React.useMemo<Record<string, string>>(() => ({
        colCover: "60px",
        colActions: "60px",
        colPublishedDate: "100px",
        colProgression: "100px",
        colDuration: "100px",
        col_a11y_accessibilitySummary: "160px",
        colAuthors: "160px",
        colRemainingDays: "150px",
        colDescription: "200px",
        colLanguages: "100px",
        colTags: "100px",
        colPublishers: "100px",
        colFormat: "100px",
        colTitle: "100px",
    }), []);

    // ---- Callback column filter ----

    const handleSetShowColumnFilters = React.useCallback((
        show: boolean,
        columnId: string,
        filterValue: string,
    ) => {
        console.log("handleSetShowColumnFilters called", { show, columnId, filterValue });

        setShowColumnFilters(show);

        setColumnFilters((prev: ColumnFiltersState) => {
            const next = [
                ...prev.filter((f: ColumnFiltersState[number]) => f.id !== columnId),
                { id: columnId, value: filterValue },
            ];
            console.log("columnFilters prev:", prev);
            console.log("columnFilters next:", next);
            return next;
        });

        scrollToViewRef.current?.scrollIntoView();
    }, []);

    // ---- Columns ----

    const columns = React.useMemo(() => {
        const commonCellProps = {
            displayType,
            setShowColumnFilters: handleSetShowColumnFilters,
            selectedTag,
            setSelectedTag,
            displayPublicationInfo,
            locale,
        };

        return [
            columnHelper.accessor("colCover", {
                header: __("publication.cover.img"),
                id: "colCover",
                cell: (info) => <CellCoverImage {...info.getValue()} openReader={openReader} />,
                enableColumnFilter: false,
                enableSorting: false,
                size: parseInt(columnWidths["colCover"]),
            }),
            columnHelper.accessor("colTitle", {
                header: __("publication.title"),
                id: "colTitle",
                cell: (info) => (
                    <CellTitle
                        {...info}
                        value={info.getValue()}
                        displayType={displayType}
                        openReader={openReader}
                        setShowColumnFilters={handleSetShowColumnFilters}
                        selectedTag={selectedTag}
                        setSelectedTag={setSelectedTag}
                        displayPublicationInfo={displayPublicationInfo}
                    />
                ),
                sortingFn: sortFunction,
                filterFn: objectLabelFilterFn,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colTitle"]),
            }),
            columnHelper.accessor("colAuthors", {
                header: __("publication.author"),
                id: "colAuthors",
                cell: (info) => <CellAuthors {...info} value={info.getValue()} {...commonCellProps} />,
                sortingFn: sortFunction,
                filterFn: objectLabelFilterFn,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colAuthors"]),
            }),
            columnHelper.accessor("colReadingState", {
                header: __("publication.progression.title"),
                id: "colReadingState",
                cell: (info) => (
                    <CellReadingState
                        {...info}
                        value={info.getValue()}
                        displayType={displayType}
                        setShowColumnFilters={handleSetShowColumnFilters}
                        selectedTag={selectedTag}
                        setSelectedTag={setSelectedTag}
                        displayPublicationInfo={displayPublicationInfo}
                        setActiveFiltersArray={setActiveFiltersArray}
                        setSelection={setSelectedReadingState}
                    />
                ),
                sortingFn: sortFunction,
                filterFn: objectLabelFilterFn,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colProgression"]),
            }),
            columnHelper.accessor("colRemainingDays", {
                header: __("publication.remainingTime"),
                id: "colRemainingDays",
                cell: (info) => (
                    <CellRemainingDays
                        {...info}
                        value={info.getValue()}
                        displayType={displayType}
                        setShowColumnFilters={handleSetShowColumnFilters}
                        selectedTag={selectedTag}
                        setSelectedTag={setSelectedTag}
                        displayPublicationInfo={displayPublicationInfo}
                    />
                ),
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colRemainingDays"]),
            }),
            columnHelper.accessor("colLanguages", {
                header: __("catalog.lang"),
                id: "colLanguages",
                cell: (info) => (
                    <CellLangs
                        {...info}
                        value={info.getValue()}
                        {...commonCellProps}
                        setActiveFiltersArray={setActiveFiltersArray}
                        setSelection={setSelectedLanguage}
                    />
                ),
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colLanguages"]),
            }),
            columnHelper.accessor("colTags", {
                header: __("catalog.tags"),
                id: "colTags",
                cell: (info) => (
                    <CellTags
                        {...info}
                        value={info.getValue()}
                        {...commonCellProps}
                        setActiveFiltersArray={setActiveFiltersArray}
                        setSelection={setSelectedTag}
                    />
                ),
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colTags"]),
            }),
            columnHelper.accessor("colFormat", {
                header: __("catalog.format"),
                id: "colFormat",
                cell: (info) => (
                    <CellFormat
                        {...info}
                        value={info.getValue()}
                        {...commonCellProps}
                        setActiveFiltersArray={setActiveFiltersArray}
                        setSelection={setSelectedFormat}
                    />
                ),
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colFormat"]),
            }),
            columnHelper.accessor("colLastReadTimestamp", {
                header: __("catalog.lastRead"),
                id: "colLastReadTimestamp",
                cell: (info) => (
                    <CellDate
                        {...info}
                        value={info.getValue()}
                        displayType={displayType}
                        setShowColumnFilters={handleSetShowColumnFilters}
                        selectedTag={selectedTag}
                        setSelectedTag={setSelectedTag}
                        displayPublicationInfo={displayPublicationInfo}
                    />
                ),
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
            }),
            columnHelper.accessor("colPublishers", {
                header: __("catalog.publisher"),
                id: "colPublishers",
                cell: (info) => <CellPublishers {...info} value={info.getValue()} {...commonCellProps} />,
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                enableGlobalFilter: true,
                size: parseInt(columnWidths["colPublishers"]),
            }),
            columnHelper.accessor("colPublishedDate", {
                header: __("catalog.released"),
                id: "colPublishedDate",
                cell: (info) => (
                    <CellDate
                        {...info}
                        value={info.getValue()}
                        displayType={displayType}
                        setShowColumnFilters={handleSetShowColumnFilters}
                        selectedTag={selectedTag}
                        setSelectedTag={setSelectedTag}
                        displayPublicationInfo={displayPublicationInfo}
                    />
                ),
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                size: parseInt(columnWidths["colPublishedDate"]),
            }),
            columnHelper.accessor("colLCP", {
                header: "DRM",
                id: "colLCP",
                filterFn: objectLabelFilterFn,
                enableGlobalFilter: true,
                sortingFn: sortFunction,
            }),
            columnHelper.accessor("colDuration", {
                header: __("publication.duration.title"),
                id: "colDuration",
                filterFn: objectLabelFilterFn,
                sortingFn: sortFunction,
                size: parseInt(columnWidths["colDuration"]),
            }),
            columnHelper.accessor("colDescription", {
                header: __("catalog.description"),
                id: "colDescription",
                cell: React.memo(function CellDescriptionColumn(info: CellContext<IColumns, string>) {
                    return <CellDescription value={info.getValue()} />;
                }),
                sortingFn: sortFunction,
                size: parseInt(columnWidths["colDescription"]),
            }),
            columnHelper.accessor("col_a11y_accessibilitySummary", {
                header: __("publication.accessibility.name"),
                id: "col_a11y_accessibilitySummary",
                cell: React.memo(function CellAccessibilityColumn(info: CellContext<IColumns, string>) {
                    return <CellDescription value={info.getValue()} />;
                }),
                sortingFn: sortFunction,
                size: parseInt(columnWidths["col_a11y_accessibilitySummary"]),
            }),
            columnHelper.accessor("colActions", {
                header: __("publication.actions"),
                id: "colActions",
                cell: (info) => {
                    const value = info.getValue();
                    return (
                        <div className={stylesPublication.cell_wrapper}>
                            <Menu button={<SVG title={`${__("publication.actions")} (${value.label})`} svg={MenuIcon} />}>
                                <CatalogMenu publicationView={value.publication as PublicationView} />
                            </Menu>
                        </div>
                    );
                },
                enableColumnFilter: false,
                enableSorting: false,
                size: parseInt(columnWidths["colActions"]),
            }),
        ];
    }, [__, locale, columnWidths, openReader, displayType, displayPublicationInfo, handleSetShowColumnFilters, selectedTag]);

    // ---- Data ----

    const data = React.useMemo(() =>
        (publicationViews ?? []).slice().reverse().map((pub) =>
            mapPublicationToColumns(pub, locale as keyof typeof availableLanguages, __),
        ),
        [publicationViews, locale, __],
    );

    // ---- Table ----

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            pagination,
        },
        onPaginationChange: (updater) => {
            setPagination(prev =>
                typeof updater === "function" ? updater(prev) : updater,
            );
        },
        globalFilterFn,
        getColumnCanGlobalFilter: () => true,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    setTableInstance(table);

    const nonEditableColumnIds = ["colCover", "colActions", "colAuthors", "colTitle"];
    const editableColumnsArray = table.getAllColumns().filter(
        (col) => !nonEditableColumnIds.includes(col.id),
    );

    // ---- Render ------------------------------------------------------------

    return (
        <div className="p-2" ref={scrollToViewRef}>
            <h2 className={stylesPublication.allBooks_header}>{__("catalog.allBooks")}</h2>
            <div className={stylesPublication.allBooks_header_navigation}>
                <div className={stylesPublication.allBooks_header_navigation_inputs}>
                    <CellGlobalFilter
                        accessibilitySupportEnabled={accessibilitySupportEnabled}
                        preGlobalFilteredRows={table.getPreFilteredRowModel().rows}
                        globalFilteredRows={table.getFilteredRowModel().rows}
                        globalFilter={table.getState().globalFilter}
                        setGlobalFilter={table.setGlobalFilter}
                        __={__}
                        displayType={displayType}
                        focusInputRef={focusInputRef}
                        setShowColumnFilters={setShowColumnFilters}
                    />
                    {displayType === DisplayType.Grid ? (
                        <>
                            <FilterPopover
                                table={table}
                                filterPopoverOpen={filterPopoverOpen}
                                setFilterPopoverOpen={setFilterPopoverOpen}
                                formats={formatsOptions}
                                selectedFormat={selectedFormat}
                                setSelectedFormat={setSelectedFormat}
                                languages={languagesOptions}
                                selectedLanguage={selectedLanguage}
                                setSelectedLanguage={setSelectedLanguage}
                                readingStates={readingStatesOptions}
                                selectedReadingState={selectedReadingState}
                                setSelectedReadingState={setSelectedReadingState}
                                tagsOptions={tagsOptions}
                                selectedTag={selectedTag}
                                setSelectedTag={setSelectedTag}
                                activeFiltersArray={activeFiltersArray}
                                setActiveFiltersArray={setActiveFiltersArray}
                            />
                            <SortingPopover
                                table={table}
                                filterPopoverOpen={filterPopoverOpen}
                                setFilterPopoverOpen={setFilterPopoverOpen}
                            />
                        </>
                    ) : (
                        <SelectTableHeaders editableColumnsArray={editableColumnsArray} />
                    )}
                </div>
                <LibraryNavigation
                    table={table}
                    setShowColumnFilters={setShowColumnFilters}
                    focusInputRef={focusInputRef}
                    accessibilitySupportEnabled={accessibilitySupportEnabled}
                />
            </div>
            <div className={stylesPublication.allBook_table_wrapper}
                style={{ inset: "230px 20px 75px 26px" }}
            >
                <span
                    ref={scrollToViewRef}
                    style={{ visibility: "hidden" }}>{" "}</span>

                <table className={stylesPublication.allBook_table}
                    role={displayType === DisplayType.Grid ? "presentation" : "table"}
                    style={{
                        display: "table",
                    }}>
                    {displayType === DisplayType.Grid ? "" :
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const canSort = header.column.getCanSort();
                                        const isSorted = header.column.getIsSorted();
                                        const canFilter = header.column.getCanFilter();
                                        const isCover = ["colCover"].includes(header.column.id);

                                        return (
                                            <th
                                                key={header.id}
                                                className={stylesPublication.allBook_table_head}
                                                style={{
                                                    minWidth: header.column.getSize(),
                                                    maxWidth: header.column.getSize(),
                                                    borderBottom: "2px solid var(--color-brand-primary)",
                                                    position: "relative",
                                                }}
                                            >
                                                {!canSort && !isCover ? (
                                                    <h4 style={{ position: "absolute", top: "8px", left: "5px" }}>
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </h4>

                                                ) : isCover ? (
                                                    <>
                                                        <input
                                                            aria-label={__("header.searchPlaceholder")}
                                                            id="setShowColumnFiltersCheckbox"
                                                            type="checkbox"
                                                            checked={showColumnFilters}
                                                            onFocus={() => {
                                                                document.getElementById("setShowColumnFiltersCheckboxLabel")
                                                                    ?.setAttribute("data-focussed", "true");
                                                            }}
                                                            onBlur={() => {
                                                                document.getElementById("setShowColumnFiltersCheckboxLabel")
                                                                    ?.removeAttribute("data-focussed");
                                                            }}
                                                            onKeyUp={(e) => {
                                                                if (e.key === "Enter") (e.target as HTMLElement).click();
                                                            }}
                                                            onChange={() => {
                                                                const next = !showColumnFilters;
                                                                setShowColumnFilters(next);
                                                                if (!next) {
                                                                    resetAllFilters(
                                                                        table,
                                                                        setSelectedFormat,
                                                                        setSelectedLanguage,
                                                                        setSelectedReadingState,
                                                                        setSelectedTag,
                                                                        setActiveFiltersArray,
                                                                        setColumnFilters,
                                                                    );
                                                                }
                                                            }}
                                                            style={{ position: "absolute", left: "-999px", display: "none" }}
                                                        />
                                                        <label
                                                            id="setShowColumnFiltersCheckboxLabel"
                                                            className={stylesPublication.setShowColumnFiltersCheckboxLabel}
                                                            aria-hidden="true"
                                                            htmlFor="setShowColumnFiltersCheckbox"
                                                            style={{ cursor: "pointer", padding: "0.2em", color: "var(--color-brand-primary)", paddingBottom: "0", display: "inline-block", width: "20px" }}
                                                        >
                                                            <SVG ariaHidden svg={SearchIcon} />
                                                        </label>
                                                    </>

                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={header.column.getToggleSortingHandler()}
                                                            aria-label={`${flexRender(header.column.columnDef.header, header.getContext())}${isSorted === "desc"
                                                                ? ` (${__("catalog.column.descending")})`
                                                                : isSorted === "asc"
                                                                    ? ` (${__("catalog.column.ascending")})`
                                                                    : ` (${__("catalog.column.unsorted")})`
                                                                }`}
                                                        >
                                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                                            <span>{isSorted === "desc" ? " ↓" : isSorted === "asc" ? " ↑" : ""}</span>
                                                        </button>

                                                        {canFilter && (
                                                            <CellColumnFilter
                                                                __={__}
                                                                column={header.column}
                                                                showColumnFilters={showColumnFilters}
                                                                setShowColumnFilters={setShowColumnFilters}
                                                                accessibilitySupportEnabled={accessibilitySupportEnabled}
                                                                selectedTag={selectedTag}
                                                                setSelectedTag={setSelectedTag}
                                                                setActiveFiltersArray={setActiveFiltersArray}
                                                                setSelection={undefined}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>}
                    <tbody
                        className={stylesPublication.allBook_table_body}
                        id="publicationsTableBody"
                        role={displayType === DisplayType.Grid ? "presentation" : "rowgroup"}
                        style={{ display: displayType === DisplayType.Grid ? "grid" : "" }}
                    >
                        {table.getRowModel().rows.map((row, index) => {
                            const pubView = row.original?.colActions?.publication as PublicationView | undefined;

                            if (displayType === DisplayType.Grid) {
                                if (!pubView) return <tr key={row.id} />;
                                return (
                                    <tr key={pubView.identifier}>
                                        <td>
                                            <PublicationCard
                                                publicationViewMaybeOpds={pubView}
                                                isReading={!!pubView.lastReadingLocation}
                                            />
                                        </td>
                                    </tr>
                                );
                            }

                            return (
                                <tr
                                    key={row.id}
                                    style={{
                                        backgroundColor: index % 2 ? "var(--color-gray-50)" : undefined,
                                        height: "100px",
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface IProps extends TranslatorProps {
    accessibilitySupportEnabled: boolean;
    publicationViews: PublicationView[] | undefined;
    focusInputRef: React.RefObject<HTMLInputElement>;
}

export const AllPublicationsPage = (props: IProps) => {
    const { focusInputRef } = props;
    const [__] = useTranslator();

    const location = useSelector((state: ILibraryRootState) => state.router.location);
    const tags = useSelector((state: ILibraryRootState) => state.publication.tag);
    const locale = useSelector((state: ILibraryRootState) => state.i18n.locale);
    const keyboardShortcuts = useSelector((state: ILibraryRootState) => state.keyboard.shortcuts);
    const dispatch = useDispatch();

    // ← état local pour les publications
    const [publicationViews, setPublicationViews] = React.useState<PublicationView[]>([]);
    const [accessibilitySupportEnabled, setAccessibilitySupportEnabled] = React.useState(false);
    const [tableInstance, setTableInstance] = React.useState<Table<IColumns> | null>(null);

    // ---- Accessibility support ---------------------------------------------

    const accessibilitySupportChanged = React.useCallback((_event: Electron.IpcRendererEvent, accessible: boolean) => {
        setAccessibilitySupportEnabled(accessible);
    }, []);

    // ---- Publications ------------------------------------------------------

    const fetchPublications = React.useCallback(() => {
        apiAction("publication/findAll")
            .then((views) => setPublicationViews(views))
            .catch((error) => console.error("Error fetching publication/findAll", error));
    }, []);

    // ---- Keyboard ----------------------------------------------------------

    const onKeyboardFocusSearch = React.useCallback(() => {
        if (focusInputRef?.current) {
            focusInputRef.current.focus();
        }
    }, [focusInputRef]);

    const keyboardShortcutsRef = React.useRef(keyboardShortcuts);
    React.useEffect(() => {
        keyboardShortcutsRef.current = keyboardShortcuts;
    }, [keyboardShortcuts]);

    // ---- Mount / Unmount ---------------------------------------------------

    const onKeyboardNavigateFirst = React.useCallback(() => {
            tableInstance.setPageIndex(0);
        }, [tableInstance]);
        const onKeyboardNavigatePrevious = React.useCallback(() => {
            tableInstance.previousPage();
        }, [tableInstance]);
        const onKeyboardNavigateNext = React.useCallback(() => {
            tableInstance.nextPage();
        }, [tableInstance]);
        const onKeyboardNavigateLast = React.useCallback(() => {
            tableInstance.setPageIndex(tableInstance.getPageCount() - 1);
        }, [tableInstance]);
        
    const registerAllKeyboardListeners = React.useCallback(() => {
    
            registerKeyboardListener(
                true, // listen for key up (not key down)
                keyboardShortcuts.NavigatePreviousLibraryPageAlt,
                onKeyboardNavigateFirst);
            registerKeyboardListener(
                true, // listen for key up (not key down)
                keyboardShortcuts.NavigatePreviousLibraryPage,
                onKeyboardNavigatePrevious);
            registerKeyboardListener(
                true, // listen for key up (not key down)
                keyboardShortcuts.NavigateNextLibraryPage,
                onKeyboardNavigateNext);
            registerKeyboardListener(
                true, // listen for key up (not key down)
                keyboardShortcuts.NavigateNextLibraryPageAlt,
                onKeyboardNavigateLast);
        }, [onKeyboardNavigateFirst, onKeyboardNavigateLast, onKeyboardNavigateNext, onKeyboardNavigatePrevious,
            keyboardShortcuts.NavigatePreviousLibraryPageAlt,
            keyboardShortcuts.NavigatePreviousLibraryPage,
            keyboardShortcuts.NavigateNextLibraryPage,
            keyboardShortcuts.NavigateNextLibraryPageAlt,
        ]);

        const unregisterAllKeyboardListeners = React.useCallback(() => {
                unregisterKeyboardListener(onKeyboardNavigateFirst);
                unregisterKeyboardListener(onKeyboardNavigateLast);
                unregisterKeyboardListener(onKeyboardNavigatePrevious);
                unregisterKeyboardListener(onKeyboardNavigateNext);
            }, [onKeyboardNavigateFirst, onKeyboardNavigateLast, onKeyboardNavigateNext, onKeyboardNavigatePrevious]);

    React.useEffect(() => {
        // Accessibility
        ipcRenderer.on("accessibility-support-changed", accessibilitySupportChanged);
        console.log("useEffect mount - ipcRenderer.send accessibility-support-query");
        ipcRenderer.send("accessibility-support-query");

        // Keyboard
        ensureKeyboardListenerIsInstalled();
        registerAllKeyboardListeners(); // ← adapter selon votre implémentation

        // Publications subscription
        const unsubscribe = apiSubscribe([
            "publication/importFromFs",
            "publication/delete",
            "publication/importFromLink",
            "publication/updateTags",
            "publication/findAllRefresh",
            "publication/recover",
        ], fetchPublications);

        // Fetch initial
        fetchPublications();

        // Focus search si paramètre dans l'URL
        if (location?.search?.indexOf("focus=search") > -1) {
            console.log("focus=search");
            setTimeout(() => onKeyboardFocusSearch(), 400);
        }

        return () => {
            // Cleanup
            ipcRenderer.off("accessibility-support-changed", accessibilitySupportChanged);
            unregisterAllKeyboardListeners(); // ← adapter selon votre implémentation
            if (unsubscribe) unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← tableau vide = équivalent de componentDidMount/componentWillUnmount

    // ---- Update keyboard shortcuts -----------------------------------------

    const prevKeyboardShortcutsRef = React.useRef(keyboardShortcuts);
    React.useEffect(() => {
        if (!keyboardShortcutsMatch(prevKeyboardShortcutsRef.current, keyboardShortcuts)) {
            unregisterAllKeyboardListeners();
            registerAllKeyboardListeners();
        }
        prevKeyboardShortcutsRef.current = keyboardShortcuts;

        // Accessibility query à chaque update (comme componentDidUpdate)
        console.log("useEffect update - ipcRenderer.send accessibility-support-query");
        ipcRenderer.send("accessibility-support-query");
    }, [keyboardShortcuts, registerAllKeyboardListeners, unregisterAllKeyboardListeners]);

    // ---- Actions -----------------------------------------------------------

    const displayPublicationInfo = React.useCallback((publicationViewIdentifier: string) => {
        dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib, {
            publicationIdentifier: publicationViewIdentifier,
        }));
    }, [dispatch]);

    const openReader = React.useCallback((publicationViewIdentifier: string) => {
        dispatch(readerActions.openRequest.build(publicationViewIdentifier));
    }, [dispatch]);

    // ---- Render ------------------------------------------------------------

    const displayType = (
        location?.state && (location.state as IRouterLocationState).displayType
    ) || DisplayType.Grid;

    const secondaryHeader = <Header />;

    return (
        <LibraryLayout
            title={__("header.allBooks")}
            secondaryHeader={secondaryHeader}
        >
            <PublicationsTable
                key={locale}
                accessibilitySupportEnabled={accessibilitySupportEnabled}
                location={location}
                displayType={displayType}
                publicationViews={publicationViews}
                displayPublicationInfo={displayPublicationInfo}
                openReader={openReader}
                focusInputRef={focusInputRef}
                tags={tags}
                setTableInstance={setTableInstance}
            />
            <AboutThoriumButton />
        </LibraryLayout>
    );
};
