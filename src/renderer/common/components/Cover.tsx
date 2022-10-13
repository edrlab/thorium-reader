// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as React from "react";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { TPublication } from "readium-desktop/common/type/publication.type";
import * as stylesImages from "readium-desktop/renderer/assets/styles/components/images.css";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.css";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";

import { TranslatorProps, withTranslator } from "./hoc/translator";
import { PublicationView } from "readium-desktop/common/views/publication";
import { convertMultiLangStringToString, langStringIsRTL } from "readium-desktop/renderer/common/language-string";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: TPublication;
    coverType?: "cover" | "thumbnail" | undefined;
    onClick?: () => void;
    onKeyPress?: (e: React.KeyboardEvent<HTMLImageElement>) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    url: string,
    flag: boolean,
}

class Cover extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            url: "",
            flag: false,
        };

        this.imageOnError = this.imageOnError.bind(this);
    }

    public componentDidMount(): void {

        const { cover } = this.props.publicationViewMaybeOpds;
        if (cover) {
            const coverUrl = cover.coverUrl || cover.coverLinks[0]?.url;
            const thumbnailUrl = cover.coverUrl || cover.thumbnailLinks[0]?.url;

            let defaultUrl: string;
            if (this.props.coverType === "cover") {
                defaultUrl = coverUrl || thumbnailUrl;
            } else {
                defaultUrl = thumbnailUrl || coverUrl;
            }

            this.setState({url: defaultUrl});
        }
    }

    public render()  {
        const { publicationViewMaybeOpds, translator } = this.props;
        const { cover } = publicationViewMaybeOpds;

        if (!cover) {

            const authors = formatContributorToString(publicationViewMaybeOpds.authors, translator);

            let colors = publicationViewMaybeOpds.customCover;
            if (!colors) {
                colors = RandomCustomCovers[0];
            }
            const backgroundStyle: React.CSSProperties = {
                backgroundImage: `linear-gradient(${colors.topColor}, ${colors.bottomColor})`,
            };

            // publicationViewMaybeOpds.documentTitle
            const pubTitleLangStr = convertMultiLangStringToString(translator, (publicationViewMaybeOpds as PublicationView).publicationTitle || publicationViewMaybeOpds.documentTitle);
            const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
            const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
            const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

            return (
                <div style={backgroundStyle} className={stylesPublications.no_img_wrapper}>
                    <div className={stylesPublications.no_img}>
                        <p aria-hidden
                            dir={pubTitleIsRTL ? "rtl" : undefined}>
                            {pubTitleStr}
                        </p>
                        <p aria-hidden>{authors}</p>
                    </div>
                </div>
            );
        } else {
            return (
                <img
                    tabIndex={this.props.onKeyPress ? 0 : -1}
                    className={stylesImages.cover_img}
                    onClick={this.props.onClick}
                    onKeyPress={this.props.onKeyPress}
                    role="presentation"
                    alt={this.props.onKeyPress ? this.props.__("publication.cover.img") : ""}
                    aria-hidden={this.props.onKeyPress ? undefined : true}
                    src={this.state.url}
                    onError={this.imageOnError}
                />
            );
        }
    }

    private imageOnError() {

        if (this.state.flag) return ;

        const b64 = Buffer.from(this.state.url).toString("base64");
        const url = "opds-media://" + b64;
        this.setState({url, flag: true});
    }
}

export default withTranslator(Cover);
