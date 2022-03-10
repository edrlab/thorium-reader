// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { TDispatch } from "readium-desktop/typings/redux";
import {
    TableInstance,
    TableState,
    UsePaginationInstanceProps,
    UsePaginationState,
    UseSortByColumnProps,
    UseTableColumnProps,
} from "react-table";
import { Column, useTable, useFilters, useSortBy, usePagination } from "react-table";
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

    constructor(props: IProps) {
        super(props);
        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/importFromFs",
            "publication/delete",
            "publication/importFromLink",
            // "catalog/addEntry",
            "publication/updateTags",
        ], () => {
            apiAction("publication/findAll")
                .then((publicationViews) => this.setState({publicationViews}))
                .catch((error) => console.error("Error to fetch api publication/findAll", error));
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
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
                <div style={{
                    overflow: "auto",
                    position: "absolute",
                    top: "0",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    padding: "0",
                    margin: "30px 30px",
                }}>
                    {
                        this.state.publicationViews ?
                            <TableView
                                displayType={displayType}
                                __={__}
                                translator={this.props.translator}
                                publicationViews={this.state.publicationViews}
                                displayPublicationInfo={this.props.displayPublicationInfo}
                                openReader={this.props.openReader}
                            />
                            // (displayType === DisplayType.Grid ?
                            //     <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                            //     <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                        : <></>
                    }
                </div>
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
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

const commonCellStylesMax = (props: {displayType: DisplayType}): React.CSSProperties => {
    return {
        maxWidth: props.displayType === DisplayType.Grid ? "150px" : "150px",
        maxHeight: props.displayType === DisplayType.Grid ? "150px" : "50px",
    };
};
const commonCellStyles = (props: {displayType: DisplayType}): React.CSSProperties => {
    return {
        ...commonCellStylesMax(props),
        padding: "0.4em",
        overflowY: "scroll",
        textAlign: "center",
        userSelect: "text",
    };
};

const CellCoverImage: React.FC<TableCellId_IProps> = (props) => {
    return (<div style={{
        padding: "0",
        margin: "0",
        textAlign: "center",
    }}>
        <a
            style={{ cursor: "pointer" }}
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
        ><img src={props.value.label} alt={""} role="presentation" style={{
        ...commonCellStylesMax(props),
    }} /></a>
    </div>);
};
const CellDescription: React.FC<TableCell_IProps> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
        paddingBottom: "0",
        marginBottom: "0.4em",
        minWidth: props.displayType === DisplayType.Grid ? "300px" : undefined,
        textAlign: props.displayType === DisplayType.Grid ? "justify" : "start",
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

// https://github.com/TanStack/react-table/issues/3064
// https://github.com/TanStack/react-table/issues/2912
// etc. :(
export type PaginationTableInstance<T extends object> = TableInstance<T> &
UsePaginationInstanceProps<T> & {
    state: UsePaginationState<T>;
};

interface TableCommon_IProps {
    __: I18nTyped;
    translator: Translator;
    displayType: DisplayType;
    displayPublicationInfo: ReturnType<typeof mapDispatchToProps>["displayPublicationInfo"];
    openReader: ReturnType<typeof mapDispatchToProps>["openReader"];
}
interface IColumnValue {
    label: string,
    title: string,
    publicationViewIdentifier: string,
};
interface TableCellId_IProps extends TableCommon_IProps {
    value: IColumnValue;
}
interface TableCell_IProps extends TableCommon_IProps {
    value: string;
}
interface TableView_IProps extends TableCommon_IProps {
    publicationViews: PublicationView[];
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
    colProgression: string;
}
export const TableView: React.FC<TableView_IProps> = (props) => {

    const tableRows = React.useMemo<IColumns[]>(() => {
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

            const description = publicationView.description ? DOMPurify.sanitize(publicationView.description) : "";

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
                colDescription: description,
                colIdentifier: identifier,
                colPublicationType: publicationType,
                colLCP: lcp,
                colTags: tags,
                colDuration: duration,
                colProgression: "Progression",

                colPublicationViewIdentifier: publicationView.identifier,
            };
        }) as IColumns[];
    }, [props.publicationViews]);

    const tableColumns = React.useMemo<Column<IColumns>[]>(() => {
        const arr: Column<IColumns>[] = [
            {
                Header: props.__("publication.cover.img"),
                accessor: "colCover",
                Cell: CellCoverImage,
            },
            {
                Header: props.__("publication.title"),
                accessor: "colTitle",
                Cell: CellTitle,
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
            {
                Header: props.__("catalog.description"),
                accessor: "colDescription",
                Cell: CellDescription,
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
                Header: "LCP (DRM)",
                accessor: "colLCP",
            },
            {
                Header: props.__("catalog.tags"),
                accessor: "colTags",
            },
            {
                Header: props.__("publication.duration.title"),
                accessor: "colDuration",
            },
            {
                Header: props.__("publication.progression.title"),
                accessor: "colProgression",
            },
        ];
        return arr;
    }, [props.displayType]);

    const defaultColumn = React.useMemo(
        () => ({
            Cell: TableCell,
        }),
        [],
    );
    const tableInstance = useTable({
        columns: tableColumns,
        data: tableRows,
        defaultColumn,
        initialState: {
            pageSize: 10,
            pageIndex: 0,
        } as UsePaginationState<IColumns> as TableState<IColumns>,
        // @xxts-expect-error TS2322
        // filterTypes,
    }, useFilters, useSortBy, usePagination) as PaginationTableInstance<IColumns>;

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
    return (
        <table {...getTableProps()} style={{ fontSize: "90%", border: "solid 1px gray", borderRadius: "8px", padding: "4px", margin: "0", marginRight: "1em", borderSpacing: "0" }}>
            <thead>{headerGroups.map((headerGroup, index) =>
                (<tr key={`headtr_${index}`} {...headerGroup.getHeaderGroupProps()}>{
                headerGroup.headers.map((col, i) => {

                    const column = col as unknown as ({ Header: string } & UseTableColumnProps<IColumns> & UseSortByColumnProps<IColumns>);

                    const columnIsSortable = column.id !== "colCover";

                    return (<th
                        key={`headtrth_${i}`}
                        {...column.getHeaderProps(columnIsSortable ? ({...column.getSortByToggleProps(),
                            // @ts-expect-error TS2322
                            title: undefined,
                        }) : undefined)}
                        style={{
                            padding: "0.7em",
                            margin: "0",
                            background: "#eeeeee",
                            color: "black",
                            whiteSpace: "nowrap",
                            ...{
                                cursor: columnIsSortable ? "pointer" : undefined },
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
                        <span aria-hidden="true" role="presentation"
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
                        column.isSorted ? (column.isSortedDesc ? " ↓" : " ↑") : " ⇅"
                        }</span></>
                        :
                        <span
                        aria-label={`${column.Header}`}
                            >
                            {
                            props.displayType === DisplayType.List ? "" : column.render("Header")
                            }
                        </span>
                        }
                        </th>);
                    },
                )}</tr>),
            )}</thead>
            <tbody {...getTableBodyProps()}>{rows.map((row, index) => {
                prepareRow(row);

                return (<tr key={`bodytr_${index}`} {...row.getRowProps()} style={{
                    outlineColor: "#cccccc",
                    outlineOffset: "0px",
                    outlineStyle: "solid",
                    outlineWidth: "1px",
                }}>{row.cells.map((cell, i) =>
                    {
                        return (<td key={`bodytrtd_${i}`} {...cell.getCellProps()}
                        style={{
                            padding: "0",
                            margin: "0",
                            border: "solid 1px #eeeeee",
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
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AllPublicationPage));
