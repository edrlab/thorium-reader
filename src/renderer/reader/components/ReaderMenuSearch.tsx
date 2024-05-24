// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import debounce from "debounce";
import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import * as ArrowLastIcon from "readium-desktop/renderer/assets/icons/arrowLast-icon.svg";
import * as ArrowFirstIcon from "readium-desktop/renderer/assets/icons/arrowFirst-icon.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesPopoverDialog from "readium-desktop/renderer/assets/styles/components/popoverDialog.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { TDispatch } from "readium-desktop/typings/redux";
import { ISearchResult } from "readium-desktop/utils/search/search.interface";

import { Link } from "@r2-shared-js/models/publication-link";

import { readerLocalActionSearch } from "../redux/actions";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    focusMainAreaLandmarkAndCloseMenu: () => void;
    dockedMode: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps>, TranslatorProps {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
    nMatchPage: number;
}

const MAX_MATCHES_PER_PAGE = 10;

function findFirstLinkWithHref(links: Link[], href: string): Link | undefined {
    for (const link of links) {
        if (link.Href && link.Href.startsWith(href)) {
            return link;
        }
        if (link.Children?.length) {
            const l = findFirstLinkWithHref(link.Children, href);
            if (l) {
                return l;
            }
        }
    }
    return undefined;
}

let _memoRenderSearchLinks: JSX.Element | undefined;
const _memoDeps: {
    label: string | undefined;
    foundArray: ISearchResult[] | undefined;
    nMatchPage: number | undefined;
    readingOrder: Link[] | undefined;
    toc: Link[] | undefined;
    dockedMode: boolean | undefined;
} = {
    label: undefined,
    foundArray: undefined,
    nMatchPage: undefined,
    readingOrder: undefined,
    toc: undefined,
    dockedMode: undefined,
};
function renderSearchLinks(label: string, foundArray: ISearchResult[], nMatchPage: number, readingOrder: Link[], toc: Link[], dockedMode: boolean, thiz: ReaderMenuSearch): JSX.Element {

    // use memoized / cached object
    if (_memoRenderSearchLinks
        && _memoDeps.label === label
        && _memoDeps.foundArray === foundArray
        && _memoDeps.nMatchPage === nMatchPage
        && _memoDeps.readingOrder === readingOrder
        && _memoDeps.toc === toc
        && _memoDeps.dockedMode === dockedMode
    ) {
        return _memoRenderSearchLinks;
    }

    // invalidate, create updated object
    _memoRenderSearchLinks = undefined;

    _memoDeps.label = label;
    _memoDeps.foundArray = foundArray;
    _memoDeps.nMatchPage = nMatchPage;
    _memoDeps.readingOrder = readingOrder;
    _memoDeps.toc = toc;
    _memoDeps.dockedMode = dockedMode;

    if (!foundArray) { _memoRenderSearchLinks = <></>; return _memoRenderSearchLinks; }

    let k = 0;
    let iMatch = -1;
    _memoRenderSearchLinks = <ul
        aria-label={label}
        className={stylesPopoverDialog.chapters_content}
        role={"list"}
    >{
        (readingOrder || []).reduce((pv, spineLink, j) => {
            const res = foundArray.reduce((prevVal, v, _i) => {
                if (v.href === spineLink.Href) {

                    iMatch++;
                    const startIndex = nMatchPage * MAX_MATCHES_PER_PAGE;
                    if (iMatch >= startIndex && iMatch < (startIndex + MAX_MATCHES_PER_PAGE)) {

                        const isRTL = false; // TODO RTL (see ReaderMenu.tsx)

                        k++;
                        const jsx = (
                            <li
                                key={`found_${k}`}
                                aria-level={1}
                                role={"listitem"}
                            >
                                <a
                                    className={
                                        classNames(stylesReader.line,
                                            stylesReader.active,
                                            isRTL ? stylesReader.rtlDir : " ")
                                    }
                                    style={{
                                        fontWeight: "normal",
                                    }}
                                    tabIndex={0}
                                    onClick=
                                        {(e) => { // MOUSE CLICK (not ENTER)
                                            const closeNavSearch = !dockedMode && !(e.shiftKey && e.altKey);
                                            thiz.handleSearchClickDebounced(e, v.uuid, closeNavSearch);
                                        }}
                                    onDoubleClick=
                                        {(e) => thiz.handleSearchClickDebounced(e, v.uuid, false)}
                                    onKeyUp=
                                        {
                                            (e) => { // because onClick is only for MOUSE CLICK
                                                if (e.key === "Enter") {
                                                    const closeNavSearch = !dockedMode && !(e.shiftKey && e.altKey);
                                                    thiz.handleSearchClick(e, v.uuid, closeNavSearch);
                                                }
                                            }
                                        }
                                    data-href={v.href}
                                >
                                    <span dir={isRTL ? "rtl" : "ltr"}>{
                                    `...${v.cleanBefore}`
                                    }<span style={{backgroundColor: "var(--color-blue)", color: "white", padding: "0 2px"}}>{
                                    `${v.cleanText}`
                                    }</span>{
                                    `${v.cleanAfter}...`
                                    }</span>
                                </a>
                            </li>
                        );

                        prevVal.push(jsx);
                    }
                }

                return prevVal;
            }, []);
            if (res.length) {
                k++;
                let title = spineLink.Title;
                if (!title && toc) {
                    const l = findFirstLinkWithHref(toc, spineLink.Href);
                    if (l && l.Title) {
                        title = l.Title;
                    }
                }
                const jsxHead = (
                <li
                    className={stylesPopoverDialog.subheading}
                    key={`found_${k}`}>
                    <span>{title ? title : `#${j} ${spineLink.Href}`}</span>
                </li>
                );
                pv.push(jsxHead);
            }
            return pv.concat(res);
        }, [])
    }</ul>;
    return _memoRenderSearchLinks;
}

