// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classnames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";
import { ISearchResult } from "readium-desktop/utils/search/search.interface";

import { Link } from "@r2-shared-js/models/publication-link";

import { readerLocalActionSearch } from "../redux/actions";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
// tslint:disable-next-line: max-line-length
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps>, TranslatorProps {
}

// tslint:disable-next-line: no-empty-interface
interface IState {
}

let prevLinks: Link[];
let searchTree: JSX.Element = <></>;

class ReaderMenuSearch extends React.Component<IProps, IState> {

    public render() {
        const { __ } = this.props;

        if (prevLinks !== this.props.links) {
            searchTree = this.renderLinkTree(undefined, this.props.links, 1);
            prevLinks = this.props.links;

        }

        return (<>
            <span>{`${this.props.foundNumber} ${__("reader.picker.search.found")}`}</span>
            {
                searchTree
            }
        </>);
    }

    private renderLinkTree(label: string | undefined, links: Link[], level: number): JSX.Element {

        // VoiceOver support breaks when using the propoer tree[item] ARIA role :(
        const useTree = false;

        return <ul
            role={useTree ? (level <= 1 ? "tree" : "group") : undefined}
            aria-label={label}
            className={styles.chapters_content}
        >
            {
                links?.map((link, i: number) => {
                    return (
                        <li key={`${level}-${i}`}
                            role={useTree ? "treeitem" : undefined}
                            aria-expanded={useTree ? "true" : undefined}
                        >
                            {link.Children?.length ? (
                                <>
                                    <div role={"heading"} aria-level={level}>
                                        <span
                                            className={
                                                link.Href
                                                    ? styles.subheading
                                                : classnames(styles.subheading, styles.inert)
                                            }
                                            tabIndex={0}
                                        >
                                            <span>{link.Title}</span>
                                        </span>
                                    </div>

                                    {this.renderLinkTree(undefined, link.Children, level + 1)}
                                </>
                            ) : (
                                    <div role={"heading"} aria-level={level}>
                                        <a
                                            className={
                                                link.Href ?
                                                    classnames(styles.line, styles.active) :
                                                    classnames(styles.line, styles.active, styles.inert)
                                            }
                                            onClick=
                                            {(e) => this.handleSearchClick(e, link.Href)}
                                            tabIndex={0}
                                            onKeyPress=
                                            {
                                                (e) => {
                                                    if (link.Href && e.key === "Enter") {
                                                        this.handleSearchClick(e, link.Href);
                                                    }
                                                }
                                            }
                                            data-href={link.Href}
                                        >
                                            <span>{link.Title ? link.Title : `#${level}-${i} ${link.Href}`}</span>
                                        </a>
                                    </div>
                                )}
                        </li>
                    );
                },
                )
            }
        </ul>;
    }

    private handleSearchClick(e: React.MouseEvent<any> | React.KeyboardEvent<HTMLAnchorElement>, href: string) {
        e.preventDefault();
        this.props.focus(href);
    }
}

const copyLink = (link: Link): Link => {
    const ln = new Link();

    ln.Href = link.Href;
    ln.Title = link.Title;
    ln.Children = link.Children?.map((l) => copyLink(l));

    return ln;
};

const findAndSetLink = (host: Link[], searchHref: string, link: Link) => {

    for (const ln of host) {
        if (ln.Href === searchHref) {
            ln.Children = Array.isArray(ln.Children) ? ln.Children : [];
            ln.Children.push(link);
        } else if (ln.Children?.length) {
            findAndSetLink(ln.Children, searchHref, link);
        }
    }
};

const clearTreeLink = (ln: Link | undefined): Link => {

    if (ln?.Children?.length) {
        ln.Children = ln.Children
            .map((l) => clearTreeLink(l))
            .reduce((pv, cv) => cv ? [...pv, cv] : pv, []);

        if (ln.Children?.length) {
            return ln;
        }
    } else if (ln?.TypeLink === "search") {
        return ln;
    }
    return undefined;
};

const computeLinks = () => {
    let prevFound: ISearchResult[] = null;
    let prevToc: Link[] = null;
    let links: Link[];

    return (found: ISearchResult[], toc: Link[]) => {

        if (found !== prevFound || toc !== prevToc) {
            prevFound = found;
            prevToc = toc;

            if (Array.isArray(found) && Array.isArray(toc)) {

                links = toc.map((l) => copyLink(l));
                found.forEach((v) => {
                    const insertLink = new Link();

                    insertLink.Href = v.uuid;
                    insertLink.Title = `...${v.textBefore} ${v.textMatch} ${v.textAfter}...`;
                    insertLink.TypeLink = "search";

                    findAndSetLink(links, v.href, insertLink);
                });
                links = links
                    .map((link) => clearTreeLink(link))
                    .filter((link) => link);
            }
        }
        return links;
    };
};

const fn = computeLinks();
const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    return {
        links: fn(state.search?.foundArray, state.reader?.info?.r2Publication?.TOC),
        foundNumber: state.search.foundArray?.length || 0,
    };
};

const mapDispatchToProps = (dispatch: TDispatch) => ({
    focus: (uuid: string) => { dispatch(readerLocalActionSearch.focus.build(uuid)); },
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderMenuSearch));
