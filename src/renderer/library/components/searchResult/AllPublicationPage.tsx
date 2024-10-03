// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "regenerator-runtime/runtime"; // for react-table (useAsyncDebounce()) see: https://github.com/TanStack/react-table/issues/2071#issuecomment-679999096

import * as stylesPublication from "readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
// import * as stylesTags from "readium-desktop/renderer/assets/styles/components/tags.scss";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.scss";

import { HoverEvent } from "@react-types/shared";
import { convertMultiLangStringToString, langStringIsRTL } from "readium-desktop/renderer/common/language-string";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { Location } from "history";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/arrowLast-icon.svg";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/search-icon.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/arrowFirst-icon.svg";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as TagIcon from "readium-desktop/renderer/assets/icons/tag-icon.svg";
import * as CloseIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
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
    ColumnWithLooseAccessor,
    UseFiltersColumnOptions,
    UseTableColumnOptions,
    UseSortByColumnOptions,
    UseGlobalFiltersColumnOptions,
    IdType,
} from "react-table";
import { Column, useTable, useFilters, useSortBy, usePagination, useGlobalFilter, useAsyncDebounce } from "react-table";
import { formatTime } from "readium-desktop/common/utils/time";
import * as DOMPurify from "dompurify";
import * as moment from "moment";
import { AvailableLanguages, I18nFunction, Translator } from "readium-desktop/common/services/translator";
import * as React from "react";
import { connect } from "react-redux";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/library/apiSubscribe";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { Unsubscribe } from "redux";

import Header from "../catalog/Header";

import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { ipcRenderer } from "electron";
import PublicationCard from "../publication/PublicationCard";
import classNames from "classnames";
import * as Popover from "@radix-ui/react-popover";

// import { PublicationInfoLibWithRadix, PublicationInfoLibWithRadixContent, PublicationInfoLibWithRadixTrigger } from "../dialog/publicationInfos/PublicationInfo";
import { useSearchParams } from "react-router-dom";
// import * as FilterIcon from "readium-desktop/renderer/assets/icons/filter-icon.svg";
// import * as DeleteFilter from "readium-desktop/renderer/assets/icons/deleteFilter-icon.svg";
import { MySelectProps, Select } from "readium-desktop/renderer/common/components/Select";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import * as CalendarIcon from "readium-desktop/renderer/assets/icons/calendar2-icon.svg";
// import * as CalendarExpiredIcon from "readium-desktop/renderer/assets/icons/calendarExpired-icon.svg";
// import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as KeyIcon from "readium-desktop/renderer/assets/icons/key-icon.svg";
import AboutThoriumButton from "../catalog/AboutThoriumButton";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import CatalogMenu from "../publication/menu/CatalogMenu";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import * as ValidatedIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as OnGoingBookIcon from "readium-desktop/renderer/assets/icons/ongoingBook-icon.svg";
import debounce from "debounce";

// import GridTagButton from "../catalog/GridTagButton";

// import {
//     formatContributorToString,
// } from "readium-desktop/renderer/common/logics/formatContributor";

// import { Link } from "react-router-dom";

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
    accessibilitySupportEnabled: boolean;
    tags: string[];
}

export class AllPublicationPage extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;
    private focusInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
        this.focusInputRef = React.createRef<HTMLInputElement>();

        this.state = {
            publicationViews: undefined,
            accessibilitySupportEnabled: false,
            tags: this.props.tags ? this.props.tags.slice() : [],
        };
    }

    public componentDidMount() {

        ipcRenderer.on("accessibility-support-changed", this.accessibilitySupportChanged);

        // note that "@r2-navigator-js/electron/main/browser-window-tracker"
        // uses "accessibility-support-changed" instead of "accessibility-support-query",
        // so there is no duplicate event handler.
        console.log("componentDidMount() ipcRenderer.send - accessibility-support-query");
        ipcRenderer.send("accessibility-support-query");

        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        this.unsubscribe = apiSubscribe([
            "publication/importFromFs",
            "publication/delete",
            "publication/importFromLink",
            // "catalog/addEntry",
            "publication/updateTags",
            "publication/readingFinishedRefresh",
        ], () => {
            apiAction("publication/findAll")
                .then((publicationViews) => {
                    this.setState({ publicationViews });
                    setTimeout(() => {
                        // this.onKeyboardFocusSearch();
                    }, 400);
                })
                .catch((error) => console.error("Error to fetch api publication/findAll", error));
        });

        if (this.props.location.search.indexOf("focus=search") > -1) {
            console.log("focus=search");
            setTimeout(() => {
                this.onKeyboardFocusSearch();
            }, 400);
        }
    }

    public componentWillUnmount() {
        ipcRenderer.off("accessibility-support-changed", this.accessibilitySupportChanged);

        this.unregisterAllKeyboardListeners();

        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public async componentDidUpdate(oldProps: IProps) {

        // note that "@r2-navigator-js/electron/main/browser-window-tracker"
        // uses "accessibility-support-changed" instead of "accessibility-support-query",
        // so there is no duplicate event handler.
        console.log("componentDidUpdate() ipcRenderer.send - accessibility-support-query");
        ipcRenderer.send("accessibility-support-query");

        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render(): React.ReactElement<{}> {
        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        const { __, location, translator, tags, openReader, displayPublicationInfo } = this.props;

        const secondaryHeader = <Header />;
        // const breadCrumb = <BreadCrumb breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title }]}/>;

        return (
            <LibraryLayout
                title={__("header.allBooks")}
                secondaryHeader={secondaryHeader}
            // breadCrumb={breadCrumb}
            >
                {
                    this.state.publicationViews ?
                        <TableView
                            accessibilitySupportEnabled={this.state.accessibilitySupportEnabled}
                            location={location}
                            displayType={displayType}
                            __={__}
                            translator={translator}
                            publicationViews={this.state.publicationViews}
                            displayPublicationInfo={displayPublicationInfo}
                            openReader={openReader}
                            focusInputRef={this.focusInputRef}
                            tags={tags}
                        />
                        // (displayType === DisplayType.Grid ?
                        //     <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                        //     <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                        : <></>
                }
                <AboutThoriumButton />
            </LibraryLayout>
        );
    }

    private accessibilitySupportChanged = (_e: Electron.IpcRendererEvent, accessibilitySupportEnabled: boolean) => {
        console.log("ipcRenderer.on - accessibility-support-changed: ", accessibilitySupportEnabled);

        // prevents infinite loop via componentDidUpdate()
        if (accessibilitySupportEnabled !== this.state.accessibilitySupportEnabled) {
            this.setState({ accessibilitySupportEnabled });
        }
    };

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
        if (!this.focusInputRef?.current) {
            return;
        }
        this.focusInputRef.current.focus();
        // this.focusInputRef.current.select();
        this.focusInputRef.current.setSelectionRange(0, this.focusInputRef.current.value.length);
    };
}

// TODO: refresh strategy, see Catalog.tsx
// in render():
// if (this.props.refresh) {
//     this.props.api(CATALOG_GET_API_ID_CHANNEL)("catalog/get")();
//     this.props.api(PUBLICATION_TAGS_API_ID_CHANNEL)("publication/getAllTags")();
// }
// const mapStateToProps = (state: ILibraryRootState) => ({
//     catalog: apiState(state)(CATALOG_GET_API_ID_CHANNEL)("catalog/get"),
//     tags: apiState(state)(PUBLICATION_TAGS_API_ID_CHANNEL)("publication/getAllTags"),
//     refresh: apiRefreshToState(state)([
//         "publication/importFromFs",
//         "publication/importFromLink",
//         "publication/delete",
//         "publication/findAll",
//         // "catalog/addEntry",
//         "publication/updateTags",
//         // "reader/setLastReadingLocation",
//     ]),
//     location: state.router.location,
// });
// const mapDispatchToProps = (dispatch: Dispatch) => ({
//     api: apiDispatch(dispatch),
//     apiClean: apiClean(dispatch),
// });
//
// ... BUT here in this component we have (this misses "last read time stamp"?):
// this.unsubscribe = apiSubscribe([
//     "publication/importFromFs",
//     "publication/delete",
//     "publication/importFromLink",
//     // "catalog/addEntry",
//     "publication/updateTags",
// ], () => {
//     apiAction("publication/findAll")
//         .then((publicationViews) => {
//             this.setState({publicationViews});
//             setTimeout(() => {
//                 this.onKeyboardFocusSearch();
//             }, 400);
//         })
//         .catch((error) => console.error("Error to fetch api publication/findAll", error));
// });

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    keyboardShortcuts: state.keyboard.shortcuts,
    tags: state.publication.tag,
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

