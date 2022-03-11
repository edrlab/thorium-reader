// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "regenerator-runtime/runtime"; // for react-table (useAsyncDebounce()) see: https://github.com/TanStack/react-table/issues/2071#issuecomment-679999096
import SVG from "readium-desktop/renderer/common/components/SVG";
// import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as magnifyingGlass from "readium-desktop/renderer/assets/icons/magnifying_glass.svg";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-play_arrow-24px.svg"; // baseline-arrow_forward_ios-24px -- arrow
// import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/baseline-skip_next-24px.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/baseline-skip_previous-24px.svg";
import { matchSorter } from "match-sorter";
import { readerActions } from "readium-desktop/common/redux/actions";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { TDispatch } from "readium-desktop/typings/redux";
import {
    FilterTypes,
    Row,
    TableInstance,
    TableOptions,
    TableState,
    UseFiltersColumnProps,
    UseFiltersInstanceProps,
    UseFiltersOptions,
    UseGlobalFiltersInstanceProps,
    UseGlobalFiltersOptions,
    UseGlobalFiltersState,
    UsePaginationInstanceProps,
    UsePaginationOptions,
    UsePaginationState,
    UseSortByColumnProps,
    UseSortByInstanceProps,
    UseSortByOptions,
    UseSortByState,
    UseTableColumnProps,
    UseFiltersColumnOptions,
    UseTableColumnOptions,
    UseSortByColumnOptions,
    UseGlobalFiltersColumnOptions,
} from "react-table";
import { Column, useTable, useFilters, useSortBy, usePagination, useGlobalFilter, useAsyncDebounce } from "react-table";
import { formatTime } from "readium-desktop/common/utils/time";
import * as DOMPurify from "dompurify";
import * as moment from "moment";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { AvailableLanguages, I18nTyped, Translator } from "readium-desktop/common/services/translator";
import * as React from "react";
import { connect } from "react-redux";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/library/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { Unsubscribe } from "redux";

import Header from "../catalog/Header";

import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";

// import { GridView } from "readium-desktop/renderer/library/components/utils/GridView";
// import { ListView } from "readium-desktop/renderer/library/components/utils/ListView";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    publicationViews: PublicationView[] | undefined;
}

export class AllPublicationPage extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;
    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
        this.inputRef = React.createRef<HTMLInputElement>();

        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        this.unsubscribe = apiSubscribe([
            "publication/importFromFs",
            "publication/delete",
            "publication/importFromLink",
            // "catalog/addEntry",
            "publication/updateTags",
        ], () => {
            apiAction("publication/findAll")
                .then((publicationViews) => {
                    this.setState({publicationViews});
                    setTimeout(() => {
                        this.onKeyboardFocusSearch();
                    }, 400);
                })
                .catch((error) => console.error("Error to fetch api publication/findAll", error));
        });
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();

        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public async componentDidUpdate(oldProps: IProps) {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render(): React.ReactElement<{}> {
        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        const { __ } = this.props;
        const title = __("catalog.allBooks");

        const secondaryHeader = <Header />;
        const breadCrumb = <BreadCrumb breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title }]}/>;

        return (
            <LibraryLayout
                title={`${__("catalog.myBooks")} / ${title}`}
                secondaryHeader={secondaryHeader}
                breadCrumb={breadCrumb}
            >
                {
                    this.state.publicationViews ?
                        <TableView
                            displayType={displayType}
                            __={__}
                            translator={this.props.translator}
                            publicationViews={this.state.publicationViews}
                            displayPublicationInfo={this.props.displayPublicationInfo}
                            openReader={this.props.openReader}
                            inputRef={this.inputRef}
                        />
                        // (displayType === DisplayType.Grid ?
                        //     <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                        //     <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                    : <></>
                }
            </LibraryLayout>
        );
    }

    private registerAllKeyboardListeners() {
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusSearch,
            this.onKeyboardFocusSearch);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardFocusSearch);
    }

    private onKeyboardFocusSearch = () => {
        if (!this.inputRef?.current) {
            return;
        }
        this.inputRef.current.focus();
        // this.inputRef.current.select();
        this.inputRef.current.setSelectionRange(0, this.inputRef.current.value.length);
    };
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    keyboardShortcuts: state.keyboard.shortcuts,
});

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        displayPublicationInfo: (publicationViewIdentifier: string) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoLib,
                {
                    publicationIdentifier: publicationViewIdentifier,
                },
            ));
        },
        openReader: (publicationViewIdentifier: string) => {
            dispatch(readerActions.openRequest.build(publicationViewIdentifier));
        },
    };
};

