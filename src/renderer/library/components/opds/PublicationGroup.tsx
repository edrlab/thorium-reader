// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IOpdsGroupView } from "readium-desktop/common/views/opds";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import PublicationCard from "../publication/PublicationCard";
import Slider from "../utils/Slider";
import Entry from "./Entry";
import EntryList from "./EntryList";

interface IProps {
    group: IOpdsGroupView;
    level: number;
    alwaysVisible?: boolean;
    busy?: boolean;
    contentClassName?: string;
    placeholder?: React.ReactNode;
}

export const PublicationGroup: React.FC<IProps> = ({
    group, level, alwaysVisible = false, busy, contentClassName, placeholder,
}) => {
    const showPublications = group.publications?.length > 0;

    return <section aria-label={group.selfLink.title} aria-busy={busy}>
        {alwaysVisible || showPublications ?
            <div className={stylesGlobal.heading_link}>
                {group.selfLink.url ? <Entry level={level} entry={group.selfLink} />
                    : <h3>{group.selfLink.title}</h3>}
            </div> : <></>}
        {group.navigation ? <EntryList entries={group.navigation} /> : <></>}
        <div className={contentClassName}>
            {showPublications ?
                <Slider resetSliderPosition={false} content={group.publications.map((publication, index) =>
                    <PublicationCard key={`${publication.workIdentifier || publication.documentTitle}-${index}`}
                        publicationViewMaybeOpds={publication} isOpds={true} />,
                )} /> : placeholder}
        </div>
    </section>;
};
