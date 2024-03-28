// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.scss";
import CatalogMenu from "readium-desktop/renderer/library/components/publication/menu/CatalogMenu";
import OpdsMenu from "readium-desktop/renderer/library/components/publication/menu/OpdsMenu";
import PublicationListElement from "readium-desktop/renderer/library/components/publication/PublicationListElement";

type NormalOrOpdsPublicationView = PublicationView | IOpdsPublicationView;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    normalOrOpdsPublicationViews: NormalOrOpdsPublicationView[] | undefined;
    isOpdsView?: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

export class ListView extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {

        return (
            <>
            {
                <ul className={stylesGlobal.p_0}>
                    { this.props.normalOrOpdsPublicationViews?.map((pub, i: number) => {
                        return (
                            <li className={stylesPublications.publication_list_wrapper} key={ i }>
                                <PublicationListElement
                                    publicationViewMaybeOpds={pub}
                                    menuContent={
                                        this.props.isOpdsView ?
                                        <OpdsMenu opdsPublicationView={pub as IOpdsPublicationView}/> :
                                        <CatalogMenu publicationView={pub as PublicationView}/>
                                    }
                                    isOpds={this.props.isOpdsView}
                                />
                            </li>
                        );
                    })}
                </ul>
            }
            </>
        );
    }
}
