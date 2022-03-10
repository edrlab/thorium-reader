// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    TableInstance,
    UsePaginationInstanceProps,
    UsePaginationState,
} from "react-table";
import { Column, useTable, useFilters, useSortBy, usePagination } from "react-table";
import { formatTime } from "readium-desktop/common/utils/time";
import * as DOMPurify from "dompurify";
import * as moment from "moment";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
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
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
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
                <div>
                    {
                        this.state.publicationViews ?
                            <TableView displayType={displayType} __={__} translator={this.props.translator} publicationViews={this.state.publicationViews} />
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

const CellCoverImage: React.FC<{value: string, displayType: DisplayType}> = (props) => {
    return (<div style={{
        padding: "0",
        margin: "0",
        textAlign: "center",
    }}><img src={props.value} alt={""} role="presentation" style={{
        maxWidth: props.displayType === DisplayType.Grid ? "150px" : "100px",
        maxHeight: props.displayType === DisplayType.Grid ? "200px" : "120px",
    }} /></div>);
};
const CellDescription: React.FC<{value: string, displayType: DisplayType}> = (props) => {
    return (<div style={{
        padding: "0.4em",
        maxHeight: props.displayType === DisplayType.Grid ? "300px" : "100px",
        minWidth: props.displayType === DisplayType.Grid ? "300px" : undefined,
        overflowY: "scroll",
        textAlign: "center",
        userSelect: "text",
    }}>
        {props.value}
    </div>);
};
const TableCell: React.FC<{value: string, displayType: DisplayType}> = (props) => {
    return (<div style={{
        padding: "0.4em",
        maxHeight: props.displayType === DisplayType.Grid ? "300px" : "100px",
        overflowY: "scroll",
        textAlign: "center",
        userSelect: "text",
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
interface TableView_IProps {
    publicationViews: PublicationView[];
    __: I18nTyped;
    translator: Translator;
    displayType: DisplayType;
}
interface IColumns {
    colCover: string;
    colTitle: string;
    colAuthors: string;
    colPublishers: string;
    colLanguages: string;
    colPublishedDate: string;
    colDescription: string;
    colIdentifier: string;
    colPublicationType: string;
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

            const publishedDate = publicationView.publishedAt ? moment(publicationView.publishedAt).year : ""; // .toISOString()

            const languages = publicationView.languages ? publicationView.languages.map((lang) => {

                // See FormatPublicationLanguage

                // Note: "pt-PT" in the i18next ResourceBundle is not captured because key match reduced to "pt"
                // Also: pt-pt vs. pt-PT case sensitivity
                // Also zh-CN (mandarin chinese)
                const l = lang.split("-")[0];

                // because dynamic label does not pass typed i18n compilation
                const translate = props.__ as (str: string) => string;

                // The backticks is not captured by the i18n scan script (automatic detection of translate("...") calls)
                const ll = translate(`languages.${l}`).replace(`languages.${l}`, lang);
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
                colCover: publicationView.cover?.thumbnailUrl ?? publicationView.cover?.coverUrl ?? "x",
                colTitle: publicationView.title,
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
            };
        }) as IColumns[];
    }, [props.publicationViews]);

    const tableColumns = React.useMemo<Column<IColumns>[]>(() => {
        const arr: Column<IColumns>[] = [
            {
                Header: "Cover",
                accessor: "colCover",
                Cell: CellCoverImage,
            },
            {
                Header: "Title",
                accessor: "colTitle",
            },
            {
                Header: "Authors",
                accessor: "colAuthors",
            },
            {
                Header: "Publishers",
                accessor: "colPublishers",
            },
            {
                Header: "Language",
                accessor: "colLanguages",
            },
            {
                Header: "PublishedDate",
                accessor: "colPublishedDate",
            },
            {
                Header: "Description",
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
                Header: "LCP",
                accessor: "colLCP",
            },
            {
                Header: "Tags",
                accessor: "colTags",
            },
            {
                Header: props.__("publication.duration.title"),
                accessor: "colDuration",
            },
            {
                Header: "Progression",
                accessor: "colProgression",
            },
        ];
        return arr;
    }, [props.displayType]);

    const tableInstance = useTable({
        columns: tableColumns,
        data: tableRows,
        defaultColumn: {
            Cell: TableCell,
        },
        initialState: {
            // @ts-expect-error TS2322
            pageSize: 10,
            pageIndex: 0,
        },
        // @xxts-expect-error TS2322
        // filterTypes,
    }, useSortBy); //, useFilters, usePagination) as PaginationTableInstance<object>;

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;
    return (
        <table {...getTableProps()} style={{ border: "solid 1px gray", borderRadius: "8px", padding: "2px", borderSpacing: "3px" }}>
            <thead>{headerGroups.map((headerGroup) =>
                (<tr {...headerGroup.getHeaderGroupProps()}>{
                headerGroup.headers.map((column) =>
                    // @ts-expect-error TS2322
                    (<th {...column.getHeaderProps(column.id !== "colCover" ? column.getSortByToggleProps() : undefined)}
                        style={{
                            padding: "0.7em",
                            margin: "0",
                            background: "#eeeeee",
                            color: "black",
                            whiteSpace: "nowrap",
                        }}
                        >{
                            column.render("Header")
                        }{column.id !== "colCover" ? <span role="presentation" style={{ cursor: "pointer" }}>
                        {
                        // @ts-expect-error TS2322
                        column.isSorted ? column.isSortedDesc ? ' ↓' : ' ↑' : ' ⇅'
                        }</span> : <></>}</th>)
                )}</tr>)
            )}</thead>
            <tbody {...getTableBodyProps()}>{rows.map((row) => {
                prepareRow(row);
                return (<tr {...row.getRowProps()} style={{
                    outlineColor: "#cccccc",
                    outlineOffset: "0px",
                    outlineStyle: "solid",
                    outlineWidth: "1px",
                }}>{row.cells.map(cell => 
                    (<td {...cell.getCellProps()}
                        style={{
                            padding: "0",
                            margin: "0",
                            border: "solid 1px #eeeeee",
                        }}
                        >{
                            cell.render("Cell", { displayType: props.displayType })
                        }</td>)
                    )}
                    </tr>
                )
            })}</tbody>
        </table>
    );
};

export default connect(mapStateToProps)(withTranslator(AllPublicationPage));
