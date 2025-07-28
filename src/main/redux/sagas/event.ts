// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { historyActions, readerActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeEventChannel,
    getOpdsNewCatalogsStringUrlChannel,
    getOpenFileFromCliChannel, getOpenTitleFromCliChannel,
} from "readium-desktop/main/event";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put, spawn } from "redux-saga/effects";
import { call as callTyped, take as takeTyped } from "typed-redux-saga/macro";
// import { opdsApi } from "./api"; // Removed: using direct import of addFeed instead
import { browse } from "./api/browser/browse";
import { addFeed } from "./api/opds/feed";

import { importFromFs, importFromLink } from "./api/publication/import";
import { search } from "./api/publication/search";
import { appActivate } from "./win/library";

// Logger
const debug = debug_("readium-desktop:main:saga:event");

export function saga() {
    return all([
        spawn(function*() {

            const chan = getOpenFileFromCliChannel();

            while (true) {

                try {
                    const filePath = yield* takeTyped(chan);

                    const pubViewArray = yield* callTyped(importFromFs, filePath);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);
                        yield put(readerActions.openRequest.build(pubView.identifier));
                        yield put(readerActions.detachModeRequest.build());


                    }

                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenTitleFromCliChannel();

            while (true) {

                try {
                    const title = yield* takeTyped(chan);

                    const pubViewArray = yield* callTyped(search, title);
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to search the title in db and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenUrlWithThoriumSchemeEventChannel();

            while (true) {

                try {
                    const url = yield* takeTyped(chan);

                    const link: IOpdsLinkView = {
                        url,
                    };

                    const pubViewArray = (yield* callTyped(importFromLink, link)) as PublicationView | PublicationView[];
                    const pubView = Array.isArray(pubViewArray) ? pubViewArray[0] : pubViewArray;
                    if (pubView) {

                        yield* callTyped(appActivate);

                        yield put(readerActions.openRequest.build(pubView.identifier));
                    }

                } catch (e) {

                    debug("ERROR to importFromLink and to open the publication");
                    debug(e);
                }
            }

        }),
        spawn(function*() {
            const chan = getOpenUrlWithOpdsSchemeEventChannel();

            while (true) {

                try {
                    const url = yield* takeTyped(chan);
                    debug("Processing OPDS URL from scheme:", url);

                    // Extract a better title from the URL if possible
                    let title: string;
                    try {
                        const urlObj = new URL(url);
                        title = urlObj.hostname || urlObj.pathname.split("/").filter(Boolean).pop() || url;
                    } catch (urlError) {
                        debug("Failed to parse URL for title, using URL as title:", urlError);
                        title = url;
                    }

                    debug("Adding OPDS feed with title:", title, "and URL:", url);
                    const feed = yield* callTyped(addFeed, { title, url});
                    
                    if (feed) {
                        debug("Feed successfully added:", feed);

                        // Ensure library window is active before navigating
                        yield* callTyped(appActivate);

                        debug("Navigating to feed in library");
                        // open the feed in libraryWindow
                        yield put(historyActions.pushFeed.build(feed));
                    } else {
                        debug("Failed to add OPDS feed - no feed returned");
                    }

                } catch (e) {
                    debug("ERROR processing OPDS URL:", e);
                }
            }

        }),
        spawn(function*() {

            const chan = getOpdsNewCatalogsStringUrlChannel();

            while (true) {

                try {
                    const catalogsUrl = yield* takeTyped(chan);

                    const u = new URL(catalogsUrl);
                    if (!u) continue;

                    debug("CATALOGS URL CHANNEL ", catalogsUrl);
                    debug("start to import each feed from the 'catalogs' key");

                    // call api opds/browse in saga

                    const httpOpdsResult = yield* callTyped(browse, catalogsUrl);

                    if (httpOpdsResult.isFailure) continue;

                    const catalogs = httpOpdsResult.data?.opds?.catalogs;

                    if (!Array.isArray(catalogs)) continue;

                    for (const feed of catalogs) {

                        try {

                            const feedUrl = feed.catalogLinkView[0].url;
                            const u = new URL(feedUrl);
                            if (!u) continue;

                            debug("import the feed", feed.documentTitle, feedUrl);

                            // addFeed has a security to not duplicate a feed
                            yield* callTyped(addFeed, {
                                title: feed.documentTitle,
                                url: feedUrl,
                            });

                        } catch (e) {
                            debug("loop into catalogs list: Wrong feed format:", feed);
                            debug(e);
                        }

                    }

                } catch (e) {

                    debug("ERROR to import an opds catalogs from an OPDSFeed");
                    debug(e);
                }
            }

        }),
    ]);
}