const commonCellStyles =  (props: {displayType: DisplayType}): React.CSSProperties => {
    return {
        // minHeight: props.displayType === DisplayType.Grid ? "150px" : "80px",
        maxHeight: props.displayType === DisplayType.Grid ? "150px" : "80px",

        // minWidth: props.displayType === DisplayType.Grid ? "150px" : "100px",
        // maxWidth: props.displayType === DisplayType.Grid ? "150px" : "50px",

        padding: "0.4em",
        overflowY: "auto",
        textAlign: "center",
        userSelect: "text",
    };
};

const CellGlobalFilter: React.FC<TableCellGlobalFilter_IProps> = (props) => {

    const [value, setValue] = React.useState(props.globalFilter);

    const onChange = useAsyncDebounce((value) => {
        props.setGlobalFilter(value || undefined);
    }, 500);

    return (
        <div
            style={{
                // border: "1px solid blue",
                textAlign: "left",
            }}>

            <span
                style={{
                    fontSize: "90%",
                    fontWeight: "bold",
                }}>
                {`${props.__("header.searchPlaceholder")}`}
            </span>
            <div
                    aria-live="polite"
                    style={{
                        // border: "1px solid red",
                        marginLeft: "0.4em",
                        display: "inline-block",
                        fontSize: "90%",
                        // width: "4em",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                    }}>
                {props.globalFilteredRows.length !== props.preGlobalFilteredRows.length ? ` (${props.globalFilteredRows.length} / ${props.preGlobalFilteredRows.length})` : ` (${props.preGlobalFilteredRows.length})`}
            </div>
            <input
                ref={props.inputRef}
                type="search"
                value={value || ""}
                onChange={(e) => {
                    setValue(e.target.value);
                    onChange(e.target.value);
                }}
                aria-label={`${props.__("header.searchTitle")}`}
                placeholder={`${props.__("header.searchTitle")}`}
                style={{
                    border: "1px solid gray",
                    borderRadius: "4px",
                    margin: "0",
                    marginLeft: "0.4em",
                    width: "10em",
                    padding: "0.2em",
                }}
                />
        </div>
    );
};

const CellColumnFilter: React.FC<TableCellFilter_IProps> = (props) => {

// <span
// style={{
//     fontSize: "90%",
//     fontWeight: "bold",
// }}>
// {`${props.__("header.searchPlaceholder")}`}
// </span>

// <div
// aria-live="polite"
// style={{
//     // border: "1px solid red",
//     marginLeft: "0.4em",
//     display: "inline-block",
//     fontSize: "90%",
//     // width: "4em",
//     overflow: "visible",
//     whiteSpace: "nowrap",
// }}>
// {props.column.filteredRows.length !== props.column.preFilteredRows.length ? ` (${props.column.filteredRows.length} / ${props.column.preFilteredRows.length})` : ` (${props.column.preFilteredRows.length})`}
// </div>
    return props.showColumnFilters ?
    <>
    <input
        type="search"
        value={props.column.filterValue || ""}
        onChange={(e) => {
            props.column.setFilter(e.target.value || undefined);
        }}
        aria-label={`${props.__("header.searchPlaceholder")}`}
        placeholder={`${props.__("header.searchPlaceholder")}`}
        style={{
            border: "1px solid gray",
            borderRadius: "4px",
            margin: "0",
            width: "100%",
            padding: "0.2em",
            backgroundColor: "white",
        }}
    />
    </>
    : <></>;
};

const CellCoverImage: React.FC<TableCellId_IProps> = (props) => {
    return (<div style={{
        padding: "0",
        margin: "0",
        textAlign: "center",
    }}>
        <a
            style={{
                cursor: "pointer",
            }}
            tabIndex={0}
            onClick={(e) => {
                e.preventDefault();

                props.displayPublicationInfo(props.value.publicationViewIdentifier);
                // props.openReader(props.value.publicationViewIdentifier);
            }}
            onKeyPress={
                (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();

                        props.displayPublicationInfo(props.value.publicationViewIdentifier);
                        // props.openReader(props.value.publicationViewIdentifier);
                    }
                }
            }
            title={`${props.__("catalog.bookInfo")} (${props.value.title})`}
        >
        <img
            src={
                // NOTE! empty string doesn't work with `??` operator, must use ternary!
                props.value.label
                ?
                props.value.label
                :
                "data:image/png;base64,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"
            }
            alt={""}
            role="presentation"
            style={{

            objectFit: "contain",
            width: "100%",
            height: "100%",

            // minHeight: props.displayType === DisplayType.Grid ? "150px" : "80px",
            // maxHeight: props.displayType === DisplayType.Grid ? "150px" : "50px",

            // minWidth: props.displayType === DisplayType.Grid ? "150px" : "100px",
            // maxWidth: props.displayType === DisplayType.Grid ? "150px" : "50px",
        }} />
        </a>
    </div>);
};
const CellDescription: React.FC<TableCell_IProps> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
        paddingBottom: "0",
        // marginBottom: "0.4em",

        // minHeight: props.displayType === DisplayType.Grid ? "150px" : "80px",
        // maxHeight: props.displayType === DisplayType.Grid ? "150px" : "100px",

        // minWidth: props.displayType === DisplayType.Grid ? "150px" : "100px",
        // maxWidth: props.displayType === DisplayType.Grid ? "150px" : "50px",

        // textAlign: props.displayType === DisplayType.Grid ? "justify" : "start",
        textAlign: "start",
    }} dangerouslySetInnerHTML={{__html: props.value}} />);
};
const CellTitle: React.FC<TableCellId_IProps> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
        fontWeight: "bold",
    }}><a
        style={{ cursor: "pointer", paddingTop: "0.4em", paddingBottom: "0.4em" }}
        tabIndex={0}
        onClick={(e) => {
            e.preventDefault();

            props.displayPublicationInfo(props.value.publicationViewIdentifier);
            // props.openReader(props.value.publicationViewIdentifier);
        }}
        onKeyPress={
            (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();

                    props.displayPublicationInfo(props.value.publicationViewIdentifier);
                    // props.openReader(props.value.publicationViewIdentifier);
                }
            }
        }
        title={`${props.__("catalog.bookInfo")} (${props.value.title})`}
    >
        {props.value.label}
        </a>
    </div>);
};
const TableCell: React.FC<TableCell_IProps> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
    }}>
        {props.value}
    </div>);
};

