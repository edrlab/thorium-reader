// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { Link, RouteComponentProps } from "react-router-dom";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { PublicationView } from "readium-desktop/common/views/publication";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import { PublicationCard } from "readium-desktop/renderer/components/publication";

import classNames = require("classnames");

interface OpdsEntryProps extends RouteComponentProps {
    entry?: any;
    publications?: PublicationView[];
}

interface OpdsEntryState {
    isExtended: boolean;
}

export class OpdsDetails extends React.Component<OpdsEntryProps, OpdsEntryState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            isExtended: false,
        };

        this.extendButtonClick = this.extendButtonClick.bind(this);
    }
    public render(): React.ReactElement<{}>  {
        const { entry, publications } = this.props;
        if (!entry || !publications) {
            return <></>;
        }
        return (
            <>
                <div className={styles.flux_infos}>
                    <button onClick={this.extendButtonClick}>
                        <span className={styles.flux_title}>{entry.name}</span>
                        <span className={styles.flux_subtitle}>{entry.count} livres</span>
                    </button>
                    <Link
                        className={styles.flux_image}
                        to={"catalogs/" + (this.props.match.params as any).opdsId + "/" + entry.name}
                        >
                            <SVG svg={ArrowIcon} aria-hidden="true"/>
                    </Link>
                </div>
                { this.state.isExtended &&
                    <Slider
                        content={
                            publications.map((pub) =>
                                <PublicationCard
                                    key={pub.identifier}
                                    publication={pub}
                                />,
                            )
                        }
                        className={styles.flux_slider}
                    />
                }
            </>
        );
    }

    private extendButtonClick() {
        this.setState({isExtended: !this.state.isExtended});
    }
}

export default withApi(
    OpdsDetails,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findAll",
                resultProp: "publications",
                onLoad: true,
            },
        ],
    },
);