const commonCellStyles = (props: ITableCellProps_Column & ITableCellProps_GenericCell): React.CSSProperties => {
    return {
        // minHeight: props.displayType === DisplayType.Grid ? "150px" : "80px",
        maxHeight: props.displayType === DisplayType.Grid ? "150px" : "100px",

        // minWidth: props.displayType === DisplayType.Grid ? "150px" : "100px",
        // maxWidth: props.displayType === DisplayType.Grid ? "150px" : "50px",

        padding: "0.4em",
        textAlign: "left",
        userSelect: "text",
    };
};

interface ITableCellProps_GlobalFilter {
    __: I18nFunction;
    translator: Translator;
    displayType: DisplayType;

    preGlobalFilteredRows: Row<IColumns>[];
    globalFilteredRows: Row<IColumns>[];
    globalFilter: string;
    setGlobalFilter: (filterValue: string) => void;
    focusInputRef: React.RefObject<HTMLInputElement>;
    accessibilitySupportEnabled: boolean;
    setShowColumnFilters: (show: boolean) => void;
}
const CellGlobalFilter: React.FC<ITableCellProps_GlobalFilter> = (props) => {

    React.useEffect(() => {
        if (props.focusInputRef?.current &&
            props.focusInputRef.current.value !== props.globalFilter) {
            props.focusInputRef.current.value = props.globalFilter || "";
        }
    }, [props.focusInputRef, props.globalFilter]);
    // const [value, setValue] = React.useState(props.globalFilter);
    // const [, forceReRender] = React.useState(NaN);

    // https://github.com/TanStack/table/blob/7535f8fd51a2aa784949e32a68b9bb24c8a6c811/src/publicUtils.js#L163
    const onInputChange = useAsyncDebounce((v) => {

        // if (v) {}
        props.setShowColumnFilters(true);

        props.setGlobalFilter(v);
    }, 500);

    // className={classNames(classThemeExample)}
    // className={classNames(classStyleExample)}

    return (
        <div className={classNames(stylesInput.form_group, stylesInput.form_group_allPubSearch)}>
            <label
                id="globalSearchLabel"
                htmlFor="globalSearchInput"
                style={{ display: "flex", gap: "2px" }}>
                {`${props.__("header.searchPlaceholder")}`}
                <div
                    aria-live="assertive">
                    {props.globalFilteredRows.length !== props.preGlobalFilteredRows.length ? ` (${props.globalFilteredRows.length} / ${props.preGlobalFilteredRows.length})` : ` (${props.preGlobalFilteredRows.length})`}
                </div>
            </label>
            <i><SVG ariaHidden svg={SearchIcon} /></i>
            {/*
            value={value || ""}
            */}
            <input
                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                id="globalSearchInput"
                aria-labelledby="globalSearchLabel"
                ref={props.focusInputRef}
                type="search"

                onChange={(e) => {
                    // setValue(e.target.value);
                    if (!props.accessibilitySupportEnabled) {
                        onInputChange((e.target.value || "").trim() || undefined);
                    }
                }}
                onKeyUp={(e) => {
                    if (props.accessibilitySupportEnabled && e.key === "Enter") {
                        props.setShowColumnFilters(true);
                        props.setGlobalFilter( // value
                            (props.focusInputRef?.current?.value || "").trim() || undefined);
                    }
                }}
                placeholder={`${props.__("header.searchTitle")}`}
            />
            {props.accessibilitySupportEnabled ? <button
                onClick={() => {
                    props.setShowColumnFilters(true);
                    props.setGlobalFilter( // value
                        (props.focusInputRef?.current?.value || "").trim() || undefined);
                }}
            >{`${props.__("header.searchPlaceholder")}`}</button> : <></>}
        </div>
    );
};

interface ITableCellProps_Filter {
    __: I18nFunction;
    translator: Translator;
    displayType: DisplayType;

    showColumnFilters: boolean,
    accessibilitySupportEnabled: boolean,

    selectedTag: string,
    setSelectedTag: React.Dispatch<React.SetStateAction<string>>,
}
interface ITableCellProps_Column {
    column: ColumnWithLooseAccessor<IColumns> & UseFiltersColumnProps<IColumns>,
    // columnFilter: string,
    // {
    //     filterValue: string | undefined;
    //     preFilteredRows: string[];
    //     filteredRows: string[];
    //     setFilter: (str: string | undefined) => void;
    // };
}
const CellColumnFilter: React.FC<ITableCellProps_Filter & ITableCellProps_Column> = (props) => {

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

    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (inputRef?.current &&
            inputRef.current.value !== props.column.filterValue) {
            inputRef.current.value = props.column.filterValue || "";
        }
    }, [props.column.filterValue]);
    // const [value, setValue] = React.useState(props.column.filterValue); // props.columnFilter
    // console.log(props.column.id, props.column.filterValue, props.columnFilter, value);
    // const [, forceReRender] = React.useState(NaN);
    // if (props.column.filterValue !== value) {
    //     setValue(props.column.filterValue);
    //     return <></>;
    // }

    // https://github.com/TanStack/table/blob/7535f8fd51a2aa784949e32a68b9bb24c8a6c811/src/publicUtils.js#L163
    const onInputChange = useAsyncDebounce((v) => {
        props.column.setFilter(v);
    }, 500);

    const [searchParams] = useSearchParams();
    const searchParamsFocus = searchParams.get("focus");
    const searchParamsValue = searchParams.get("value");
    React.useEffect(() => {
        if (searchParamsFocus === "tags" && props.column.id === "colTags") {
            console.log("focus=tags");
            if (!inputRef.current) {
                console.log("NO REF!");
                return;

            }
            inputRef.current.focus();
            inputRef.current.value = decodeURIComponent(searchParamsValue || "");
            if (!props.accessibilitySupportEnabled) {
                onInputChange((inputRef.current.value || "").trim() || undefined);
            }
            if (props.accessibilitySupportEnabled) {
                // (e.target as EventTarget & HTMLInputElement).value
                // value
                props.column.setFilter( // props.column.filterValue
                    (inputRef?.current?.value || "").trim() || undefined);
            }
        }
    }, [props.column.id, props.accessibilitySupportEnabled, props.column, searchParamsFocus, searchParamsValue, onInputChange]);

    return props.showColumnFilters ?
        <div className={stylesPublication.showColFilters_wrapper}>
            {
                /*
            value={ // props.column.filterValue
                value || ""}
                 */
            }
            <input
                ref={inputRef}
                type="search"
                onChange={(e) => {
                    // setValue(e.target.value);
                    // forceReRender(NaN);
                    if (!props.accessibilitySupportEnabled) {
                        onInputChange((e.target.value || "").trim() || undefined);
                        if (props.column.id === "colTags") {
                            props.setSelectedTag(e.target.value.trim());
                        }
                    }
                }}
                onKeyUp={(e) => {
                    if (props.accessibilitySupportEnabled && e.key === "Enter") {
                        // (e.target as EventTarget & HTMLInputElement).value
                        // value
                        props.column.setFilter( // props.column.filterValue
                            (inputRef?.current?.value || "").trim() || undefined);
                        if (props.column.id === "colTags") {
                            props.setSelectedTag(inputRef?.current?.value.trim());
                            console.log(inputRef.current.value);
                        }
                    }
                }}
                aria-label={`${props.__("header.searchPlaceholder")} (${props.column.Header})`}
                placeholder={"" /* `${props.column.Header}` */}
                className={stylesPublication.showColFilters_input}
                style={{
                    width: props.accessibilitySupportEnabled ? "calc(100% - 30px)" : "100%",
                }}
            />
            {
                props.accessibilitySupportEnabled ? <button
                    aria-label={`${props.__("header.searchPlaceholder")}`}
                    onClick={() => {
                        // value
                        props.column.setFilter( // props.column.filterValue
                            (inputRef?.current?.value || "").trim() || undefined);
                    }}
                ><SVG ariaHidden svg={SearchIcon} /></button> : <></>
            }
        </div>
        : <></>;
};

interface ITableCellProps_GenericCell extends ITableCellProps_Common {
    setShowColumnFilters: (show: boolean, columnId: string, filterValue: string) => void;

    selectedTag: string,
    setSelectedTag: React.Dispatch<React.SetStateAction<string>>,
}

interface IColumnValue_Cover extends IColumnValue_BaseString {

