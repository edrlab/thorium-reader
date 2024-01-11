// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import CatalogMenu from "readium-desktop/renderer/library/components/publication/menu/CatalogMenu";
import PublicationListElement from "readium-desktop/renderer/library/components/publication/PublicationListElement";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import AboutThoriumButton from "./AboutThoriumButton";

import NoPublicationInfo from "./NoPublicationInfo";
import { DisplayType, IRouterLocationState } from "../../routing";

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

class CatalogListView extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const catalogEntriesIsEmpty = this.props.catalogEntries.filter((entry) => {
            return entry.totalCount > 0;
        }).length === 0;
        return (
            <>
            {
                this.props.catalogEntries.map((entry, entryIndex: number) => {
                    return entry.totalCount > 0 ? (
                        <section key={ entryIndex }>
                        {
                            <div className={stylesGlobal.heading}>
                                <h2>{ entry.id }</h2>

                                <Link
                                    className={stylesButtons.button_primary_small}
                                    to={{
                                        ...this.props.location,
                                        pathname: "/library/search/all",
                                    }}
                                    state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                                    title={`${this.props.__("header.allBooks")} (${entry.id})`}
                                >
                                    {this.props.__("header.allBooks")}
                                </Link>
                            </div>
                        }
                        {
                            <ul className={stylesGlobal.p_0}>
                                { entry.publicationViews.map((pub, i: number) => {
                                    return (
                                        <li className={stylesPublications.publication_list_wrapper} key={ i }>
                                            <PublicationListElement
                                                publicationViewMaybeOpds={pub}
                                                menuContent={<CatalogMenu publicationView={pub}/>}
                                            />
                                        </li>
                                    );
                                })
                                }
                            </ul>
                        }
                        </section>
                    ) : <div key={ entryIndex } aria-hidden="true" className={stylesGlobal.d_none}></div>;
            })
            }
            { catalogEntriesIsEmpty &&
                <NoPublicationInfo />
            }
            <AboutThoriumButton />
            </>
        );
    }

}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(CatalogListView));
