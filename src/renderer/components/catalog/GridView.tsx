// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

import { RouteComponentProps } from "react-router-dom";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import Slider from "readium-desktop/renderer/components/utils/Slider";
import AddEntryForm from "./AddEntryForm";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

interface GridViewProps extends RouteComponentProps {
    catalogEntries: CatalogEntryView[];
}

export default class GridView extends React.Component<GridViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                { this.props.catalogEntries.map((entry, i: number) => {
                        return (
                            <section key={ i }>
                                <div className={ styles.title }>
                                    <h1>{ entry.title }</h1>
                                </div>
                                <Slider
                                    className={ styles.slider }
                                    content={ entry.publications.map((pub) =>
                                        <PublicationCard
                                            key={ pub.identifier }
                                            publication={ pub }
                                            menuContent={ CatalogMenu }
                                        />,
                                    )}
                                />
                            </section>
                        );
                })}
                <AddEntryForm />
            </>
        );
    }
}
