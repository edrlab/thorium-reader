// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "regenerator-runtime/runtime"; // for react-table (useAsyncDebounce()) see: https://github.com/TanStack/react-table/issues/2071#issuecomment-679999096
import * as stylesPublication from "readium-desktop/renderer/assets/styles/components/allPublicationsPage.scss";
import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as FileBroken from "readium-desktop/renderer/assets/icons/file-broken-icon.svg";
import * as CloseIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import { Row, Column, Table } from "@tanstack/react-table";
import { availableLanguages } from "readium-desktop/common/services/translator";
import DOMPurify from "dompurify";
import * as React from "react";
import { DisplayType } from "readium-desktop/renderer/library/routing";
import * as Popover from "@radix-ui/react-popover";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { IColumns, IActiveFilter, ITableCellProps_Common, IColumnValue_Cover, IColumnValue_BaseString, IColumnValue_Date, IColumnValue_Remain, IColumnValue_Langs, IColumnValue_Publishers, IColumnValue_Authors, IColumnValue_Tags, IColumnValue_Title} from "./AllPublications";
import { convertMultiLangStringToLangString } from "readium-desktop/common/language-string";
import { langStringIsRTL } from "@r2-shared-js/_utils/language-string";
import classNames from "classnames";
import * as CalendarIcon from "readium-desktop/renderer/assets/icons/calendar2-icon.svg";
import * as KeyIcon from "readium-desktop/renderer/assets/icons/key-icon.svg";
import * as ValidatedIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as OnGoingBookIcon from "readium-desktop/renderer/assets/icons/ongoingBook-icon.svg";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

// ---- Types ----------------------------------------------------------------

interface ITableCellProps_Column {
    column: Column<IColumns>;
    row: Row<IColumns>;
    table: Table<IColumns>;
}

interface ITableCellProps_GenericCell extends ITableCellProps_Common {
    setShowColumnFilters: (show: boolean, columnId: string, filterValue: string) => void;
    selectedTag: string;
    setSelectedTag: React.Dispatch<React.SetStateAction<string>>;
    displayType: DisplayType;
}

interface ITableCellProps_StringValue {
    value: string;
}

interface ITableCellProps_WithFilter {
    setActiveFiltersArray?: React.Dispatch<React.SetStateAction<IActiveFilter[]>>;
    setSelection?: React.Dispatch<React.SetStateAction<string>>;
}

interface ITableCellProps_WithOpenReader {
    openReader: (id: string) => void;
}

// ---- Helpers ---------------------------------------------------------------

const commonCellStyles = (props: Pick<ITableCellProps_Common, "displayType">): React.CSSProperties => ({
    maxHeight: props.displayType === DisplayType.Grid ? "150px" : "100px",
    padding: "0.4em",
    textAlign: "left",
    userSelect: "text",
    overflow: "auto",
});

interface IFilterLinkProps {
    label: string;
    searchLabel: string;
    onClick: () => void;
    className?: string;
    style?: React.CSSProperties;
    dir?: string;
    children?: React.ReactNode;
}

const FilterLink: React.FC<IFilterLinkProps> = ({ label, searchLabel, onClick, className, style, dir, children }) => {
    return (
        <a
            dir={dir}
            title={searchLabel}
            tabIndex={0}
            className={className}
            style={style}
            onKeyUp={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onClick();
                }
            }}
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
        >
            {children ?? label}
        </a>
    );
};

interface ICellListProps {
    items: React.ReactNode[];
    className?: string;
}

const CellList: React.FC<ICellListProps> = ({ items, className }) => {
    if (!items.length) return <></>;
    if (items.length === 1) return (
        <div className={classNames(stylesPublication.cell_wrapper, className)}>
            {items[0]}
        </div>
    );
    return (
        <ul className={classNames(stylesPublication.cell_wrapper, stylesPublication.cell_multi_langs, className)}>
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    );
};

const useColumnFilter = (
    columnId: string,
    filterCol: keyof IColumns,
    filterType: string,
    setShowColumnFilters?: (show: boolean, columnId: string, filterValue: string) => void,
    setActiveFiltersArray?: React.Dispatch<React.SetStateAction<IActiveFilter[]>>,
    setSelection?: React.Dispatch<React.SetStateAction<string>>,
) => {
    const applyFilter = (value: string) => {
        if (!setShowColumnFilters) {
            console.warn("setShowColumnFilters is undefined — not passed from column definition");
            return;
        }
        setShowColumnFilters(true, columnId, value);
        if (setActiveFiltersArray && setSelection) {
            setSelection(value);
            setActiveFiltersArray(prev => [
                ...prev.filter(f => f.filterCol !== filterCol),
                { filterType, value, filterCol },
            ]);
        }
    };
    return applyFilter;
};

// ---- Cell Components -------------------------------------------------------

