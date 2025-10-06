// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/common/components/hoc/translator";
import {
    apiClean, apiDispatch,
} from "readium-desktop/renderer/common/redux/api/api";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { Dispatch } from "redux";

import CatalogGridView from "./GridView";
import PublicationAddButton from "./PublicationAddButton";
import {
    ensureKeyboardListenerIsInstalled, registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { IRouterLocationState, dispatchHistoryPush } from "../../routing";
import { keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import Slider from "../utils/Slider";
import PublicationCard from "../publication/PublicationCard";
import * as stylesSlider from "readium-desktop/renderer/assets/styles/components/slider.scss";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class Catalog extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);

        this.onKeyboardFocusSearch = this.onKeyboardFocusSearch.bind(this);
    }

    componentDidMount(): void {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();
    }

    componentWillUnmount(): void {
        this.unregisterAllKeyboardListeners();
    }

    componentDidUpdate(oldProps: Readonly<IProps>): void {
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __, catalog, tags } = this.props;

        const secondaryHeader = <span style={{ display: "flex", justifyContent: "end", alignItems: "end", height: "53px", borderBottom: "1px solid var(--color-verylight-grey-alt)", paddingBottom: "30px" }}><PublicationAddButton /></span>;

        const customizationProfileProvision = this.props.customizationProvision.find(({id}) => this.props.customizationProfileId === id);
        return (
            <LibraryLayout
                title={__("header.homeTitle")}
                secondaryHeader={secondaryHeader}
            >
                {
                    catalog?.entries
                    && <CatalogGridView
                        catalogEntries={catalog.entries}
                        tags={tags}
                    />
                }
                {
                    customizationProfileProvision?.opdsPublicationView?.length ?
                        <section key={"customization-publications"}
                            style={{ marginBottom: "0", marginTop: "64px" }}
                            className={stylesSlider.continue_reading}>
                            <h2>{this.props.__("catalog.customization.publications")}</h2>
                            {
                                <Slider
                                    resetSliderPosition={false}
                                    className={classNames(stylesSlider.slider)}
                                    content={customizationProfileProvision.opdsPublicationView.map((pub, pubIndex) =>
                                        <PublicationCard
                                            key={`customization-publications-${pubIndex}`}
                                            publicationViewMaybeOpds={pub}
                                            isOpds={true}
                                            isReading={false}
                                        />,
                                    )}
                                />
                            }

                        </section>
                        : <></>
                }
            </LibraryLayout>
        );
    }

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
        this.props.historyPush({
            ...this.props.location,
            search: "?focus=search",
            pathname: "/library",

        }, this.props.location.state as IRouterLocationState);
    };
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    catalog: state.publication.catalog,
    tags: state.publication.tag,
    keyboardShortcuts: state.keyboard.shortcuts,
    locale: state.i18n.locale, // refresh

    customizationProvision: state.customization.provision,
    customizationProfileId: state.customization.activate.id,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    api: apiDispatch(dispatch),
    apiClean: apiClean(dispatch),
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Catalog));