    title: string,
    publicationViewIdentifier: string,
};
interface ITableCellProps_Value_Cover {
    value: IColumnValue_Cover;
}
const CellCoverImage: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Cover> = (props) => {
    return (<div className={stylesPublication.cell_coverImg}>
                <a
                    title={`${props.value.title} (${props.__("catalog.bookInfo")})`}
                    onClick={() => props.openReader(props.value.publicationViewIdentifier)}
                >
                    <img
                        src={
                            // NOTE! empty string doesn't work with `??` operator, must use ternary!
                            props.value.label
                                ?
                                props.value.label
                                :
                                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAGUUlEQVR4Xu3UAQ0AIAwDQfCvBx9zBAk2/uag16X7zNzlCBBICmwDkOxdaAJfwAB4BAJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJPOMbVS78Q2ATAAAAAElFTkSuQmCC"
                        }
                        alt={""}
                        role="presentation" />
                </a>
    </div>);
};

const CellFormat: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_StringValue> = (props) => {

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
            }}
            className={stylesButtons.button_nav_primary} style={{ padding: "2px" }}>{t}</a>;
    };

    return (<div className={stylesPublication.cell_wrapper}>
        {
            link(props.value)
        }
    </div>);
};

interface IColumnValue_Langs extends IColumnValue_BaseString {
    langs: string[],
};
interface ITableCellProps_Value_Langs {
    value: IColumnValue_Langs;
}
const CellLangs: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Langs> = (props) => {

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
            }}
            className={stylesPublication.cell_link}>{t}</a>;
    };

    // props.value.label === props.value.tags.join(", ")

    return props.value.langs?.length ?
        (
            props.value.langs.length === 1 ? (
                <div className={stylesPublication.cell_wrapper}>
                    {
                        link(props.value.langs[0])
                    }
                </div>
            ) : (
                <ul className={classNames(stylesPublication.cell_wrapper, stylesPublication.cell_multi_langs)}>
                    {
                        props.value.langs.map((t, i) => {
                            return <li
                                key={`k${i}`}
                            >{link(t)}</li>;
                        })
                    }
                </ul>
            ))
        : <></>;
};

interface IColumnValue_Publishers extends IColumnValue_BaseString {
    publishers: string[],
};
interface ITableCellProps_Value_Publishers {
    value: IColumnValue_Publishers;
}
const CellPublishers: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Publishers> = (props) => {

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
            }}
            className={stylesPublication.cell_link}>{t}</a>;
    };

    // props.value.label === props.value.tags.join(", ")

    return props.value.publishers?.length ?
        (
            props.value.publishers.length === 1 ? (
                <div className={stylesPublication.cell_wrapper}>
                    {
                        link(props.value.publishers[0])
                    }
                </div>
            ) : (
                <ul className={classNames(stylesPublication.cell_wrapper, stylesPublication.cell_multi_langs)}>
                    {
                        props.value.publishers.map((t, i) => {
                            return <li
                                key={`k${i}`}
                            >{link(t)}</li>;
                        })
                    }
                </ul>
            ))
        : <></>;
};

interface IColumnValue_Authors extends IColumnValue_BaseString {
    authors: string[],
};
interface ITableCellProps_Value_Authors {
    value: IColumnValue_Authors;
}
const CellAuthors: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Authors> = (props) => {

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
            }}
            className={stylesPublication.cell_link}>{t}</a>;
    };

    // props.value.label === props.value.tags.join(", ")

    return props.value.authors?.length ?
        (
            <div style={{
                ...commonCellStyles(props),
                // minWidth: props.displayType === DisplayType.Grid ? "200px" : undefined,
                // maxWidth: props.displayType === DisplayType.Grid ? "300px" : undefined,
                // width: props.displayType === DisplayType.Grid ? "250px" : undefined,
            }}>
                {
                    props.value.authors.length === 1 ? (
                        <div className={stylesPublication.cell_wrapper}>
                            {
                                link(props.value.authors[0])
                            }
                        </div>
                    ) : (
                        <ul className={classNames(stylesPublication.cell_wrapper, stylesPublication.cell_multi_langs)}>
                            {
                                props.value.authors.map((t, i) => {
                                    return <li
                                        key={`k${i}`}
                                    >{link(t)}</li>;
                                })
                            }
                        </ul>
                    )
                }
            </div>
        )
        : <></>;
};

interface IColumnValue_Tags extends IColumnValue_BaseString {
    tags: string[],
};
interface ITableCellProps_Value_Tags {
    value: IColumnValue_Tags;
}
const CellTags: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Tags> = (props) => {

    // TagSearchResult.tsx
    // publication.ts findByTag()

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                    props.setSelectedTag(t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
                props.setSelectedTag(t);
            }}
            className={stylesButtons.button_nav_primary} style={{ padding: "2px" }}>
            <p style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", textWrap: "nowrap" }}>{t}</p>
        </a>;
    };

    // props.value.label === props.value.tags.join(", ")

    return props.value.tags?.length ?
        (
            props.value.tags.length === 1 ? (
                <div className={stylesPublication.cell_wrapper}>
                    {
                        link(props.value.tags[0])
                    }
                </div>
            ) : (
                <ul className={classNames(stylesPublication.cell_wrapper, stylesPublication.cell_multi_langs)}>
                    {
                        props.value.tags.map((t, i) => {
                            return <li
                                key={`k${i}`}
                            >{link(t)}</li>;
                        })
                    }
                </ul>
            ))
        : <></>;
};

const CellDescription: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_StringValue> = (props) => {

    const textNeedToBeSanitized = props.value || "";
    const textSanitize = DOMPurify.sanitize(textNeedToBeSanitized).replace(/font-size:/g, "font-sizexx:");
    const [isOpen, setIsOpen] = React.useState(false);

    return (<div
        className={stylesPublication.cell_description}
        style={{
            ...commonCellStyles(props),
            paddingBottom: "0",
            // marginBottom: "0.4em",

            // minHeight: props.displayType === DisplayType.Grid ? "150px" : "80px",
            // maxHeight: props.displayType === DisplayType.Grid ? "150px" : "100px",

            // minWidth: props.displayType === DisplayType.Grid ? "150px" : "100px",
            // maxWidth: props.displayType === DisplayType.Grid ? "150px" : "50px",

            // textAlign: props.displayType === DisplayType.Grid ? "justify" : "start",
            textAlign: "start",
        }}>
        <p dangerouslySetInnerHTML={{ __html: textSanitize }}></p>
        {props.value ?
            <Popover.Root onOpenChange={() => setIsOpen(!isOpen)}>
                <Popover.Trigger style={{maxWidth: "15px"}}>
                    {isOpen ?
                    <SVG ariaHidden svg={CloseIcon} />
                    :
                    <SVG ariaHidden svg={ChevronDown} />
                    }
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content collisionPadding={{top : 280}} avoidCollisions sideOffset={5} align="end" alignOffset={-10} hideWhenDetached>
                        <p className={stylesDropDown.dropdown_description} dangerouslySetInnerHTML={{ __html: textSanitize }}></p>
                        <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
            : ""}
    </div>);
};

// interface IColumnValue_A11y_StringArrayArray extends IColumnValue_BaseString {

//     strings: (string[])[],
// };
// interface ITableCellProps_Value_StringArrayArray {
//     value: IColumnValue_A11y_StringArrayArray;
// }
// const CellStringArrayArray: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_StringArrayArray> = (props) => {

//     const link = (tt: string[]) => {
//         const t = tt.join(",");
//         return <a
//             title={`${t} (${props.__("header.searchPlaceholder")})`}
//             tabIndex={0}
//             onKeyUp={(e) => { if (e.key === "Enter") {
//                 e.preventDefault();
//                 props.column.setFilter(t);
//                 props.setShowColumnFilters(true);
//             }}}

//             onClick={(e) => {
//                 e.preventDefault();
//                 props.column.setFilter(t);
//                 props.setShowColumnFilters(true);
//             }}
//             style={{
//                 display: "flex",
//                 alignItems: "center",
//                 textAlign: "center",
//                 padding: "2px 6px",
//                 fontSize: "1rem",
//                 // backgroundColor: "#e7f1fb",
//                 // borderRadius: "5px",
//                 // border: "1px solid var(--color-tertiary)",
//                 // color: "var(--color-tertiary)",
//                 cursor: "pointer",
//                 // textDecoration: "none",
//                 textDecoration: "underline",
//                 textDecorationColor: "var(--color-tertiary)",
//                 textDecorationSkip: "ink",
//                 marginRight: "6px",
//                 marginBottom: "6px",
//         }}>{t}</a>;
//     };

//     // props.value.label === props.value.tags.join(", ")