export const CellCoverImage: React.FC<IColumnValue_Cover> = ({ label, title, isOpenable, openReader, publicationViewIdentifier }) => {
    const [__] = useTranslator();

    return (
        <div className={stylesPublication.cell_coverImg}>
            <a
                title={title}
                onClick={() => isOpenable && openReader(publicationViewIdentifier)}
            >
                {isOpenable === false && (
                    <div
                        aria-label={__("catalog.missing")}
                        style={{ position: "absolute", width: "78px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}
                    >
                        <div aria-hidden style={{ height: "40px", width: "40px", borderRadius: "50%", background: "var(--color-error-text)", padding: "10px" }}>
                            <SVG aria-hidden svg={FileBroken} className={stylesPublications.publication_missing_icon} />
                        </div>
                    </div>
                )}
                <img
                    src={label || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAGUUlEQVR4Xu3UAQ0AIAwDQfCvBx9zBAk2/uag16X7zNzlCBBICmwDkOxdaAJfwAB4BAJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJGAA/QCAsYADC5YtOwAD4AQJhAQMQLl90AgbADxAICxiAcPmiEzAAfoBAWMAAhMsXnYAB8AMEwgIGIFy+6AQMgB8gEBYwAOHyRSdgAPwAgbCAAQiXLzoBA+AHCIQFDEC4fNEJPOMbVS78Q2ATAAAAAElFTkSuQmCC"}
                    alt=""
                    role="presentation"
                />
            </a>
        </div>
    );
};

export const CellFormat: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_StringValue & ITableCellProps_WithFilter> = (props) => {
    const applyFilter = useColumnFilter(
        props.column.id,
        "colFormat",
        props.column.columnDef.header?.toString() ?? "",
        props.setShowColumnFilters,
        props.setActiveFiltersArray,
        props.setSelection,
    );
    const [__] = useTranslator();

    return (
        <div className={stylesPublication.cell_wrapper}>
            <FilterLink
                label={props.value}
                searchLabel={`${props.value} (${__("header.searchPlaceholder")})`}
                onClick={() => applyFilter(props.value)}
                className={stylesButtons.button_nav_primary}
                style={{ padding: "2px" }}
            />
        </div>
    );
};

export const CellLangs: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_Langs } & ITableCellProps_WithFilter> = (props) => {
    const applyFilter = useColumnFilter(
        props.column.id,
        "colLanguages",
        props.column.columnDef.header?.toString() ?? "",
        props.setShowColumnFilters,
        props.setActiveFiltersArray,
        props.setSelection,
    );
    const [__] = useTranslator();

    const items = (props.value.langs ?? []).map((lang) => (
        <FilterLink
            key={lang}
            label={lang}
            searchLabel={`${lang} (${__("header.searchPlaceholder")})`}
            onClick={() => applyFilter(lang)}
            className={stylesPublication.cell_link}
        />
    ));

    return <CellList items={items} />;
};

export const CellPublishers: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_Publishers } & ITableCellProps_WithFilter> = (props) => {
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const [__] = useTranslator();

    const items = (props.value.publishersLangString ?? []).map((text, i) => {
        const textLangStr = convertMultiLangStringToLangString(text, locale as keyof typeof availableLanguages);
        const textLang = textLangStr?.[0]?.toLowerCase() ?? "";
        const textIsRTL = langStringIsRTL(textLang);
        const textStr = textLangStr?.[1] ?? "";

        return (
            <FilterLink
                key={i}
                label={textStr}
                searchLabel={`${textStr} (${__("header.searchPlaceholder")})`}
                onClick={() => props.setShowColumnFilters(true, props.column.id, textStr)}
                className={stylesPublication.cell_link}
                dir={textIsRTL ? "rtl" : undefined}
            />
        );
    });

    return <CellList items={items} />;
};

export const CellAuthors: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_Authors } & ITableCellProps_WithFilter> = (props) => {
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);
    const [__] = useTranslator();

    const applyFilter = useColumnFilter(
        props.column.id,
        "colAuthors",
        props.column.columnDef.header?.toString() ?? "",
        props.setShowColumnFilters,
        props.setActiveFiltersArray,
        props.setSelection,
    );

    const items = (props.value.authorsLangString ?? []).map((text, i) => {
        const textLangStr = convertMultiLangStringToLangString(text, locale as keyof typeof availableLanguages);
        const textLang = textLangStr?.[0]?.toLowerCase() ?? "";
        const textIsRTL = langStringIsRTL(textLang);
        const textStr = textLangStr?.[1] ?? "";

        return (
            <FilterLink
                key={i}
                label={textStr}
                searchLabel={`${textStr} (${__("header.searchPlaceholder")})`}
                onClick={() => applyFilter(textStr)}
                className={stylesPublication.cell_link}
                dir={textIsRTL ? "rtl" : undefined}
            />
        );
    });

    return (
        <div style={commonCellStyles(props)}>
            <CellList items={items} />
        </div>
    );
};

export const CellTags: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_Tags } & ITableCellProps_WithFilter> = (props) => {
    const applyFilter = useColumnFilter(
        props.column.id,
        "colTags",
        props.column.columnDef.header?.toString() ?? "",
        props.setShowColumnFilters,
        props.setActiveFiltersArray,
        props.setSelection,
    );
    const [__] = useTranslator();

    const items = (props.value.tags ?? []).map((tag) => (
        <FilterLink
            key={tag}
            label={tag}
            searchLabel={`${tag} (${__("header.searchPlaceholder")})`}
            onClick={() => {
                applyFilter(tag);
                props.setSelectedTag(tag);
            }}
            className={stylesButtons.button_nav_primary}
            style={{ padding: "2px" }}
        >
            <p style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", textWrap: "nowrap" }}>
                {tag}
            </p>
        </FilterLink>
    ));

    return <CellList items={items} />;
};

