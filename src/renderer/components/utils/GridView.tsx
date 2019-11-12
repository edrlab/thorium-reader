// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as styles from "readium-desktop/renderer/assets/styles/publicationView.css";
import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

type NormalOrOpdsPublicationView = PublicationView | OpdsPublicationView;

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    normalOrOpdsPublicationViews: NormalOrOpdsPublicationView[];
    isOpdsView?: boolean;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

export class GridView extends React.Component<IProps, undefined> {
    private ref: HTMLDivElement;

    constructor(props: IProps) {
        super(props);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (this.props.normalOrOpdsPublicationViews !== oldProps.normalOrOpdsPublicationViews) {
            this.scrollToTop();
        }
    }

    public render(): React.ReactElement<{}> {
        const { isOpdsView } = this.props;

        return (
            <div ref={(ref) => this.ref = ref} className={styles.card_wrapper}>
                {this.props.normalOrOpdsPublicationViews.map((pub, index) =>
                    <PublicationCard
                        key={-index}
                        publicationViewMaybeOpds={pub}
                        isOpds={isOpdsView}
                    />,
                )}
                {[...Array(6).keys()].map((__, index) => {
                    return <div key={index} className={styles.card_substitute}></div>;
                })}
            </div>
        );
    }

    private scrollToTop() {
        this.ref.scrollIntoView();
    }
}