//     const flexStyle: React.CSSProperties = {
//         display: "flex",
//         flexDirection: "row",
//         alignItems: "flex-start",
//         justifyContent: "center",
//         flexWrap: "wrap",
//         paddingTop: "0.2em",
//     };

//     return props.value.strings?.length ?
//     (
//     props.value.strings.length === 1 ? (
//         <div style={{...flexStyle}}>
//         {
//         link(props.value.strings[0])
//         }
//         </div>
//     ) : (
//         <ul style={{
//             listStyleType: "none",
//             margin: "0",
//             padding: "0",
//             ...flexStyle,
//         }}>
//         {
//         props.value.strings.map((t, i) => {
//             return <li
//                 key={`k${i}`}
//                 style={{
//                     display: "flex",
//                     alignItems: "center",
//                     margin: "0",
//                     padding: "0",
//                 }}
//             >{link(t)}</li>;
//         })
//         }
//         </ul>
//     ))
//     : <></>;
// };

// interface IColumnValue_A11y_StringArray extends IColumnValue_BaseString {

//     strings: string[],
// };
// interface ITableCellProps_Value_StringArray {
//     value: IColumnValue_A11y_StringArray;
// }
// const CellStringArray: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_StringArray> = (props) => {

//     const link = (t: string) => {
//         return <a
//             title={`${t} (${props.__("header.searchPlaceholder")})`}
//             tabIndex={0}
//             onKeyUp={(e) => { if (e.key === "Enter") {
//                 e.preventDefault();
//                 props.column.setFilter(t);
//                 props.setShowColumnFilters(true);
//             }}}

//             onClick={(e) => {
//                 e.preventDefault();
//                 props.column.setFilter(t);
//                 props.setShowColumnFilters(true);
//             }}
//             style={{
//                 display: "flex",
//                 alignItems: "center",
//                 textAlign: "center",
//                 padding: "2px 6px",
//                 fontSize: "1rem",
//                 // backgroundColor: "#e7f1fb",
//                 // borderRadius: "5px",
//                 // border: "1px solid var(--color-tertiary)",
//                 // color: "var(--color-tertiary)",
//                 cursor: "pointer",
//                 // textDecoration: "none",
//                 textDecoration: "underline",
//                 textDecorationColor: "var(--color-tertiary)",
//                 textDecorationSkip: "ink",
//                 marginRight: "6px",
//                 marginBottom: "6px",
//         }}>{t}</a>;
//     };

//     // props.value.label === props.value.tags.join(", ")

//     const flexStyle: React.CSSProperties = {
//         display: "flex",
//         flexDirection: "row",
//         alignItems: "flex-start",
//         justifyContent: "center",
//         flexWrap: "wrap",
//         paddingTop: "0.2em",
//     };

//     return props.value.strings?.length ?
//     (
//     props.value.strings.length === 1 ? (
//         <div style={{...flexStyle}}>
//         {
//         link(props.value.strings[0])
//         }
//         </div>
//     ) : (
//         <ul style={{
//             listStyleType: "none",
//             margin: "0",
//             padding: "0",
//             ...flexStyle,
//         }}>
//         {
//         props.value.strings.map((t, i) => {
//             return <li
//                 key={`k${i}`}
//                 style={{
//                     display: "flex",
//                     alignItems: "center",
//                     margin: "0",
//                     padding: "0",
//                 }}
//             >{link(t)}</li>;
//         })
//         }
//         </ul>
//     ))
//     : <></>;
// };

interface IColumnValue_Date extends IColumnValue_BaseString {

    date: string,
};
interface ITableCellProps_Value_Date {
    value: IColumnValue_Date;
}
const CellDate: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Date> = (props) => {
    return (
        props.value.label ?
            <div style={{
                ...commonCellStyles(props),
            }}
            >
                <a
                    title={`${props.value.label} (${props.__("header.searchPlaceholder")})`}
                    tabIndex={0}
                    onKeyUp={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            const t = props.value.label.substring(0, props.column.id === "colLastReadTimestamp" ? 7 : 4); // YYYY or YYYY-MM
                            // props.column.setFilter(t);
                            props.setShowColumnFilters(true, props.column.id, t);
                        }
                    }}

                    onClick={(e) => {
                        e.preventDefault();
                        const t = props.value.label.substring(0, props.column.id === "colLastReadTimestamp" ? 7 : 4); // YYYY or YYYY-MM
                        // props.column.setFilter(t);
                        props.setShowColumnFilters(true, props.column.id, t);
                    }}
                    className={stylesPublication.cell_link}>{props.value.date}</a>
            </div>
            : <></>
    );
};

interface IColumnValue_Title extends IColumnValue_BaseString {

    pubTitle: string | IStringMap,
    publicationViewIdentifier: string,
};
interface ITableCellProps_Value_Title {
    value: IColumnValue_Title;
}

interface ITableCellProps_Value_Remaining {
    value: IColumnValue_Remain;
}

interface ITableCellProps_Value_Actions {
    value: IColumnValue_Actions;
}

const CellTitle: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Title> = (props) => {

    // props.value.label
    const pubTitleLangStr = convertMultiLangStringToString(props.translator, props.value.pubTitle);
    const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
    const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
    const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

    return (<div style={{
        ...commonCellStyles(props),
        // minWidth: props.displayType === DisplayType.Grid ? "200px" : undefined,
        // maxWidth: props.displayType === DisplayType.Grid ? "300px" : undefined,
        // width: props.displayType === DisplayType.Grid ? "250px" : undefined,
    }}
        dir={pubTitleIsRTL ? "rtl" : undefined}
    >
                <a
                    tabIndex={0}
                    className={stylesPublication.cell_bookTitle}
                    onClick={() => props.openReader(props.value.publicationViewIdentifier)}
                    onKeyUp={(e) => {
                        // ALTERNATIVE IMPLEMENTATION:
                        // href="" ==> automatically sets up ENTER key and keyboard tab, but also requires preventDefault inside onClick (otherwise user can hit the options/alt key to download the href current location!), and introduces hyperlink visited style so CSS must account for this!
                        if (e.key === "Enter") {
                            props.openReader(props.value.publicationViewIdentifier);
                        }
                    }}
                >
                    {pubTitleStr}
                </a>
    </div>);
};

const CellRemainingDays: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Remaining> = (props) => {

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
            }}>{t}</a>;
    };

    return (<div className={stylesPublication.cell_wrapper}>
         {
            props.value.label ?
            <div className={stylesPublications.lcpIndicator}>
                <SVG ariaHidden svg={props.value.hasEnded ? KeyIcon : CalendarIcon} />
                {link(props.value.label)}
            </div>
            : props.value.isLcp ?
            <div className={stylesPublications.lcpIndicator}>
                <SVG ariaHidden svg={KeyIcon} />
                {props.__("publication.licensed")}
            </div>
            : <></>}
    </div>);
};

const CellReadingState: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Remaining> = (props) => {

    const link = (t: string) => {
        return <a
            title={`${t} (${props.__("header.searchPlaceholder")})`}
            tabIndex={0}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    // props.column.setFilter(t);
                    props.setShowColumnFilters(true, props.column.id, t);
                }
            }}

            onClick={(e) => {
                e.preventDefault();
                // props.column.setFilter(t);
                props.setShowColumnFilters(true, props.column.id, t);
            }}>{t}</a>;
    };

    return (<div className={stylesPublication.cell_wrapper}>
         {
            props.value.label ?
            <div className={stylesPublications.lcpIndicator}>
                {props.value.label === props.__("publication.read") ?
                <SVG ariaHidden svg={ValidatedIcon} />
                :
                <SVG ariaHidden svg={OnGoingBookIcon} />
                }

                {link(props.value.label)}
            </div>
            : <></>}
    </div>);
};


const CellActions: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_Value_Actions> = (props) => {
    const label = props.value.label;
    const publication = props.value.publication;

    return (
        <div className={stylesPublication.cell_wrapper}
        >
            <Menu
                button={(
                    <SVG title={`${props.__("publication.actions")} (${label})`} svg={MenuIcon} />
                )}
            >
                <CatalogMenu
                    publicationView={publication as PublicationView}
                />
            </Menu>
        </div>

    );
};

const TableCell: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_StringValue> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
    }}>
        {props.value}
    </div>);
};

interface IColumnValue_BaseString {
    label: string,
};

interface ITableCellProps_StringValue {
    value: string;
}

interface IColumnValue_Remain {
    label: string;
    hasEnded: boolean;
    isLcp: boolean;
}

interface IColumnValue_Actions {
    isReading: boolean;
    label: string;
    publication: PublicationView | IOpdsPublicationView;
}