export const CellDescription: React.FC<{ value: string }> = ({ value }) => {
    const cellTextSanitized = DOMPurify.sanitize(value || "").replace(/font-size:/g, "font-sizexx:");
    const [isOpen, setIsOpen] = React.useState(false);


    return (
        <div className={stylesPublication.cell_description} style={{ paddingBottom: "0", textAlign: "start" }}>
            <p dangerouslySetInnerHTML={{ __html: cellTextSanitized }} />
            {value && (
                <Popover.Root onOpenChange={(open) => setIsOpen(open)}>
                    <Popover.Trigger style={{ maxWidth: "15px" }}>
                        <SVG ariaHidden svg={isOpen ? CloseIcon : ChevronDown} />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content collisionPadding={{ top: 280 }} avoidCollisions sideOffset={5} align="end" alignOffset={-10} hideWhenDetached>
                            <p className={stylesDropDown.dropdown_description} dangerouslySetInnerHTML={{ __html: cellTextSanitized }} />
                            <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            )}
        </div>
    );
};

export const CellDate: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & Pick<ITableCellProps_GenericCell, "displayType"> & { value: IColumnValue_Date }> = (props) => {
    const [__] = useTranslator();
    if (!props.value.label) return <></>;

    const filterValue = props.value.label.substring(0, props.column.id === "colLastReadTimestamp" ? 7 : 4);

    return (
        <div style={commonCellStyles(props)}>
            <FilterLink
                label={props.value.date}
                searchLabel={`${props.value.label} (${__("header.searchPlaceholder")})`}
                onClick={() => props.setShowColumnFilters?.(true, props.column.id, filterValue)}
                className={stylesPublication.cell_link}
            />
        </div>
    );
};

export const CellTitle: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_Title } & ITableCellProps_WithOpenReader> = (props) => {
    const locale = useSelector((state: ICommonRootState) => state.i18n.locale);

    const pubTitleLangStr = convertMultiLangStringToLangString(props.value.pubTitle, locale as keyof typeof availableLanguages);
    const pubTitleLang = pubTitleLangStr?.[0]?.toLowerCase() ?? "";
    const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
    const pubTitleStr = pubTitleLangStr?.[1] ?? "";

    return (
        <div style={commonCellStyles(props)} dir={pubTitleIsRTL ? "rtl" : undefined}>
            <a
                tabIndex={0}
                className={stylesPublication.cell_bookTitle}
                onClick={() => props.openReader(props.value.publicationViewIdentifier)}
                onKeyUp={(e) => {
                    if (e.key === "Enter") props.openReader(props.value.publicationViewIdentifier);
                }}
            >
                {pubTitleStr}
            </a>
        </div>
    );
};

export const CellRemainingDays: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_Remain }> = (props) => {
    const [__] = useTranslator();
    const { label, hasEnded, isLcp } = props.value;

    return (
        <div className={stylesPublication.cell_wrapper}>
            {label ? (
                <div className={stylesPublications.lcpIndicator}>
                    <SVG ariaHidden svg={hasEnded ? KeyIcon : CalendarIcon} />
                    <FilterLink
                        label={label}
                        searchLabel={`${label} (${__("header.searchPlaceholder")})`}
                        onClick={() => props.setShowColumnFilters(true, props.column.id, label)}
                    />
                </div>
            ) : isLcp ? (
                <div className={stylesPublications.lcpIndicator}>
                    <SVG ariaHidden svg={KeyIcon} />
                    {__("publication.licensed")}
                </div>
            ) : <></>}
        </div>
    );
};

export const CellReadingState: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & { value: IColumnValue_BaseString } & ITableCellProps_WithFilter > = (props) => {
    const applyFilter = useColumnFilter(
        props.column.id,
        "colReadingState",
        props.column.columnDef.header?.toString() ?? "",
        props.setShowColumnFilters,
        props.setActiveFiltersArray,
        props.setSelection,
    );
    const [__] = useTranslator();
    const { label } = props.value;

    return (
        <div className={stylesPublication.cell_wrapper}>
            {label && (
                <div className={stylesPublications.lcpIndicator}>
                    <SVG ariaHidden svg={label === __("publication.read") ? ValidatedIcon : OnGoingBookIcon} />
                    <FilterLink
                        label={label}
                        searchLabel={`${label} (${__("header.searchPlaceholder")})`}
                        onClick={() => applyFilter(label)}
                    />
                </div>
            )}
        </div>
    );
};

export const TableCell: React.FC<ITableCellProps_Column & ITableCellProps_GenericCell & ITableCellProps_StringValue> = (props) => {
    return (<div style={{
        ...commonCellStyles(props),
    }}>
        {props.value}
    </div>);
};