interface TableAction_IProps {
    displayPublicationInfo: ReturnType<typeof mapDispatchToProps>["displayPublicationInfo"];
    openReader: ReturnType<typeof mapDispatchToProps>["openReader"];
}
interface TableCommon_IProps {
    __: I18nTyped;
    translator: Translator;
    displayType: DisplayType;
}
interface TableCellGlobalFilter_IProps extends TableCommon_IProps {
    preGlobalFilteredRows: Row<IColumns>[];
    globalFilteredRows: Row<IColumns>[];
    globalFilter: string;
    setGlobalFilter: (filterValue: string) => void;
    inputRef: React.RefObject<HTMLInputElement>;
}
interface TableCellFilter_IProps extends TableCommon_IProps {
    showColumnFilters: boolean,
    column: {
        filterValue: string | undefined;
        preFilteredRows: string[];
        filteredRows: string[];
        setFilter: (str: string | undefined) => void;
    };
}
interface IColumnValue {
    label: string,
    title: string,
    publicationViewIdentifier: string,
};
interface TableCellId_IProps extends TableCommon_IProps, TableAction_IProps {
    value: IColumnValue;
}
interface TableCell_IProps extends TableCommon_IProps, TableAction_IProps {
    value: string;
}
interface TableView_IProps extends TableCommon_IProps, TableAction_IProps {
    publicationViews: PublicationView[];
    inputRef: React.RefObject<HTMLInputElement>;
}

interface IColumns {
    colCover: IColumnValue,
    colTitle: IColumnValue;
    colAuthors: string;
    colPublishers: string;
    colLanguages: string;
    colPublishedDate: string;
    colDescription: string;
    // colIdentifier: string;
    // colPublicationType: string;
    colLCP: string;
    colTags: string;
    colDuration: string;
    // colProgression: string;
}

