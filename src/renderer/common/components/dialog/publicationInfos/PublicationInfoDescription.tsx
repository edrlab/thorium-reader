// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as debug_ from "debug";
import * as DOMPurify from "dompurify";
import * as React from "react";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import { IStringMap } from "@r2-shared-js/models/metadata-multilang";

// Logger
const debug = debug_("readium-desktop:renderer:publicationInfoDescription");
debug("_");

// MAIN process only, not RENDERER, because of diMainGet("translator")
// import { convertMultiLangStringToString } from "readium-desktop/main/converter/tools/localisation";
function convertMultiLangStringToString(translator: Translator, items: string | IStringMap | undefined): string {
    if (typeof items === "object") {
        const langs = Object.keys(items);
        const lang = langs.filter((l) =>
            l.toLowerCase().includes(translator.getLocale().toLowerCase()));
        const localeLang = lang[0];
        return items[localeLang] || items._ || items[langs[0]];
    }
    return items;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
    publication: TPublication;
    __: I18nTyped;
    translator: Translator;
}

interface IState {
    seeMore: boolean;
    needSeeMore: boolean;

    seeMore_a11y: boolean;
    needSeeMore_a11y: boolean;
}

export default class PublicationInfoDescription extends React.Component<IProps, IState> {

    private descriptionWrapperRef: React.RefObject<HTMLDivElement>;
    private descriptionRef: React.RefObject<HTMLParagraphElement>;

    private descriptionWrapperRef_a11y: React.RefObject<HTMLDivElement>;
    private descriptionRef_a11y: React.RefObject<HTMLParagraphElement>;

    constructor(props: IProps) {
        super(props);

        this.descriptionWrapperRef = React.createRef<HTMLDivElement>();
        this.descriptionRef = React.createRef<HTMLParagraphElement>();


        this.descriptionWrapperRef_a11y = React.createRef<HTMLDivElement>();
        this.descriptionRef_a11y = React.createRef<HTMLParagraphElement>();

        this.state = {
            seeMore: false,
            needSeeMore: false,

            seeMore_a11y: false,
            needSeeMore_a11y: false,
        };
    }

    public componentDidMount() {
        setTimeout(this.needSeeMoreButton, 500);
        setTimeout(this.needSeeMoreButton_a11y, 500);
    }

    public componentDidUpdate(prevProps: IProps) {

        if (this.props.publication !== prevProps.publication) {
            setTimeout(this.needSeeMoreButton, 500);
            setTimeout(this.needSeeMoreButton_a11y, 500);
        }
    }

    public render() {
        const { publication, __, translator } = this.props;

        if (publication.description || publication.a11y_accessibilitySummary) {

            const textSanitize = publication.description ?
                DOMPurify.sanitize(publication.description).replace(/font-size:/g, "font-sizexx:") :
                "";

            const textSanitize_a11y = publication.a11y_accessibilitySummary ?
                DOMPurify.sanitize(convertMultiLangStringToString(translator, publication.a11y_accessibilitySummary)).replace(/font-size:/g, "font-sizexx:") :
                "";

            return (
                <>
                    <div className={stylesGlobal.heading}>
                        <h3>{__("catalog.description")}</h3>
                    </div>
                    {
                        publication.description ?
                        (
                        <div className={classNames(stylesBlocks.block_line, stylesBlocks.description_see_more)}>
                            <div
                                ref={this.descriptionWrapperRef}
                                className={classNames(
                                    stylesBookDetailsDialog.descriptionWrapper,
                                    this.state.needSeeMore && stylesGlobal.mb_30,
                                    this.state.needSeeMore && stylesBookDetailsDialog.hideEnd,
                                    this.state.seeMore && stylesBookDetailsDialog.seeMore,
                                )}
                            >
                                <div
                                    ref={this.descriptionRef}
                                    className={stylesBookDetailsDialog.allowUserSelect}
                                    dangerouslySetInnerHTML={{__html: textSanitize}}
                                >
                                </div>
                            </div>
                            {
                                this.state.needSeeMore &&
                                <button aria-hidden className={stylesButtons.button_see_more} onClick={this.toggleSeeMore}>
                                    {
                                        this.state.seeMore
                                            ? __("publication.seeLess")
                                            : __("publication.seeMore")
                                    }
                                </button>
                            }
                        </div>
                        )
                        : <></>
                    }
                    {
                        publication.a11y_accessibilitySummary ?
                        (
                        <div className={classNames(stylesBlocks.block_line, stylesBlocks.description_see_more)}>
                            <div
                                ref={this.descriptionWrapperRef_a11y}
                                className={classNames(
                                    stylesBookDetailsDialog.descriptionWrapper,
                                    this.state.needSeeMore_a11y && stylesGlobal.mb_30,
                                    this.state.needSeeMore_a11y && stylesBookDetailsDialog.hideEnd,
                                    this.state.seeMore_a11y && stylesBookDetailsDialog.seeMore,
                                )}
                            >
                                <div
                                    ref={this.descriptionRef_a11y}
                                    className={stylesBookDetailsDialog.allowUserSelect}
                                    dangerouslySetInnerHTML={{__html: textSanitize_a11y}}
                                >
                                </div>
                            </div>
                            {
                                this.state.needSeeMore_a11y &&
                                <button aria-hidden className={stylesButtons.button_see_more} onClick={this.toggleSeeMore_a11y}>
                                    {
                                        this.state.seeMore_a11y
                                            ? __("publication.seeLess")
                                            : __("publication.seeMore")
                                    }
                                </button>
                            }
                        </div>
                        )
                        : <></>
                    }
                </>
            );
        }

        return (<></>);
    }

    private needSeeMoreButton = () => {
        if (!this.descriptionWrapperRef?.current || !this.descriptionRef?.current) {
            return;
        }
        const need = this.descriptionWrapperRef.current.offsetHeight < this.descriptionRef.current.offsetHeight;
        this.setState({ needSeeMore: need });
    };

    private toggleSeeMore = () =>
        this.setState({
            seeMore: !this.state.seeMore,
        });

    private needSeeMoreButton_a11y = () => {
        if (!this.descriptionWrapperRef_a11y?.current || !this.descriptionRef_a11y?.current) {
            return;
        }
        const need = this.descriptionWrapperRef_a11y.current.offsetHeight < this.descriptionRef_a11y.current.offsetHeight;
        this.setState({ needSeeMore_a11y: need });
    };

    private toggleSeeMore_a11y = () =>
        this.setState({
            seeMore_a11y: !this.state.seeMore_a11y,
        });
}
