// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link } from "react-router-dom";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import Loader from "readium-desktop/renderer/common/components/Loader";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import PublicationCard from "../publication/PublicationCard";
import Slider from "../utils/Slider";

interface IProps {
    catalogId: string;
    url: string;
}

export const BookshelfCarousel: React.FC<IProps> = ({ catalogId, url }) => {
    const [__] = useTranslator();
    const headingId = React.useId();
    const [attempt, setAttempt] = React.useState(0);
    const [status, setStatus] = React.useState<"hidden" | "loading" | "ready" | "error">("hidden");
    const [publications, setPublications] = React.useState<IOpdsPublicationView[]>([]);

    React.useEffect(() => {
        let active = true;
        let authenticated = false;
        setStatus("hidden");
        setPublications([]);
        const load = async () => {
            // A bookshelf relation alone does not establish an authenticated session.
            const feeds = await apiAction("opds/findAllFeeds");
            if (!active || !feeds.some((feed) => feed.identifier === catalogId && feed.authentified)) return;
            authenticated = true;
            setStatus("loading");
            // apiAction allocates an independent request ID and cleans up the API result.
            const result = await apiAction("httpbrowser/browse", url);
            if (!active) return;
            if (!result.isSuccess || !result.data?.opds) {
                setStatus("error");
                return;
            }
            const opds = result.data.opds;
            setPublications([
                ...(opds.publications || []),
                ...(opds.groups?.flatMap((group) => group.publications || []) || []),
            ]);
            setStatus("ready");
        };
        load().catch(() => {
            if (active && authenticated) setStatus("error");
        });
        // Ignore responses after logout, navigation, refresh, or a retry.
        return () => { active = false; };
    }, [catalogId, url, attempt]);

    if (status === "hidden") return <></>;

    return <section aria-labelledby={headingId} aria-busy={status === "loading"}>
        <div className={stylesGlobal.heading_link}>
            <h3 id={headingId}>{__("opds.bookshelfTitle")}</h3>
            <Link to={buildOpdsBrowserRoute(catalogId, __("opds.shelf"), url, 3)}>
                {__("opds.bookshelfViewAll")}
            </Link>
        </div>
        {status === "loading" ? <Loader /> : status === "error" ?
            <div role="status">
                <p>{__("opds.network.error")}</p>
                <button className={stylesButtons.button_secondary_blue} onClick={() => setAttempt(attempt + 1)}>
                    {__("catalog.opds.auth.retry")}
                </button>
            </div>
            : publications.length ?
                <Slider resetSliderPosition={true} content={publications.map((publication, index) =>
                    <PublicationCard key={`${publication.workIdentifier || publication.documentTitle}-${index}`}
                        publicationViewMaybeOpds={publication} isOpds={true} />,
                )} />
                : <p role="status">{__("opds.empty")}</p>}
    </section>;
};