interface IColumns {
    colCover: IColumnValue_Cover,
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

    col_a11y_accessibilitySummary: string; // string | IStringMap => convertMultiLangStringToString()
    // col_a11y_accessMode: IColumnValue_A11y_StringArray; // string[]
    // col_a11y_accessModeSufficient: IColumnValue_A11y_StringArrayArray; // (string[])[]
    // col_a11y_accessibilityFeature: IColumnValue_A11y_StringArray; // string[]
    // col_a11y_accessibilityHazard: IColumnValue_A11y_StringArray; // string[]
    // col_a11y_certifiedBy: IColumnValue_A11y_StringArray; // string[]
    // col_a11y_certifierCredential: IColumnValue_A11y_StringArray; // string[]
    // col_a11y_certifierReport: IColumnValue_A11y_StringArray; // string[]
    // col_a11y_conformsTo: IColumnValue_A11y_StringArray; // string[]

    // colIdentifier: string;
    // colPublicationType: string;
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

interface ITableCellProps_Common {
    __: I18nFunction;
    translator: Translator;
    displayType: DisplayType;

    displayPublicationInfo: ReturnType<typeof mapDispatchToProps>["displayPublicationInfo"];
    openReader: ReturnType<typeof mapDispatchToProps>["openReader"];
}
interface ITableCellProps_TableView {
    publicationViews: PublicationView[];
    focusInputRef: React.RefObject<HTMLInputElement>;
    location: Location;
    accessibilitySupportEnabled: boolean;
    tags: string[];
}

export const TableView: React.FC<ITableCellProps_TableView & ITableCellProps_Common> = (props) => {

    const [showColumnFilters, setShowColumnFilters] = React.useState(false);
    const [selectedTag, setSelectedTag] = React.useState("");

    const scrollToViewRef = React.useRef(null);

    const { openReader, displayPublicationInfo, displayType, __, focusInputRef, translator, publicationViews, accessibilitySupportEnabled, tags } = props;

    const renderProps_Filter: ITableCellProps_Filter =
    {
        __,
        translator,
        displayType,

        showColumnFilters,
        accessibilitySupportEnabled,

        selectedTag,
        setSelectedTag,
    };

    const renderProps_Cell: ITableCellProps_GenericCell =
    {
        __,
        translator,
        displayType,

        selectedTag,
        setSelectedTag,

        displayPublicationInfo,
        openReader,

        setShowColumnFilters: (show: boolean, columnId: string, filterValue: string) => {
            setShowColumnFilters(show);

            setTimeout(() => {
                tableInstance.setFilter(columnId, filterValue);
            }, 200);

            if (scrollToViewRef?.current) {
                scrollToViewRef.current.scrollIntoView();
            }
        },
    };

    // const locale = translator.getLocale();
    // // https://momentjs.com/docs/#/displaying/
    // moment.locale(locale);

    const tableRows = React.useMemo(() => {
        return publicationViews.slice().reverse().map((publicationView) => {

            // translator.translateContentField(author)
            // const authors = publicationView.authors ? formatContributorToString(publicationView.authors, translator) : "";
            // const publishers = publicationView.publishers ? formatContributorToString(publicationView.publishers, translator) : "";

            // publicationView.publishedAt = r2Publication.metadata.PublicationDate && moment(metadata.PublicationDate).toISOString();
            const momPublishedDate_ = publicationView.publishedAt ? moment(publicationView.publishedAt) : undefined;
            const momPublishedDate = momPublishedDate_ && momPublishedDate_.isValid() ? momPublishedDate_.utc() : undefined;
            const MM = momPublishedDate ? (momPublishedDate.month() || 0) + 1 : undefined; // ZERO-based!
            const DD = momPublishedDate ? momPublishedDate.date() || 1 : undefined; // ONE-based!
            const publishedDateCanonical = momPublishedDate ? `${momPublishedDate.year().toString().padStart(4, "0")}-${(MM).toString().padStart(2, "0")}-${(DD).toString().padStart(2, "0")}T${(momPublishedDate.hour() || 0).toString().padStart(2, "0")}:${(momPublishedDate.minute() || 0).toString().padStart(2, "0")}:${(momPublishedDate.second() || 0).toString().padStart(2, "0")}Z` : ""; // .toISOString()
            let publishedDateVisual = publishedDateCanonical;
            if (publishedDateCanonical) {
                try {
                    publishedDateVisual = new Intl.DateTimeFormat(translator.getLocale(), { dateStyle: "medium", timeStyle: undefined }).format(new Date(publishedDateCanonical));
                } catch (err) {
                    console.log(err);
                }
            }

            const momLastRead_ = publicationView.lastReadTimeStamp ? moment(publicationView.lastReadTimeStamp) : undefined;
            const momLastRead = momLastRead_ && momLastRead_.isValid() ? momLastRead_.utc() : undefined;
            const M = momLastRead ? (momLastRead.month() || 0) + 1 : undefined; // ZERO-based!
            const D = momLastRead ? momLastRead.date() || 1 : undefined; // ONE-based!
            const lastReadDateCanonical = momLastRead ? `${momLastRead.year().toString().padStart(4, "0")}-${(M).toString().padStart(2, "0")}-${(D).toString().padStart(2, "0")}T${(momLastRead.hour() || 0).toString().padStart(2, "0")}:${(momLastRead.minute() || 0).toString().padStart(2, "0")}:${(momLastRead.second() || 0).toString().padStart(2, "0")}Z` : ""; // .toISOString()
            let lastReadDateVisual = lastReadDateCanonical;
            if (lastReadDateCanonical) {
                try {
                    lastReadDateVisual = new Intl.DateTimeFormat(translator.getLocale(), { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastReadDateCanonical));
                } catch (err) {
                    console.log(err);
                }
            }

            const isLcp = !!publicationView.lcp?.rights;
            const lcpRightsEndDate = (publicationView.lcp?.rights?.end) ? publicationView.lcp.rights.end : undefined;
            let remainingDays= "";
            const now = moment();
            let hasEnded = false;

            if (lcpRightsEndDate) {
                const momentEnd = moment(lcpRightsEndDate);
                const timeEndDif = momentEnd.diff(now, "days");
                if (timeEndDif > 1) {
                    remainingDays = `${timeEndDif} ${__("publication.days")}`;
                } else if (timeEndDif === 1) {
                    remainingDays = `${timeEndDif} ${__("publication.day")}`;
                } else {
                    // const nowUTC = (new Date()).toISOString();
                    // const momentNow = moment(nowUTC);
                    if (now.isAfter(momentEnd)) {
                        remainingDays = `${__("publication.expired")}`;
                        hasEnded = true;
                    } else {
                        // remainingDays = `${__("publication.licensed")}`;
                        remainingDays = `${formatTime(momentEnd.diff(now, "seconds"))}`;
                    }
                }
            }

            const langsArray = publicationView.languages ? publicationView.languages.map((lang) => {

                // See FormatPublicationLanguage

                // Note: "pt-PT" in the i18next ResourceBundle is not captured because key match reduced to "pt"
                // Also: pt-pt vs. pt-PT case sensitivity
                // Also zh-CN (mandarin chinese)
                const l = lang.split("-")[0] as keyof typeof AvailableLanguages;
                const ll = AvailableLanguages[l] || lang;

                const note = (lang !== ll) ? ` (${lang})` : "";

                return ll + note;
            }) : undefined;

            const description = publicationView.description ? DOMPurify.sanitize(publicationView.description).replace(/font-size:/g, "font-sizexx:") : "";

            const lcp = publicationView.lcp ? "LCP" : "";

            const format = publicationView.isAudio ? "Audio" : publicationView.isDivina ? "Divina" : publicationView.isPDF ? "PDF" : publicationView.isDaisy ? "DAISY" : publicationView.isFixedLayoutPublication ? "EPUB (FXL)" : "EPUB";

            const duration = (publicationView.duration ? formatTime(publicationView.duration) : "") + (publicationView.nbOfTracks ? ` (${__("publication.audio.tracks")}: ${publicationView.nbOfTracks})` : "");

            // const identifier = publicationView.workIdentifier ? publicationView.workIdentifier : "";
            // const publicationType = publicationView.RDFType ? publicationView.RDFType : "";

            let strA11Summary = "";
            if (publicationView.a11y_accessibilitySummary) {

                const langStr = convertMultiLangStringToString(translator, publicationView.a11y_accessibilitySummary);

                if (langStr && langStr[1]) {
                    strA11Summary = DOMPurify.sanitize(langStr[1]).replace(/font-size:/g, "font-sizexx:");
                }
            }

            // r2PublicationJson: JsonMap;
            // lastReadingLocation?: LocatorExtended;
            const cols: IColumns = {
                colCover: { // IColumnValue_Cover
                    label: publicationView.cover?.thumbnailUrl ?? publicationView.cover?.coverUrl ?? "",
                    publicationViewIdentifier: publicationView.identifier,
                    title: publicationView.documentTitle,
                },
                colTitle: { // IColumnValue_Title
                    label: publicationView.documentTitle,
                    publicationViewIdentifier: publicationView.identifier,
                    pubTitle: publicationView.publicationTitle,
                },
                colAuthors: { // IColumnValue_Authors
                    label: publicationView.authors ? publicationView.authors.join(", ") : "",
                    authors: publicationView.authors,
                },
                colReadingState: { // IColumnValue_Authors
                    label: publicationView.readingFinished ? `${__("publication.read")}` : publicationView.lastReadingLocation ? `${__("publication.onGoing")}` : `${__("publication.notStarted")}`,
                },
                colRemainingDays: { // IColumnValue_Remain
                    label: remainingDays,
                    hasEnded: hasEnded,
                    isLcp: isLcp,
                },
                colPublishers: { // IColumnValue_Publishers
                    label: publicationView.publishers ? publicationView.publishers.join(", ") : "",
                    publishers: publicationView.publishers,
                },
                colLanguages: { // IColumnValue_Tags
                    label: langsArray ? langsArray.join(", ") : "",
                    langs: langsArray,
                },
                colPublishedDate: { // IColumnValue_Date
                    label: publishedDateCanonical,
                    date: publishedDateVisual,
                },
                colLCP: lcp,
                colFormat: format,
                colLastReadTimestamp: { // IColumnValue_Date
                    label: lastReadDateCanonical,
                    date: lastReadDateVisual,
                },
                colTags: { // IColumnValue_Tags
                    label: publicationView.tags ? publicationView.tags.join(", ") : "",
                    tags: publicationView.tags,
                },
                colDuration: duration,
                colDescription: description,

                col_a11y_accessibilitySummary: strA11Summary,
                colActions: { // IColumnValue_Actions
                    isReading: publicationView.lastReadingLocation ? true : false,
                    label: publicationView.documentTitle,
                    publication: publicationView,
                },
                // col_a11y_accessMode: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_accessMode?.length ? [].concat(publicationView.a11y_accessMode).sort().join(", ") : "",
                //     strings: publicationView.a11y_accessMode,
                // },
                // col_a11y_accessModeSufficient: { // IColumnValue_A11y_StringArrayArray
                //     label: publicationView.a11y_accessModeSufficient?.length ?
                //         publicationView.a11y_accessModeSufficient.reduce((acc, cur) => {
                //             return `${acc}${acc.length ? " / " : ""}${cur.join(",")}`;
                //         }, "") :
                //         "",
                //     strings: publicationView.a11y_accessModeSufficient,
                // },
                // col_a11y_accessibilityFeature: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_accessibilityFeature?.length ? [].concat(publicationView.a11y_accessibilityFeature).sort().join(", ") : "",
                //     strings: publicationView.a11y_accessibilityFeature,
                // },
                // col_a11y_accessibilityHazard: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_accessibilityHazard?.length ? [].concat(publicationView.a11y_accessibilityHazard).sort().join(", ") : "",
                //     strings: publicationView.a11y_accessibilityHazard,
                // },
                // col_a11y_certifiedBy: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_certifiedBy?.length ? [].concat(publicationView.a11y_certifiedBy).sort().join(", ") : "",
                //     strings: publicationView.a11y_certifiedBy,
                // },
                // col_a11y_certifierCredential: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_certifierCredential?.length ? [].concat(publicationView.a11y_certifierCredential).sort().join(", ") : "",
                //     strings: publicationView.a11y_certifierCredential,
                // },
                // col_a11y_certifierReport: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_certifierReport?.length ? [].concat(publicationView.a11y_certifierReport).sort().join(", ") : "",
                //     strings: publicationView.a11y_certifierReport,
                // },
                // col_a11y_conformsTo: { // IColumnValue_A11y_StringArray
                //     label: publicationView.a11y_conformsTo?.length ? [].concat(publicationView.a11y_conformsTo).sort().join(", ") : "",
                //     strings: publicationView.a11y_conformsTo,
                // },

                // colProgression: "Progression",
                // colIdentifier: identifier,
                // colPublicationType: publicationType,
            };
            return cols;
        });
    }, [translator, publicationViews, __]);

    const sortFunction = (rowA: Row<IColumns>, rowB: Row<IColumns>, columnId: IdType<IColumns>, desc?: boolean) => {
        let res = 0;

        let v1: string = rowA.values[columnId];
        if (typeof v1 !== "string") {
            v1 = (v1 as IColumnValue_BaseString).label;
        }

        let v2: string = rowB.values[columnId];
        if (typeof v2 !== "string") {
            v2 = (v2 as IColumnValue_BaseString).label;
        }

        if (!v1) {
            res = desc ? -1 : 1;
        } else {
            if (!v2) {
                res = desc ? 1 : -1;
            } else {
                if (v1 === v2) {
                    res = 0;
                } else {
                    res = v1 < v2 ? -1 : 1;
                }
            }
        }

        return res;
        // return desc ? res : (-1 * res);
    };

    const tableColumns = React.useMemo(() => {
        const arr: (Column<IColumns> &
            UseTableColumnOptions<IColumns> &
            UseSortByColumnOptions<IColumns> &
            UseGlobalFiltersColumnOptions<IColumns> &
            UseFiltersColumnOptions<IColumns>)[] = [
                {
                    Header: __("publication.cover.img"),
                    accessor: "colCover",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellCoverImage,
                    // filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("publication.title"),
                    accessor: "colTitle",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellTitle,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("publication.author"),
                    accessor: "colAuthors",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellAuthors,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("publication.progression.title"),
                    accessor: "colReadingState",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellReadingState,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("publication.remainingTime"),
                    accessor: "colRemainingDays",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellRemainingDays,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.lang"),
                    accessor: "colLanguages",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellLangs,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.tags"),
                    accessor: "colTags",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellTags,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.format"),
                    accessor: "colFormat",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellFormat,
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.lastRead"),
                    accessor: "colLastReadTimestamp",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellDate,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.publisher"),
                    accessor: "colPublishers",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellPublishers,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.released"),
                    accessor: "colPublishedDate",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellDate,
                    filter: "text", // because IColumnValue_BaseString instead of plain string
                    sortType: sortFunction,
                },
                {
                    Header: "DRM",
                    accessor: "colLCP",
                    sortType: sortFunction,
                },
                {
                    Header: __("publication.duration.title"),
                    accessor: "colDuration",
                    sortType: sortFunction,
                },
                {
                    Header: __("catalog.description"),
                    accessor: "colDescription",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellDescription,
                    sortType: sortFunction,
                },

                {
                    Header: __("publication.accessibility.name"),
                    accessor: "col_a11y_accessibilitySummary",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellDescription,
                    sortType: sortFunction,
                },
                {
                    Header: __("publication.actions"),
                    accessor: "colActions",
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    Cell: CellActions,
                    disableFilters: true,
                    disableSortBy: true,
                },
                // {
                //     Header: "accessMode",
                //     accessor: "col_a11y_accessMode",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "accessModeSufficient",
                //     accessor: "col_a11y_accessModeSufficient",
                //     Cell: CellStringArrayArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "accessibilityFeature",
                //     accessor: "col_a11y_accessibilityFeature",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "accessibilityHazard",
                //     accessor: "col_a11y_accessibilityHazard",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "certifiedBy",
                //     accessor: "col_a11y_certifiedBy",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "certifierCredential",
                //     accessor: "col_a11y_certifierCredential",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "certifierReport",
                //     accessor: "col_a11y_certifierReport",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },
                // {
                //     Header: "conformsTo",
                //     accessor: "col_a11y_conformsTo",
                //     Cell: CellStringArray,
                //     filter: "text", // because IColumnValue_BaseString instead of plain string
                //     sortType: sortFunction,
                // },

                // {
                //     Header: __("publication.progression.title"),
                //     accessor: "colProgression",
                // sortType: sortFunction,
                // },
                // {
                //     Header: "Identifier",
                //     accessor: "colIdentifier",
                // sortType: sortFunction,
                // },
                // {
                //     Header: "Type",
                //     accessor: "colPublicationType",
                // sortType: sortFunction,
                // },
            ];
        return arr;
    }, [__]);

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
            const res = matchSorter<Row<IColumns>>(rows, filterValue, {
                keys: [(row) => {
                    let rowValue = row.values[columnId];
                    if (typeof rowValue !== "string") {
                        rowValue = (rowValue as IColumnValue_BaseString).label;
                    }
                    return rowValue;
                }],
                // https://github.com/kentcdodds/match-sorter#threshold-number
                threshold: matchSorter.rankings.CONTAINS,
            });
            // console.log(`filterTypes.text ======= ${rows.length} ${columnId} ${typeof filterValue} ${res.length}`);
            return res;
        },
    }),
        []);

    // for (const col of tableInstance.allColumns) {
    //     tableInstance.setFilter(col.id, "");
    // }toggleHidden

    // infinite render loop
    // tableInstance.setPageSize(pageSize);

    const PAGESIZE = 50;

    const initialState: UsePaginationState<IColumns> & TableState<IColumns> = {
        pageSize: PAGESIZE, // displayType === DisplayType.List ? 20 : 10;
        pageIndex: 0,
        hiddenColumns: displayType === DisplayType.Grid ? ["colLanguages", "colPublishers", "colPublishedDate", "colLCP", "colDuration", "colDescription", "col_a11y_accessibilitySummary"] : [],
    };
    const opts:
        TableOptions<IColumns> &
        UseFiltersOptions<IColumns> &
        UseGlobalFiltersOptions<IColumns> &
        UseSortByOptions<IColumns> &
        UsePaginationOptions<IColumns> = {

        columns: tableColumns,
        data: tableRows,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        defaultColumn,
        globalFilter: "globalFilter",
        filterTypes: filterTypes as unknown as FilterTypes<IColumns>, // because typing 'columnIds' instead of 'columnId' in FilterType<D> ?!
        initialState: initialState as TableState<IColumns>, // again, typing woes :(
    };
    const tableInstance =
        useTable<IColumns>(opts, useFilters, useGlobalFilter, useSortBy, usePagination) as MyTableInstance<IColumns>;

    React.useEffect(() => {

        const cb = () => {
            if (displayType === DisplayType.Grid) {
                const body = document.getElementById("publicationsTableBody") as HTMLTableSectionElement;
                const bodyWidth = body?.offsetWidth;
                if (!bodyWidth) {
                    return;
                }

                const coverWidth = 205;
                const col = Math.floor(bodyWidth/coverWidth);
                const nbItemMissing = col - PAGESIZE%col;

                tableInstance.setPageSize(PAGESIZE+nbItemMissing);
            } else {
                tableInstance.setPageSize(PAGESIZE);
            }
        };
        cb();

        const cdDebounce = debounce(cb, 500);

        window.addEventListener("resize", cdDebounce);

        return () => {
            window.removeEventListener("resize", cdDebounce);
        };
    }, [tableInstance, displayType]);

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
    // {__("reader.navigation.goTo")}
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

    const SelectRef = React.forwardRef<HTMLButtonElement, MySelectProps<{ id: number, value: number, name: string }>>((props, forwardedRef) =>
        <Select refButEl={forwardedRef} {...props}></Select>);
    SelectRef.displayName = "ComboBox";

    const tagsOptions = tags.map((v, i) => ({ id: i, value: i, name: v }));

    return (
        <>
            <div>
                <h2 className={stylesPublication.allBooks_header}>{__("catalog.allBooks")}</h2>
                <div className={stylesPublication.allBooks_header_navigation}>
                    <div className={stylesPublication.allBooks_header_navigation_inputs}>
                        <CellGlobalFilter
                            accessibilitySupportEnabled={accessibilitySupportEnabled}
                            preGlobalFilteredRows={tableInstance.preGlobalFilteredRows}
                            globalFilteredRows={tableInstance.globalFilteredRows}
                            globalFilter={tableInstance.state.globalFilter}
                            setGlobalFilter={tableInstance.setGlobalFilter}
                            __={__}
                            translator={translator}
                            displayType={displayType}
                            focusInputRef={focusInputRef}

                            setShowColumnFilters={(show: boolean) => {
                                const currentShow = showColumnFilters;
                                setShowColumnFilters(show);
                                setTimeout(() => {
                                    if (currentShow && !show) {
                                        for (const col of tableInstance.allColumns) {
                                            tableInstance.setFilter(col.id, "");

                                        }
                                    }
                                }, 200);
                            }}
                        />
                        {
                            (tags.length > 0) && (displayType === DisplayType.Grid)
                                ?
                                // <div className={stylesPublication.filter_container}>
                                // <SelectRef
                                //     id="tagFilter"
                                //     aria-label={__("reader.navigation.page")}
                                //     items={tagsOptions}
                                //     selectedKey={selectedTag}
                                //     onSelectionChange={(i) => {
                                //         setSelectedTag(i as number);
                                //         // tableInstance.setGlobalFilter(tagsOptions.find((tag) => tag.id === i).name);
                                //         tableInstance.setFilter("colTags",tagsOptions.find((tag) => tag.id === i).name);
                                //     }}
                                //     label={__("reader.navigation.page")}
                                //     className={stylesPublication.form_group}
                                // >
                                //     {item => <ComboBoxItem>{item.name}</ComboBoxItem>}
                                // </SelectRef>
                                // </div>

                                <div className={stylesPublication.filter_container}>
                                    <ComboBox
                                        label={__("header.fitlerTagTitle")}
                                        defaultItems={tagsOptions}
                                        defaultSelectedKey={tagsOptions.find((tag) => tag.name?.toLowerCase().includes(selectedTag?.toLowerCase()))?.id || undefined}
                                        onSelectionChange={(i) => {
                                            setSelectedTag(tagsOptions.find((tag) => tag.id === i)?.name);
                                            tableInstance.setFilter("colTags", tagsOptions.find((tag) => tag.id === i)?.name);
                                            // console.log(tableInstance.columns.find((element) => element.Header === "Tags"))
                                        }}
                                        svg={TagIcon}
                                        allowsCustomValue
                                    >
                                        {item => <ComboBoxItem
                                            onHoverStart={(e: HoverEvent) => {
                                                if (!e.target.getAttribute("title")) {
                                                    e.target.setAttribute("title", item.name);
                                                }
                                            }}
                                            // aria-label={item.name}
                                        >{item.name}</ComboBoxItem>}
                                    </ComboBox>
                                </div>

                                // <Popover.Root>
                                //     <Popover.Trigger asChild>
                                //         <button className={stylesTags.allPub_tagsTrigger}>
                                //             <SVG ariaHidden={true} svg={FilterIcon} />
                                //         </button>
                                //     </Popover.Trigger>
                                //     <Popover.Portal>
                                //         <Popover.Content sideOffset={5} className={stylesTags.Popover_filter_container}>
                                //             <button
                                //                 className={stylesTags.resetFilter}
                                //                 onClick={() => tableInstance.setGlobalFilter("")}
                                //                 title="Reset Filter"
                                //             >
                                //                 <SVG ariaHidden svg={DeleteFilter} />
                                //             </button>
                                //             <div>
                                //                 {tags.map((tag, i: number) => {
                                //                     return (
                                //                         <span
                                //                             key={i + 1000}
                                //                             onClick={() => tableInstance.setGlobalFilter(tag)}
                                //                             className={stylesTags.tag_item}
                                //                         >
                                //                             {tag}
                                //                         </span>
                                //                     );
                                //                 })}
                                //             </div>
                                //             <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                                //         </Popover.Content>
                                //     </Popover.Portal>
                                // </Popover.Root>
                                : <></>
                        }
                    </div>
                    <div className={stylesPublication.allBooks_header_pagination}>
                        <label htmlFor="pageSelect" className={stylesPublication.allBooks_header_pagination_title}>{__("catalog.numberOfPages")}</label>
                        <div className={stylesPublication.allBooks_header_pagination_container}>
                            <button
                                className={stylesPublication.allBooks_header_pagination_arrow}
                                aria-label={`${__("opds.firstPage")}`}
                                onClick={() => tableInstance.gotoPage(0)}
                                disabled={!tableInstance.canPreviousPage}>
                                <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                            </button>
                            <button
                                className={stylesPublication.allBooks_header_pagination_arrow}
                                style={{
                                    transform: "rotate(180deg)",
                                }}
                                aria-label={`${__("opds.previous")}`}
                                onClick={() => tableInstance.previousPage()}
                                disabled={!tableInstance.canPreviousPage}>
                                <SVG ariaHidden={true} svg={ChevronRight} />
                            </button>
                            <select
                                id="pageSelect"
                                aria-label={`${__("reader.navigation.currentPageTotal", { current: tableInstance.state.pageIndex + 1, total: tableInstance.pageOptions.length })}`}
                                className={stylesPublication.allBooks_header_pagination_select}
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
                                className={stylesPublication.allBooks_header_pagination_arrow}
                                aria-label={`${__("opds.next")}`}
                                onClick={() => tableInstance.nextPage()}
                                disabled={!tableInstance.canNextPage}>
                                <SVG ariaHidden={true} svg={ChevronRight} />
                            </button>
                            <button
                                className={stylesPublication.allBooks_header_pagination_arrow}
                                aria-label={`${__("opds.lastPage")}`}
                                onClick={() => tableInstance.gotoPage(tableInstance.pageCount - 1)}
                                disabled={!tableInstance.canNextPage}>
                                <SVG ariaHidden={true} svg={ArrowLastIcon} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={stylesPublication.allBook_table_wrapper}>
                <span
                    ref={scrollToViewRef}
                    style={{ visibility: "hidden" }}>{" "}</span>
                <table {...tableInstance.getTableProps()}
                    className={stylesPublication.allBook_table}
                    style={{
                        display: "table",
                    }}>
                    {displayType === DisplayType.Grid ? ""
                        :
                        <thead>{tableInstance.headerGroups.map((headerGroup, index) =>
                        (<tr key={`headtr_${index}`} {...headerGroup.getHeaderGroupProps()}>{
                            headerGroup.headers.map((col, i) => {

                                const column = col as unknown as (
                                    ColumnWithLooseAccessor<IColumns> & // { Header: string } &
                                    UseTableColumnProps<IColumns> &
                                    UseSortByColumnProps<IColumns> &
                                    UseFiltersColumnProps<IColumns>
                                );

                                const columnIsSortable = column.id !== "colCover";

                                const W = column.id === "colCover" ?
                                    "60px" :
                                    column.id === "colPublishedDate" ?
                                        "100px" :
                                        column.id === "colProgression" ?
                                            "100px" :
                                            column.id === "colDuration" ?
                                                "100px" :
                                                column.id === "col_a11y_accessibilitySummary" ?
                                                    "160px" :
                                                    column.id === "colAuthors" ?
                                                        "160px" :
                                                        column.id === "colRemainingDays" ?
                                                        "150px" :
                                                        column.id === "colActions" ?
                                                        "60px" :
                                                        "100px";

                                return (<th
                                    key={`headtrth_${i}`}
                                    {...column.getHeaderProps(columnIsSortable ? ({
                                        ...column.getSortByToggleProps(),
                                        // @ts-expect-error TS2322
                                        title: undefined,
                                        onClick: undefined,
                                    }) : undefined)}
                                    style={{
                                        width: W,
                                        minWidth: W,
                                        maxWidth: W,
                                        borderBottom: "2px solid var(--color-blue)",
                                        position: "relative",
                                    }}
                                    className={stylesPublication.allBook_table_head}
                                >
                                    {
                                        !column.canSort ?
                                        <h4 style={{position: "absolute", top: "8px", left: "5px"}}>
                                        {
                                            column.render("Header")
                                        }</h4>
                                        :
                                        columnIsSortable ?
                                            <><button
                                                onClick={() => {
                                                    column.toggleSortBy();
                                                }}
                                                aria-label={
                                                    `${column.Header}${column.isSorted ? (column.isSortedDesc ?
                                                        ` (${__("catalog.column.descending")})`
                                                        :
                                                        ` (${__("catalog.column.ascending")})`)
                                                        :
                                                        ` (${__("catalog.column.unsorted")})`
                                                    }`
                                                }
                                            >
                                                {
                                                    column.render("Header")
                                                }
                                                <span>
                                                    {
                                                        (column.isSorted ? (column.isSortedDesc ? " ↓" : " ↑") : "")
                                                    }
                                                </span>
                                            </button>
                                                {
                                                    column.canFilter ?
                                                        (<div style={{ display: "block" }}>{column.render("Filter", {
                                                            ...renderProps_Filter,
                                                            // columnFilter: column.filterValue,
                                                        })}</div>)
                                                        : <></>
                                                }
                                            </>
                                            :
                                            // <span
                                            // aria-label={`${column.Header}`}
                                            //     >
                                            //     {
                                            //     // displayType === DisplayType.List ? "" : column.render("Header")
                                            //     // column.render("Header")
                                            //     }
                                            // </span>
                                            <><input
                                                aria-label={__("header.searchPlaceholder")}
                                                id="setShowColumnFiltersCheckbox"
                                                type="checkbox"
                                                checked={showColumnFilters ? true : false}
                                                onFocus={()=>{
                                                    const el = window.document.getElementById("setShowColumnFiltersCheckboxLabel");
                                                    if (el) {
                                                        el.setAttribute("data-focussed", "true");
                                                    }
                                                }}
                                                onBlur={()=>{
                                                    const el = window.document.getElementById("setShowColumnFiltersCheckboxLabel");
                                                    if (el) {
                                                        el.removeAttribute("data-focussed");
                                                    }
                                                }}
                                                onKeyUp={(ev)=>{
                                                    if (ev.key === "Enter") {
                                                        // (ev.target as HTMLInputElement).checked = showColumnFilters ? false : true;
                                                        (ev.target as HTMLElement).click();

                                                        // const show = showColumnFilters;
                                                        // setShowColumnFilters(!showColumnFilters);

                                                        // setTimeout(() => {
                                                        //     if (!show) {
                                                        //         tableInstance.setGlobalFilter("");
                                                        //     }
                                                        //     if (show) {
                                                        //         for (const col of tableInstance.allColumns) {
                                                        //             tableInstance.setFilter(col.id, "");
                                                        //         }
                                                        //     }
                                                        // }, 200);
                                                    }
                                                }}
                                                onChange={() => {
                                                    const show = showColumnFilters;
                                                    setShowColumnFilters(!showColumnFilters);

                                                    setTimeout(() => {
                                                        if (!show) {
                                                            tableInstance.setGlobalFilter("");
                                                        }
                                                        if (show) {
                                                            for (const col of tableInstance.allColumns) {
                                                                tableInstance.setFilter(col.id, "");
                                                            }
                                                        }
                                                    }, 200);
                                                }}
                                                style={{ position: "absolute", left: "-999px" }}
                                            /><label
                                                id="setShowColumnFiltersCheckboxLabel"
                                                className={stylesPublication.setShowColumnFiltersCheckboxLabel}
                                                aria-hidden="true"
                                                htmlFor="setShowColumnFiltersCheckbox"
                                                style={{ cursor: "pointer", padding: "0.2em", color: "var(--color-blue)", paddingBottom: "0", display: "inline-block", width: "20px" }}>
                                                    <SVG ariaHidden svg={SearchIcon} />
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
                                //         __={__}
                                //         translator={translator}
                                //         displayType={displayType}
                                //     />
                                // </th>
                                // </tr>
                            }

                        </thead>}
                    <tbody {...tableInstance.getTableBodyProps()}
                        className={stylesPublication.allBook_table_body}
                        id="publicationsTableBody"
                        style={{
                            display: displayType === DisplayType.Grid ? "grid" : "",
                        }}
                    >
                        {tableInstance.page.map((row, index) => {

                            tableInstance.prepareRow(row);

                            const pubView: PublicationView = row.values?.colActions?.publication || undefined;
                            if (displayType === DisplayType.Grid && !pubView) {
                                console.log("#### pubView !! not defined for row :");
                                console.log(row);
                                console.log("####");
                                return (<tr key={index}></tr>);
                            }

                            return (
                                displayType === DisplayType.Grid ?
                                    <tr key={index}>
                                        <td><PublicationCard publicationViewMaybeOpds={pubView} isReading={pubView.lastReadingLocation ? true : false} /></td>
                                    </tr>
                                    :

                                    <tr key={`bodytr_${index}`} {...row.getRowProps()}
                                        style={{
                                            backgroundColor: index % 2 ? "var(--color-extralight-grey)" : undefined,
                                        }}>{row.cells.map((cell, i) => {
                                            return (<td key={`bodytrtd_${i}`} {...cell.getCellProps()}
                                            >{
                                                    cell.render("Cell", renderProps_Cell)
                                                }</td>);
                                        },
                                        )}
                                    </tr>
                            );
                        })}</tbody>
                </table>
                {/* <AboutThoriumButton /> */}
            </div>
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AllPublicationPage));
