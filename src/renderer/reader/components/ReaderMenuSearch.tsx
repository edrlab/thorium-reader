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

import { Locator as R2Locator } from "@r2-shared-js/models/locator";
import { Link } from "@r2-shared-js/models/publication-link";

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
    handleSearchClick: (locator: R2Locator) => void;
}

// tslint:disable-next-line: no-empty-interface
interface IState {
}

class ReaderMenuSearch extends React.Component<IProps, IState> {

    public render() {

        return (<>
            {
                this.renderLinkTree(undefined, this.props.links, 1)
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
            { links.map((link, i: number) => {
                return (
                    <li key={`${level}-${i}`}
                        role={useTree ? "treeitem" : undefined}
                        aria-expanded={useTree ? "true" : undefined}
                    >
                        {link.Children ? (
                            <>
                            <div role={"heading"} aria-level={level}>
                                <a
                                    className={
                                        link.Href ? styles.subheading : classnames(styles.subheading, styles.inert)
                                    }
                                    onClick=
                                        {link.Href ? (e) => this.handleSearchClick(e, link.Href) : undefined}
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
                                        {link.Href ? (e) => this.handleSearchClick(e, link.Href) : undefined}
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
            })}
        </ul>;
    }

    private handleSearchClick(e: React.MouseEvent<any> | React.KeyboardEvent<HTMLAnchorElement>, href: string) {
        e.preventDefault();
        this.props.handleSearchClick(JSON.parse(href));
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

const clearEmptyChildrenTree = (tree: Link[]): Link[] => {
    return tree
        .map((l) => {
            if (l.Children?.length) {
                l.Children = clearEmptyChildrenTree(l.Children);
            } else if (l.Children?.length === 0 || typeof l.Children === "undefined") {
                l = undefined;

            // test node marked
            } else if (typeof l.Children === "object" && !Array.isArray(l.Children)) {
                l.Children = undefined;
            }
            return l;
        })
        .filter((l) => l);
};

function computeLinks() {
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
                    const l = new Link();

                    l.Href = JSON.stringify(
                        {
                            href: l.Href,
                            locations: {
                                cssSelector: v.rangeInfo.startContainerElementCssSelector,
                            },
                        } as R2Locator,
                    );
                    l.Title = `${v.textBefore}${v.textMatch}${v.textAfter}`;
                    // mark node for the cleanFunction
                    l.Children = null;

                    findAndSetLink(links, v.href, l);
                    clearEmptyChildrenTree(links);
                });
            }
        }
        return links;
    };
}

const fn = computeLinks();
const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    return {
        links: fn(state.search?.foundArray, state.reader?.info?.r2Publication?.TOC),
    };
};

const mapDispatchToProps = (_dispatch: TDispatch) => ({

});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(ReaderMenuSearch));
