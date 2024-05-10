// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesSlider from "readium-desktop/renderer/assets/styles/components/slider.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import PublicationCard from "readium-desktop/renderer/library/components/publication/PublicationCard";
import Slider from "readium-desktop/renderer/library/components/utils/Slider";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

import AboutThoriumButton from "./AboutThoriumButton";
import NoPublicationInfo from "./NoPublicationInfo";
// import SortMenu from "./SortMenu";
// import TagLayout from "./TagLayout";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";

// const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    catalogEntries: CatalogEntryView[];
    tags?: string[];
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    tabTags: string[];
    status: SortStatus;
    versionInfo: boolean;
}

enum SortStatus {
    Count,
    Alpha,
}

const EntrySection = ({entry, entryIndex}: {entry: CatalogEntryView, entryIndex: number}) => {
    const [__] = useTranslator();
    let title = "";

    switch (entry.id) {
        case "lastAdditions":
            title = __("catalog.entry.lastAdditions");
            break;
        case "continueReading":
            title = __("catalog.entry.continueReading");
            break;
        case "continueReadingAudioBooks":
            title = __("catalog.entry.continueReadingAudioBooks");
            break;
        case "continueReadingDivina":
            title = __("catalog.entry.continueReadingDivina");
            break;
        case "continueReadingPdf":
            title = __("catalog.entry.continueReadingPdf");
            break;
    }

    return (
        <section key={entryIndex} style={{marginBottom: "0", marginTop: entry.id === "continueReading" ? "0" : "64px"}} className={entry.id === "lastAdditions" ? stylesSlider.continue_reading : stylesSlider.home_section}>
                <h2>{title}</h2>
            {
                <Slider
                    className={classNames(stylesSlider.slider)}
                    content={entry.publicationViews.map((pub: any) =>
                        <PublicationCard
                            key={pub.identifier}
                            publicationViewMaybeOpds={pub}
                            isReading={entry.id === "continueReading" ? true : false}
                        />,
                    )}
                />
            }

        </section>
    );
};

class CatalogGridView extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            tabTags: this.props.tags ? this.props.tags.slice() : [],
            status: SortStatus.Count,
            versionInfo: true,
        };
        this.sortByAlpha = this.sortByAlpha.bind(this);
        this.sortbyCount = this.sortbyCount.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (this.props.tags !== oldProps.tags) {
            const { status } = this.state;
            switch (status) {
                case SortStatus.Count:
                    this.sortbyCount();
                    break;
                case SortStatus.Alpha:
                    this.sortByAlpha();
                    break;
            }
        }
    }

    public render(): React.ReactElement<{}> {
        const catalogEntriesIsEmpty = this.props.catalogEntries.filter(
            (entry) => entry.totalCount > 0,
        ).length === 0;

        return (
            <>
                {
                    this.props.catalogEntries.map((entry, entryIndex: number) =>
                            entry.totalCount > 0
                                ? (
                                    <EntrySection entry={entry} entryIndex={entryIndex} key={entryIndex} />
                                )
                                : <div
                                    key={entryIndex}
                                    aria-hidden="true"
                                    className={stylesGlobal.d_none}
                                >
                                </div>,
                    )
                }
                {
                    this.state.tabTags.length === 0 && catalogEntriesIsEmpty
                        ? <NoPublicationInfo />
                        : <></>
                }
                <AboutThoriumButton />
            </>
        );
    }

    private sortbyCount() {
        const { tags } = this.props;
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        const tabTags = tags.sort((a, b) => {
            if (a < b) {
                return (1);
            } else if (a > b) {
                return (-1);
            }
            return (0);
        });
        this.setState({
            status: SortStatus.Count,
            tabTags,
        });
    }

    private sortByAlpha() {
        const { tags } = this.props;
        // WARNING: .sort() is in-place same-array mutation! (not a new array)
        const tabTags = tags.sort((a, b) => {
            if (a > b) {
                return (1);
            } else if (a < b) {
                return (-1);
            }
            return (0);
        });
        this.setState({
            status: SortStatus.Alpha,
            tabTags,
        });
    }

}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    newVersionURL: state.versionUpdate.newVersionURL,
    newVersion: state.versionUpdate.newVersion,
});

export default connect(mapStateToProps)(withTranslator(CatalogGridView));