// https://gist.github.com/ggascoigne/646e14c9d54258e40588a13aabf0102d
// https://github.com/TanStack/react-table/issues/3064
// https://github.com/TanStack/react-table/issues/2912
// etc. :(
type MyTableInstance<T extends object> =
    TableInstance<T> & // UseTableInstanceProps
    UseGlobalFiltersInstanceProps<T> &
    UseFiltersInstanceProps<T> &
    UseSortByInstanceProps<T> &
    UsePaginationInstanceProps<T> & {
        state: TableState<T> & UsePaginationState<T> & UseGlobalFiltersState<T> & UseSortByState<T>;
    };

export const TableView: React.FC<TableView_IProps> = (props) => {

    const [showColumnFilters, setShowColumnFilters] = React.useState(false);

    const tableRows = React.useMemo(() => {
        return props.publicationViews.map((publicationView) => {

            // translator.translateContentField(author)
            const authors = publicationView.authors ? formatContributorToString(publicationView.authors, props.translator) : "";
            const publishers = publicationView.publishers ? formatContributorToString(publicationView.publishers, props.translator) : "";

            const mom = publicationView.publishedAt ? moment(publicationView.publishedAt) : undefined;
            const publishedDate = mom ? `${mom.year()}-${mom.month().toString().padStart(2, "0")}-${mom.day().toString().padStart(2, "0")}` : ""; // .toISOString()

            const languages = publicationView.languages ? publicationView.languages.map((lang) => {

                // See FormatPublicationLanguage

                // Note: "pt-PT" in the i18next ResourceBundle is not captured because key match reduced to "pt"
                // Also: pt-pt vs. pt-PT case sensitivity
                // Also zh-CN (mandarin chinese)
                const l = lang.split("-")[0];

                // because dynamic label does not pass typed i18n compilation
                const translate = props.__ as (str: string) => string;

                // The backticks is not captured by the i18n scan script (automatic detection of translate("...") calls)
                let ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);

                const lg = AvailableLanguages[l as keyof typeof AvailableLanguages];
                if (lg && lang == ll) {
                    ll = lg;
                }

                const note = (lang !== ll) ? ` (${lang})` : "";

                return ll + note;
            }).join(", ") : "";

            const description = publicationView.description ? DOMPurify.sanitize(publicationView.description).replace(/font-size:/g, "font-sizexx:") : "";

            const tags = publicationView.tags ? publicationView.tags.join(", ") : "";

            const lcp = publicationView.lcp ? "LCP" : "";

            const identifier = publicationView.workIdentifier ? publicationView.workIdentifier : "";

            const publicationType = publicationView.RDFType ? publicationView.RDFType : "";

            const duration = (publicationView.duration ? formatTime(publicationView.duration) : "") + (publicationView.nbOfTracks ? ` (${props.__("publication.audio.tracks")}: ${publicationView.nbOfTracks})` : "");

            // r2PublicationJson: JsonMap;
            // lastReadingLocation?: LocatorExtended;
            return {
                colCover: {
                    label: publicationView.cover?.thumbnailUrl ?? publicationView.cover?.coverUrl ?? "",
                    publicationViewIdentifier: publicationView.identifier,
                    title: publicationView.title,
                },
                colTitle: {
                    label: publicationView.title,
                    publicationViewIdentifier: publicationView.identifier,
                    title: publicationView.title,
                },
                colAuthors: authors,
                colPublishers: publishers,
                colLanguages: languages,
                colPublishedDate: publishedDate,
                colIdentifier: identifier,
                colPublicationType: publicationType,
                colLCP: lcp,
                colTags: tags,
                colDuration: duration,
                // colProgression: "Progression",
                colDescription: description,

                // colPublicationViewIdentifier: publicationView.identifier,
            };
        }) as IColumns[];
    }, [props.publicationViews]);

    const tableColumns = React.useMemo(() => {
        const arr: (Column<IColumns> &
            UseTableColumnOptions<IColumns>  &
            UseSortByColumnOptions<IColumns>  &
            UseGlobalFiltersColumnOptions<IColumns>  &
            UseFiltersColumnOptions<IColumns>)[] = [
            {
                Header: props.__("publication.cover.img"),
                accessor: "colCover",
                Cell: CellCoverImage,
            },
            {
                Header: props.__("publication.title"),
                accessor: "colTitle",
                Cell: CellTitle,
                filter: "text", // because IColumnValue instead of plain string
            },
            {
                Header: props.__("publication.author"),
                accessor: "colAuthors",
            },
            {
                Header: props.__("catalog.publisher"),
                accessor: "colPublishers",
            },
            {
                Header: props.__("catalog.lang"),
                accessor: "colLanguages",
            },
            {
                Header: props.__("catalog.released"),
                accessor: "colPublishedDate",
            },
            // {
            //     Header: "Identifier",
            //     accessor: "colIdentifier",
            // },
            // {
            //     Header: "Type",
            //     accessor: "colPublicationType",
            // },
            {
                Header: props.__("catalog.tags"),
                accessor: "colTags",
            },
            // {
            //     Header: props.__("publication.progression.title"),
            //     accessor: "colProgression",
            // },
            {
                Header: "DRM",
                accessor: "colLCP",
            },
            {
                Header: props.__("publication.duration.title"),
                accessor: "colDuration",
            },
            {
                Header: props.__("catalog.description"),
                accessor: "colDescription",
                Cell: CellDescription,
            },
        ];
        return arr;
    }, [props.displayType]);

    const defaultColumn = React.useMemo(
        () => ({
            Cell: TableCell,
            Filter: CellColumnFilter,
        }),
        [],
    );

    const filterTypes = React.useMemo(() => ({

            globalFilter: (rows: Row<IColumns>[], columnIds: string[], filterValue: string) => {
                const set = new Set<Row<IColumns>>();
                columnIds.forEach((columnId) => {
                    const subRes = filterTypes.text(rows, columnId, filterValue);
                    subRes.forEach((r) => {
                        set.add(r);
                    });
                });
                const res = Array.from(set);
                // console.log(`filterTypes.globalFilter ======= ${rows.length} ${JSON.stringify(columnIds)} ${typeof filterValue} ${res.length}`);
                return res;
            },
            text: (rows: Row<IColumns>[], columnId: string, filterValue: string) => {
                // const res = rows.filter((row) => {
                //     let rowValue = row.values[columnId];
                //     if (typeof rowValue !== "string") {
                //         rowValue = (rowValue as IColumnValue).label;
                //     }
                //     return rowValue
                //         ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
                //         : true; // keep (filter in, not out)
                // });
                const res = matchSorter<Row<IColumns>>(rows, filterValue, { keys: [(row) => {
                    let rowValue = row.values[columnId];
                    if (typeof rowValue !== "string") {
                        rowValue = (rowValue as IColumnValue).label;
                    }
                    return rowValue;
                }],
                // https://github.com/kentcdodds/match-sorter#threshold-number
                threshold: matchSorter.rankings.CONTAINS});
                // console.log(`filterTypes.text ======= ${rows.length} ${columnId} ${typeof filterValue} ${res.length}`);
                return res;
            },
        }),
    []);

    // infinite render loop
    // tableInstance.setPageSize(pageSize);
    const initialState: UsePaginationState<IColumns> = {
        pageSize: 20, // props.displayType === DisplayType.List ? 20 : 10;
        pageIndex: 0,
    };
    const opts:
        TableOptions<IColumns> &
        UseFiltersOptions<IColumns> &
        UseGlobalFiltersOptions<IColumns> &
        UseSortByOptions<IColumns> &
        UsePaginationOptions<IColumns> = {

        columns: tableColumns,
        data: tableRows,
        defaultColumn,
        globalFilter: "globalFilter",
        filterTypes: filterTypes as unknown as FilterTypes<IColumns>, // because typing 'columnIds' instead of 'columnId' in FilterType<D> ?!
        initialState: initialState as TableState<IColumns>, // again, typing woes :(
    };
    const tableInstance =
        useTable<IColumns>(opts, useFilters, useGlobalFilter, useSortBy, usePagination) as MyTableInstance<IColumns>;


    // <pre>
    // <code>
    //     {JSON.stringify(
    //     {
    //         pageIndex: tableInstance.state.pageIndex,
    //         pageSize: tableInstance.state.pageSize,
    //         pageCount: tableInstance.pageCount,
    //         canNextPage: tableInstance.canNextPage,
    //         canPreviousPage: tableInstance.canPreviousPage,
    //         pageOptions: tableInstance.pageOptions,
    //     }, null, 2)}
    // </code>
    // </pre>
    // <span>
    // {tableInstance.state.pageIndex + 1} / {tableInstance.pageOptions.length}
    // </span>
    // <span>
    // {props.__("reader.navigation.goTo")}
    // <input
    //     type="number"
    //     defaultValue={tableInstance.state.pageIndex + 1}
    //     onChange={(e) => {
    //         const page = e.target.value ? Number(e.target.value) - 1 : 0;
    //         tableInstance.gotoPage(page);
    //     }}
    //     style={{ width: "100px" }}
    // />
    // </span>
    //     <select
    //     value={tableInstance.state.pageSize}
    //     onChange={e => {
    //         tableInstance.setPageSize(Number(e.target.value));
    //     }}
    // >
    //     Show
    //     {[10, 20, 30, 40, 50].map((pageSize) => (
    //         <option
    //             key={`p${pageSize}`}
    //             value={pageSize}>
    //             {pageSize}
    //         </option>
    //     ))}
    //     </select>
    return (
        <>
        <div style={{
            // border: "1px solid red",
            position: "fixed",
            // width: "calc(100% - 50px)",
            zIndex: "101",
            // position: "absolute",
            // top: "-5px",
            // bottom: "0",
            // left: "0",
            right: "0",
            padding: "0",
            // paddingBottom: "0.1em",
            margin: "0",
            marginTop: "-138px",
            marginRight: "30px",
            // display: "flex",
            // flexDirection: "row",
            // alignItems: "center",
            // justifyContent: "flex-end",
            // pointerEvents: "none",
        }}>
        <div style={{
            // pointerEvents: "all",
            display: "inline-block",
            fontSize: "90%",
        }}>
            {
            // ${props.__("catalog.opds.info.numberOfItems")}
            // `(${tableRows.length})`
            }
            <CellGlobalFilter
                    preGlobalFilteredRows={tableInstance.preGlobalFilteredRows}
                    globalFilteredRows={tableInstance.globalFilteredRows}
                    globalFilter={tableInstance.state.globalFilter}
                    setGlobalFilter={tableInstance.setGlobalFilter}
                    __={props.__}
                    translator={props.translator}
                    displayType={props.displayType}
                    inputRef={props.inputRef}
                />
        </div></div>

        <div style={{
            // border: "1px solid red",
            position: "fixed",
            // width: "calc(100% - 50px)",
            // zIndex: "9999",
            // position: "absolute",
            // top: "-5px",
            // bottom: "0",
            // left: "0",
            right: "0",
            padding: "0",
            // paddingBottom: "0.1em",
            margin: "0",
            marginTop: "-74px",
            marginRight: "30px",
            // display: "flex",
            // flexDirection: "row",
            // alignItems: "center",
            // justifyContent: "flex-end",
            // pointerEvents: "none",
        }}>
            <div style={{
                // pointerEvents: "all",
                display: "flex",
                alignItems: "center",
            }}>
            <button
            style={{
                margin:"0",
                padding: "0em",
                width: "30px",
                fill: tableInstance.canPreviousPage ? "#333333" : "gray",
            }}
            aria-label={`${props.__("opds.firstPage")}`}
            onClick={() => tableInstance.gotoPage(0)}
            disabled={!tableInstance.canPreviousPage}>
                <SVG svg={ArrowFirstIcon} />
            </button>
            <button
            style={{
                margin:"0",
                padding: "0",
                transform: "rotate(180deg)",
                width: "30px",
                fill: tableInstance.canPreviousPage ? "#333333" : "gray",
            }}
            aria-label={`${props.__("opds.previous")}`}
            onClick={() => tableInstance.previousPage()}
            disabled={!tableInstance.canPreviousPage}>
                <SVG svg={ArrowRightIcon} />
            </button>
            <select
                aria-label={`${props.__("reader.navigation.currentPageTotal", {current: tableInstance.state.pageIndex + 1, total: tableInstance.pageOptions.length})}`}
                style={{cursor: "pointer", minWidth: "5em", textAlign: "center", padding: "0.2em", margin: "0", marginLeft: "0em", marginRight: "0em", border: "1px solid gray", borderRadius: "4px"}}
                value={tableInstance.state.pageIndex}
                onChange={(e) => {
                    const pageIndex = e.target.value ? Number(e.target.value) : 0;
                    tableInstance.gotoPage(pageIndex);
                }}
            >
                {
                ".".repeat(tableInstance.pageOptions.length).split("").map((_s, i) => (
                    <option
                        key={`page${i}`}
                        value={i}>
                        {i + 1} / {tableInstance.pageOptions.length}
                    </option>
                ))
                }
            </select>
            <button
            style={{
                margin:"0",
                padding: "0",
                width: "30px",
                fill: tableInstance.canNextPage ? "#333333" : "gray",
            }}
            aria-label={`${props.__("opds.next")}`}
            onClick={() => tableInstance.nextPage()}
            disabled={!tableInstance.canNextPage}>
                <SVG svg={ArrowRightIcon} />
            </button>
            <button
            style={{
                margin:"0",
                padding: "0em",
                width: "30px",
                fill: tableInstance.canNextPage ? "#333333" : "gray",
            }}
            aria-label={`${props.__("opds.lastPage")}`}
            onClick={() => tableInstance.gotoPage(tableInstance.pageCount - 1)}
            disabled={!tableInstance.canNextPage}>
                <SVG svg={ArrowLastIcon} />
            </button>
            </div>
        </div>

        <div
            style={{
                overflow: "auto",
                position: "absolute",
                top: "0",
                bottom: "0",
                left: "0",
                right: "0",
                padding: "0",
                marginLeft: "30px",
                marginRight: "30px",
                marginTop: "0em",
                marginBottom: "0.4em",
            }}>
        <table {...tableInstance.getTableProps()}
            style={{
                fontSize: "90%",
                border: "solid 1px gray",
                borderRadius: "8px",
                padding: "4px",
                margin: "0",
                // marginRight: "1em",
                borderSpacing: "0",
                // minWidth: "calc(100% - 30px)",
            }}>
            <thead>{tableInstance.headerGroups.map((headerGroup, index) =>
                (<tr key={`headtr_${index}`} {...headerGroup.getHeaderGroupProps()}>{
                headerGroup.headers.map((col, i) => {

                    const column = col as unknown as (
                        { Header: string } &
                        UseTableColumnProps<IColumns> &
                        UseSortByColumnProps<IColumns> &
                        UseFiltersColumnProps<IColumns>
                    );

                    const columnIsSortable = column.id !== "colCover";

                    const W = column.id === "colCover" ?
                        (props.displayType === DisplayType.Grid ? "100px" : "40px") :
                        column.id === "colLCP" ?
                        "60px" :
                        column.id === "colPublishedDate" ?
                        "120px" :
                        column.id === "colProgression" ?
                        "100px" :
                        column.id === "colDuration" ?
                        "100px" :
                        "160px";
                    return (<th
                        key={`headtrth_${i}`}
                        {...column.getHeaderProps(columnIsSortable ? ({...column.getSortByToggleProps(),
                            // @ts-expect-error TS2322
                            title: undefined,
                            onClick: undefined,
                        }) : undefined)}
                        style={{
                            width: W,
                            minWidth: W,
                            maxWidth: W,
                            borderBottom: "1px solid #bcbcbc",
                            borderLeft: "1px solid #bcbcbc",
                            padding: "0.7em",
                            margin: "0",
                            background: "#eeeeee", // columnIsSortable ? "#eeeeee" : "white",
                            color: "black",
                            whiteSpace: "nowrap",
                            // ...{ cursor: columnIsSortable ? "pointer" : undefined },
                        }}
                        >
                        {
                        columnIsSortable ?
                        <><button
                        style={{height: "auto", padding: "0.2em", margin: "0", fontWeight: "bold", fontSize: "100%"}}
                        onClick={() => {
                            column.toggleSortBy();
                        }}
                        aria-label={
                            `${column.Header}${
                            column.isSorted ? (column.isSortedDesc ?
                            ` (${props.__("catalog.column.descending")})`
                            :
                            ` (${props.__("catalog.column.ascending")})`)
                            :
                            ` (${props.__("catalog.column.unsorted")})`
                            }`
                            }
                            >
                            {
                            column.render("Header")
                            }
                        </button>
                        <button
                        style={{height: "auto", padding: "0.2em", margin: "0", fontWeight: "bold", fontSize: "100%"}}
                        aria-hidden="true"
                        role="presentation"
                        onClick={() => {
                            column.toggleSortBy();
                        }}
                        title={
                            `${
                            column.isSorted ? (column.isSortedDesc ?
                            `${props.__("catalog.column.descending")}`
                            :
                            `${props.__("catalog.column.ascending")}`)
                            :
                            `${props.__("catalog.column.unsorted")}`
                            }`
                            }>
                        {
                        column.isSorted ? (column.isSortedDesc ? " ↓" : " ↑") : "" // " ⇅"
                        }</button>
                        {
                        column.canFilter ?
                        (<div style={{display: "block"}}>{ column.render("Filter", {
                            __: props.__,
                            translator: props.translator,
                            displayType: props.displayType,
                            showColumnFilters,
                        }) }</div>)
                        : <></>
                        }
                        </>
                        :
                        // <span
                        // aria-label={`${column.Header}`}
                        //     >
                        //     {
                        //     // props.displayType === DisplayType.List ? "" : column.render("Header")
                        //     // column.render("Header")
                        //     }
                        // </span>
                        <><input
                            id="setShowColumnFiltersCheckbox"
                            type="checkbox"
                            checked={showColumnFilters ? true : false}
                            onChange={() => {
                                setShowColumnFilters(!showColumnFilters);
                                const s = showColumnFilters;
                                setTimeout(() => {
                                    if (!s) {
                                        tableInstance.setGlobalFilter("");
                                    }
                                    if (s) {
                                        for (const col of tableInstance.allColumns) {
                                            tableInstance.setFilter(col.id, "");
                                        }
                                    }
                                }, 200);
                            }}
                            style={{position: "absolute", left: "-999px"}}
                        /><label
                            id="setShowColumnFiltersLabel"
                            htmlFor="setShowColumnFiltersCheckbox"
                            style={{cursor: "pointer", padding: "0.2em", paddingBottom: "0", fill: "black", display: "inline-block", width: "16px", border: showColumnFilters ? "2px solid black" : "1px solid gray", borderRadius: "4px"}}>
                            <SVG svg={magnifyingGlass} title={props.__("header.searchPlaceholder")} />
                        </label></>
                        }
                        </th>);
                    },
                )}</tr>),
            )}
            {
            // <tr>
            // <th
            //     colSpan={tableInstance.visibleColumns.length}
            //     >
            //     <CellGlobalFilter
            //         preGlobalFilteredRows={tableInstance.preGlobalFilteredRows}
            //         globalFilteredRows={tableInstance.globalFilteredRows}
            //         globalFilter={tableInstance.state.globalFilter}
            //         setGlobalFilter={tableInstance.setGlobalFilter}
            //         __={props.__}
            //         translator={props.translator}
            //         displayType={props.displayType}
            //     />
            // </th>
            // </tr>
            }

            </thead>
            <tbody {...tableInstance.getTableBodyProps()}>{tableInstance.page.map((row, index) => {
                tableInstance.prepareRow(row);

                return (<tr key={`bodytr_${index}`} {...row.getRowProps()}
                style={{
                    // outlineColor: "#cccccc",
                    // outlineOffset: "0px",
                    // outlineStyle: "solid",
                    // outlineWidth: "1px",
                    backgroundColor: index % 2 ? "#efefef" : undefined,
                }}>{row.cells.map((cell, i) =>
                    {
                        return (<td key={`bodytrtd_${i}`} {...cell.getCellProps()}
                        style={{
                            padding: "0",
                            margin: "0",
                            // border: "solid 1px #eeeeee",
                        }}
                        >{
                            cell.render("Cell", {
                                __: props.__,
                                translator: props.translator,
                                displayPublicationInfo: props.displayPublicationInfo,
                                openReader: props.openReader,
                                displayType: props.displayType,
                            })
                        }</td>);
                    },
                    )}
                    </tr>
                );
            })}</tbody>
        </table>
        </div>
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AllPublicationPage));
