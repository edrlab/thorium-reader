// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useDispatch } from "react-redux";
import { IOpdsFeedView, IOpdsGroupView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { authActions, customizationActions, opdsActions } from "readium-desktop/common/redux/actions";
import { subscribeToAction } from "readium-desktop/renderer/common/redux/middleware/actionSubscriber";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import Loader from "readium-desktop/renderer/common/components/Loader";
import { apiAction } from "readium-desktop/renderer/library/apiAction";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesBookshelf from "readium-desktop/renderer/assets/styles/components/bookshelf.scss";
import { PublicationGroup } from "./PublicationGroup";

interface IProps {
    catalogId: string;
    url: string;
}

export const BookshelfCarousel: React.FC<IProps> = ({ catalogId, url }) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const [attempt, setAttempt] = React.useState(0);
    const [status, setStatus] = React.useState<"signedOut" | "loading" | "ready" | "error">("loading");
    const [feed, setFeed] = React.useState<IOpdsFeedView>();
    const [publications, setPublications] = React.useState<IOpdsPublicationView[]>([]);

    React.useEffect(() => {
        let active = true;
        let currentFeed: IOpdsFeedView;
        setStatus("loading");
        setFeed(undefined);
        setPublications([]);
        const signedOut = () => {
            active = false;
            setPublications([]);
            setFeed((previous) => previous ? { ...previous, authentified: false } : undefined);
            setStatus("signedOut");
        };
        const refresh = () => {
            active = false;
            setAttempt((previous) => previous + 1);
        };
        const unsubscribe = [
            subscribeToAction(authActions.logout.ID, (action) => {
                if (!currentFeed || (action as authActions.logout.TAction).payload.feedUrl === currentFeed.url) {
                    signedOut();
                }
            }),
            subscribeToAction(authActions.wipeData.ID, signedOut),
            subscribeToAction(authActions.done.ID, refresh),
            subscribeToAction(opdsActions.refresh.ID, refresh),
        ];
        const load = async () => {
            // A bookshelf relation alone does not establish an authenticated session.
            const feeds = await apiAction("opds/findAllFeeds");
            if (!active) return;
            currentFeed = feeds.find((candidate) => candidate.identifier === catalogId);
            setFeed(currentFeed);
            if (!currentFeed?.authentified) {
                setStatus("signedOut");
                return;
            }
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
            if (active) setStatus("error");
        });
        // Ignore responses after logout, navigation, refresh, or a retry.
        return () => {
            active = false;
            unsubscribe.forEach((stop) => stop());
        };
    }, [catalogId, url, attempt]);

    const group: IOpdsGroupView = {
        selfLink: { title: __("opds.bookshelfTitle"), url },
        publications,
    };
    const placeholder = status === "loading" ? <div className={stylesBookshelf.bookshelf_status}><Loader /></div>
        : status === "signedOut" && feed?.authenticationUrl ?
        <div className={stylesBookshelf.bookshelf_status}>
            <button className={stylesButtons.button_primary} onClick={() => {
                dispatch(customizationActions.triggerOpdsAuth.build(feed.url, feed.authenticationUrl));
            }}>
                {__("catalog.login")}
            </button>
        </div>
        : status === "error" ?
        <div className={stylesBookshelf.bookshelf_status} role="status">
            <p>{__("opds.network.error")}</p>
            <button className={stylesButtons.button_secondary_blue} onClick={() => setAttempt((previous) => previous + 1)}>
                {__("catalog.opds.auth.retry")}
            </button>
        </div>
        : <div className={stylesBookshelf.bookshelf_status} role="status">
            <p>{__("opds.bookshelfEmpty")}</p>
            <p>{__("opds.bookshelfEmptyDescription")}</p>
        </div>;

    return <PublicationGroup group={group} level={3} alwaysVisible={true}
        busy={status === "loading"} contentClassName={stylesBookshelf.bookshelf_content}
        placeholder={placeholder} />;
};
