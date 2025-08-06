// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { customizationActions, historyActions, readerActions } from "readium-desktop/common/redux/actions";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeEventChannel,
    getOpdsNewCatalogsStringUrlChannel,
    getOpenFileFromCliChannel, getOpenTitleFromCliChannel,
} from "readium-desktop/main/event";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put, spawn } from "redux-saga/effects";
import { call as callTyped, take as takeTyped, select as selectTyped, put as putTyped } from "typed-redux-saga/macro";
import { opdsApi } from "./api";
import { browse } from "./api/browser/browse";
import { addFeed } from "./api/opds/feed";

import { importFromFs, importFromLink } from "./api/publication/import";
import { search } from "./api/publication/search";
import { appActivate } from "./win/library";
import { getAndStartCustomizationWellKnownFileWatchingEventChannel } from "./getEventChannel";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { customizationPackageProvisioningAccumulator, customizationWellKnownFolder } from "readium-desktop/main/customization/provisioning";

// Logger
const debug = debug_("readium-desktop:main:saga:event");

export function saga() {
    return all([
        spawn(function*() {

            const chan = getAndStartCustomizationWellKnownFileWatchingEventChannel(customizationWellKnownFolder);

            while (true) {

                try {
                    const packageAbsolutePath = yield* takeTyped(chan);

                    const customizationState = yield* selectTyped((state: ICommonRootState) => state.customization);

                    const packagesArray = yield* callTyped(() => customizationPackageProvisioningAccumulator(customizationState.provision, packageAbsolutePath));
                    yield* putTyped(customizationActions.provisioning.build(customizationState.provision, packagesArray));

                    // TODO: how to warn user of potentially a new version of the packages id, we have to put a diff between version for a same id !
                    // And mostly a technical issue, how to update the view with the update. package streamer follow a package id 
                    

                } catch (e) {

                    debug("ERROR to importFromFs and to open the publication");
                    debug(e);
                }
            }


        }),
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

                    const feed = yield* callTyped(opdsApi.addFeed, { title : url, url});
                    if (feed) {

                        yield* callTyped(appActivate);

                        debug("Feed added ", feed);
                        debug("Open in library catalogs");
                        // open the feed in libraryWindow
                        yield put(historyActions.pushFeed.build(feed));
                    }

                } catch (e) {

                    debug("ERROR to importFromLink and to open the publication");
                    debug(e);
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
