// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as debug_ from "debug";
import DOMPurify from "dompurify";
import * as React from "react";
import { I18nTyped, Translator } from "readium-desktop/common/services/translator";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import * as stylePublication from "readium-desktop/renderer/assets/styles/publicationInfos.scss";
// import * as stylesBlocks from "readium-desktop/renderer/assets/styles/components/blocks.css";
// import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
// import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import SVG from "../../SVG";
import * as ChevronDown from "readium-desktop/renderer/assets/icons/chevron-down.svg";
import * as ChevronUp from "readium-desktop/renderer/assets/icons/chevron-up.svg";

// Logger
const debug = debug_("readium-desktop:renderer:publicationInfoDescription");
debug("_");

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps {
    publicationViewMaybeOpds: TPublication;
    __: I18nTyped;
    translator: Translator;
}

interface IState {
    seeMore: boolean;
    needSeeMore: boolean;
}

export default class PublicationInfoDescription extends React.Component<IProps, IState> {

    private descriptionWrapperRef: React.RefObject<HTMLDivElement>;
    private descriptionRef: React.RefObject<HTMLParagraphElement>;

    constructor(props: IProps) {
        super(props);

        this.descriptionWrapperRef = React.createRef<HTMLDivElement>();
        this.descriptionRef = React.createRef<HTMLParagraphElement>();

        this.state = {
            seeMore: false,
            needSeeMore: false,
        };
    }

    public componentDidMount() {
        setTimeout(this.needSeeMoreButton, 500);
    }

    public componentDidUpdate(prevProps: IProps) {

        if (this.props.publicationViewMaybeOpds !== prevProps.publicationViewMaybeOpds) {
            setTimeout(this.needSeeMoreButton, 500);
        }
    }

    public render() {
        const { publicationViewMaybeOpds: { description }, __ } = this.props;

        if (!description) return <></>;
        const textSanitize = DOMPurify.sanitize(description).replace(/font-size:/g, "font-sizexx:");
        if (!textSanitize) return <></>;
        return (
            <>
                <div className={stylePublication.publicationInfo_heading}>
                    <h4>{__("catalog.description")}</h4>
                </div>
                <div className={stylePublication.publicationInfo_description_bloc}>
                    <div
                        ref={this.descriptionWrapperRef}
                        className={classNames(
                            stylesBookDetailsDialog.descriptionWrapper,
                            this.state.needSeeMore && stylesBookDetailsDialog.hideEnd,
                            this.state.seeMore && stylesBookDetailsDialog.seeMore,
                        )}
                    >
                        <div
                            ref={this.descriptionRef}
                            className={stylesBookDetailsDialog.allowUserSelect}
                            dangerouslySetInnerHTML={{ __html: textSanitize }}
                        >
                        </div>
                    </div>
                    {
                        this.state.needSeeMore &&
                        <button aria-hidden className={stylePublication.publicationInfo_description_bloc_seeMore} onClick={this.toggleSeeMore}>
                            <SVG ariaHidden svg={this.state.seeMore ? ChevronUp : ChevronDown} />
                            {
                                this.state.seeMore
                                    ? __("publication.seeLess")
                                    : __("publication.seeMore")
                            }
                        </button>
                    }
                </div>
            </>
        );
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

}