class ReaderMenuSearch extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            nMatchPage: 0,
        };
    }

    public componentDidUpdate(prevProps: Readonly<IProps>): void {
        if (prevProps.foundArray !== this.props.foundArray) {
            this.setState({ nMatchPage: 0 });
        }
    }

    public render() {
        const { __ } = this.props;

        const label = this.props.foundArray?.length ?
            __("reader.picker.search.founds", {nResults: this.props.foundArray.length}) :
            __("reader.picker.search.notFound");

        const memoJsx = renderSearchLinks(label, this.props.foundArray, this.state.nMatchPage, this.props.readingOrder, this.props.toc, this.props.dockedMode, this);
    
        const startIndex = this.state.nMatchPage * MAX_MATCHES_PER_PAGE;
        const begin = startIndex + 1;
        const end = Math.min(startIndex + MAX_MATCHES_PER_PAGE, this.props.foundArray?.length || 0);

        const pageTotal =  !this.props.foundArray?.length ? 0 :
            (
            // Math.ceil(this.props.foundArray.length / MAX_MATCHES_PER_PAGE)
            Math.floor(this.props.foundArray.length / MAX_MATCHES_PER_PAGE) +
            ((this.props.foundArray.length % MAX_MATCHES_PER_PAGE === 0) ? 0 : 1)
            );
        const pageOptions = Array(pageTotal).fill(undefined).map((_,i) => i).map((v) => {
            // const startIndex = v * MAX_MATCHES_PER_PAGE;
            // const begin = startIndex + 1;
            // const end = Math.min(startIndex + MAX_MATCHES_PER_PAGE, this.props.foundArray?.length || 0);
            // return {id: v, name: `${v+1} / ${pageTotal}  [ ${begin === end ? `${end}` : `${begin} ... ${end}`} ]`};
            return {id: v, name: `${v+1} / ${pageTotal}`};
        });

        return (<>
            <p className={stylesPopoverDialog.correspondances}>{`${label}`}</p>
            {
                memoJsx
            }
            <div className={stylesPopoverDialog.navigation_container}>
                {(this.props.foundArray && this.props.foundArray.length > MAX_MATCHES_PER_PAGE) &&
                    <>
                        <button title={__("opds.firstPage")}
                            onClick={() => this.onPageFirst()}
                            disabled={begin === 1 ? true : false}>
                            <SVG ariaHidden={true} svg={ArrowFirstIcon} />
                        </button>

                        <button title={__("opds.previous")}
                            onClick={() => this.onPagePrevious()}
                            disabled={begin === 1 ? true : false}>
                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                        </button>

                        <div className={stylesPopoverDialog.pages}>
                            <label htmlFor="paginatorSearch" style={{margin: "0"}}>{__("reader.navigation.page")}</label>
                            <select onChange={(e) => {
                                    this.setState({nMatchPage: pageOptions.find((option) => option.id === parseInt(e.currentTarget.value, 10)).id});
                                }}
                                id="paginatorSearch"
                                aria-label={__("reader.navigation.page")}
                                // defaultValue={1}
                                value={this.state.nMatchPage}
                                >
                                {pageOptions.map((item) => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>

                        <button title={__("opds.next")}
                            onClick={() => this.onPageNext()}
                            disabled={end === this.props.foundArray?.length ? true : false}>
                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                        </button>

                        <button title={__("opds.lastPage")}
                            onClick={() => this.onPageLast()}
                            disabled={end === this.props.foundArray?.length ? true : false}>
                            <SVG ariaHidden={true} svg={ArrowLastIcon} />
                        </button>
                    </>
                }
            </div>
            {
            this.props.foundArray?.length &&
            <p
                style={{
                    textAlign: "center",
                    padding: 0,
                    margin: 0,
                    marginTop: "-16px",
                    marginBottom: "20px",
            }}>{`[ ${begin === end ? `${end}` : `${begin} ... ${end}`} ] / ${__("reader.picker.search.founds", {nResults: this.props.foundArray.length})}`}</p>
        }
        </>);
    }

    private onPageFirst() {
        this.setState({
            nMatchPage: 0,
        });
    }
    private onPageLast() {
        if (this.props.foundArray?.length) {
            const nPages = Math.ceil(this.props.foundArray.length / MAX_MATCHES_PER_PAGE);

            this.setState({
                nMatchPage: nPages - 1,
            });
        }
    }
    private onPagePrevious() {
        if (this.state.nMatchPage <= 0) {
            return;
        }

        this.setState({
            nMatchPage: this.state.nMatchPage - 1,
        });
    }
    private onPageNext() {
        let lastPage = true;

        if (this.props.foundArray?.length) {
            const nPages = Math.ceil(this.props.foundArray.length / MAX_MATCHES_PER_PAGE);
            lastPage = this.state.nMatchPage >= (nPages - 1);
        }

        if (lastPage) {
            return;
        }

        this.setState({
            nMatchPage: this.state.nMatchPage + 1,
        });
    }

    // private renderLinkTree(label: string | undefined, links: Link[], level: number): JSX.Element {

    //     // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
    //     const useTree = false;

    //     return <ul
    //         role={useTree ? (level <= 1 ? "tree" : "group") : undefined}
    //         aria-label={label}
    //         className={stylesReader.chapters_content}
    //         style={{marginTop: "15px"}}
    //     >
    //         {
    //             links?.map((link, i: number) => {
    //                 return (
    //                     <li key={`${level}-${i}`}
    //                         role={useTree ? "treeitem" : undefined}
    //                         aria-expanded={useTree ? "true" : undefined}
    //                     >
    //                         {link.Children?.length ? (
    //                             <>
    //                                 <div role={"heading"} aria-level={level}>
    //                                     <span
    //                                         className={
    //                                             link.Href
    //                                                 ? stylesReader.subheading
    //                                             : classNames(stylesReader.subheading, stylesReader.inert)
    //                                         }
    //                                         tabIndex={0}
    //                                     >
    //                                         <span>{link.Title}</span>
    //                                     </span>
    //                                 </div>

    //                                 {this.renderLinkTree(undefined, link.Children, level + 1)}
    //                             </>
    //                         ) : (
    //                                 <div role={"heading"} aria-level={level}>
    //                                     <a
    //                                         className={
    //                                             link.Href ?
    //                                                 classNames(stylesReader.line, stylesReader.active) :
    //                                                 classNames(stylesReader.line, stylesReader.active, stylesReader.inert)
    //                                         }
    //                                         onClick=
    //                                         {(e) => this.handleSearchClick(e, link.Href, false)}
    //                                         tabIndex={0}
    //                                         onKeyUp=
    //                                         {
    //                                             (e) => {
    //                                                 if (link.Href && e.key === "Enter") {
    //                                                     const closeNavSearch = e.shiftKey && e.altKey ? false : true;
    //                                                     this.handleSearchClick(e, link.Href, closeNavSearch);
    //                                                 }
    //                                             }
    //                                         }
    //                                         data-href={link.Href}
    //                                     >
    //                                         <span dangerouslySetInnerHTML={{ __html: link.Title}}></span>
    //                                     </a>
    //                                 </div>
    //                             )}
    //                     </li>
    //                 );
    //             },
    //             )
    //         }
    //     </ul>;
    // }

    public handleSearchClick(
        e: React.MouseEvent<any> | React.KeyboardEvent<HTMLAnchorElement>,
        href: string,
        closeNavPanel: boolean) {

        handleSearchClickFunc(this, e, href, closeNavPanel);
    }

    public handleSearchClickDebounced(
        e: React.MouseEvent<any> | React.KeyboardEvent<HTMLAnchorElement>,
        href: string,
        closeNavPanel: boolean) {

        handleSearchClickFuncDebounced(this, e, href, closeNavPanel);
    }
}

const handleSearchClickFunc = (
    thiz: ReaderMenuSearch,
    e: React.MouseEvent<any> | React.KeyboardEvent<HTMLAnchorElement>,
    href: string,
    closeNavPanel: boolean) => {

    e.preventDefault();

    if (closeNavPanel) {
        thiz.props.focusMainAreaLandmarkAndCloseMenu();
    }

    console.log(href);
    thiz.props.focus(href); // search uuid
};

const handleSearchClickFuncDebounced = debounce(handleSearchClickFunc, 300);

// const copyLink = (link: Link): Link => {
//     const ln = new Link();

//     ln.Href = link.Href;
//     ln.Title = link.Title;
//     ln.Children = link.Children?.map((l) => copyLink(l));

//     return ln;
// };

// const findAndSetLink = (host: Link[], searchHref: string, link: Link) => {

//     for (const ln of host) {
//         if (ln.Href === searchHref) {
//             ln.Children = Array.isArray(ln.Children) ? ln.Children : [];
//             ln.Children.push(link);
//         } else if (ln.Children?.length) {
//             findAndSetLink(ln.Children, searchHref, link);
//         }
//     }
// };

// const clearTreeLink = (ln: Link | undefined): Link => {

//     if (ln?.Children?.length) {
//         ln.Children = ln.Children
//             .map((l) => clearTreeLink(l))
//             .reduce((pv, cv) => cv ? [...pv, cv] : pv, []);

//         if (ln.Children?.length) {
//             return ln;
//         }
//     } else if (ln?.TypeLink === "search") {
//         return ln;
//     }
//     return undefined;
// };

// const computeLinks = () => {
//     let prevFound: ISearchResult[] = null;
//     let prevToc: Link[] = null;
//     let links: Link[];

//     return (found: ISearchResult[], toc: Link[]) => {

//         if (found !== prevFound || toc !== prevToc) {
//             prevFound = found;
//             prevToc = toc;

//             if (Array.isArray(found) && Array.isArray(toc)) {

//                 links = toc.map((l) => copyLink(l));
//                 found.forEach((v) => {
//                     const insertLink = new Link();

//                     insertLink.Href = v.uuid;
//                     insertLink.Title =
// `...${v.textBefore}<span style="background-color: coral">${v.cleanText}</span>${v.textAfter}...`;
//                     insertLink.TypeLink = "search";

//                     findAndSetLink(links, v.href, insertLink);
//                 });
//                 links = links
//                     .map((link) => clearTreeLink(link))
//                     .filter((link) => link);
//             }
//         }
//         return links;
//     };
// };

// const fn = computeLinks();
const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    return {
        // links: fn(state.search?.foundArray, state.reader?.info?.r2Publication?.TOC),
        // foundNumber: state.search.foundArray?.length || 0,
        foundArray: state.search?.foundArray,
        readingOrder: state.reader?.info?.r2Publication?.Spine,
        toc: state.reader?.info?.r2Publication?.TOC,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => ({
    focus: (uuid: string) => {
        dispatch(readerLocalActionSearch.focus.build(uuid));
    },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderMenuSearch));
