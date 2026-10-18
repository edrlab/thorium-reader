// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import {
    catalogAnalyticsEvents,
    TCatalogAddAnalyticsOrigin,
} from "readium-desktop/common/analytics/catalog";
import { OpdsFeed } from "readium-desktop/common/models/opds";
import { IOpdsFeedView } from "readium-desktop/common/views/opds";
import { diMainGet } from "readium-desktop/main/di";
import { logCatalogAdd, logCatalogEvent } from "readium-desktop/main/analytics/catalog";
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { contentTypeisOpdsAuth, parseContentType } from "readium-desktop/utils/contentType";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, spawn as spawnTyped, put as putTyped } from "typed-redux-saga/macro";
import { opdsActions } from "readium-desktop/common/redux/actions";
import { findDeeplinkCatalog } from "readium-desktop/main/services/opdsCatalogUrl";
import { nativeImage } from "electron";
import { imageSize } from "image-size";
import { OPDS_FEED_ICON_DATA_URL_PREFIX, OPDS_FEED_ICON_SVG_DATA_URL_PREFIX } from "readium-desktop/common/models/opds";
import { getOpdsFeedIconUrl } from "readium-desktop/common/models/opds";

// Logger
const debug = debug_("readium-desktop:main#saga/api/opds/feed");

const OPDS_FEED_ICON_REQUEST_TIMEOUT = 2000;
const OPDS_FEED_ICON_MAX_BYTES = 1024 * 1024;
const OPDS_FEED_ICON_SIZE = 128;

const isSvgImage = (buffer: Buffer, contentType: string | undefined): boolean =>
    (contentType?.toLowerCase().includes("image/svg+xml") || buffer.toString(
        "utf8",
        0,
        Math.min(buffer.length, 4096),
    ).toLowerCase().includes("<svg"));

const getOpdsFeedIconImageSize = (iconBuffer: Buffer, iconUrl: string): { width: number; height: number } | undefined => {
    try {
        return imageSize(iconBuffer);
    } catch (e) {
        debug("OPDS feed icon size parsing failed", iconUrl, e);
        return undefined;
    }
};

const getOpdsFeedSvgIconDataUrl = (iconBuffer: Buffer, iconUrl: string): string | undefined => {
    const size = getOpdsFeedIconImageSize(iconBuffer, iconUrl);
    if (!size?.width || !size.height) {
        debug("OPDS feed SVG icon has invalid dimensions", iconUrl, size);
        return undefined;
    }
    if (size.width !== size.height) {
        debug("OPDS feed SVG icon is not square", iconUrl, size);
        return undefined;
    }

    return `${OPDS_FEED_ICON_SVG_DATA_URL_PREFIX}${iconBuffer.toString("base64")}`;
};

const normalizeOpdsFeedIcon = (iconImage: Electron.NativeImage, iconUrl: string): string | undefined => {
    const size = iconImage.getSize();
    if (!size.width || !size.height) {
        debug("OPDS feed icon has invalid dimensions", iconUrl, size);
    } else if (size.width !== size.height) {
        debug("OPDS feed icon is not square, resizing to common square size", iconUrl, size);
    }

    const resizedImage = iconImage.resize({
        height: OPDS_FEED_ICON_SIZE,
        quality: "best",
        width: OPDS_FEED_ICON_SIZE,
    });
    const resizedSize = resizedImage.getSize();
    if (resizedImage.isEmpty() || resizedSize.width !== OPDS_FEED_ICON_SIZE || resizedSize.height !== OPDS_FEED_ICON_SIZE) {
        debug("OPDS feed icon resize failed", iconUrl, resizedSize);
        return undefined;
    }

    const iconDataUrl = resizedImage.toDataURL({ scaleFactor: 1 });
    if (!iconDataUrl.startsWith(OPDS_FEED_ICON_DATA_URL_PREFIX)) {
        debug("OPDS feed icon PNG data URL conversion failed", iconUrl);
        return undefined;
    }

    return iconDataUrl;
};

export const downloadOpdsFeedIcon = async (iconUrl: string | undefined): Promise<string | undefined> => {
    if (!iconUrl) {
        return undefined;
    }

    try {
        const response = await httpGetWithAuth(false)(iconUrl, {
            headers: {
                accept: "image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.1",
            },
            size: OPDS_FEED_ICON_MAX_BYTES,
            timeout: OPDS_FEED_ICON_REQUEST_TIMEOUT,
        });
        if (!response.isSuccess || !response.response?.buffer) {
            debug("OPDS feed icon download failed", iconUrl, response.statusCode, response.statusMessage);
            return undefined;
        }

        const iconBuffer = await response.response.buffer();
        if (!iconBuffer.length || iconBuffer.length > OPDS_FEED_ICON_MAX_BYTES) {
            debug("OPDS feed icon invalid size", iconUrl, iconBuffer.length);
            return undefined;
        }

        if (isSvgImage(iconBuffer, response.contentType)) {
            // https://www.electronjs.org/docs/latest/api/native-image#nativeimagecreatefromdataurldataurl
            // SVG cannot be converted to PNG
            return getOpdsFeedSvgIconDataUrl(iconBuffer, iconUrl);
        }

        const iconImage = nativeImage.createFromBuffer(iconBuffer);
        if (iconImage.isEmpty()) {
            debug("OPDS feed icon could not be decoded", iconUrl);
            return undefined;
        }

        return normalizeOpdsFeedIcon(iconImage, iconUrl);
    } catch (e) {
        debug("OPDS feed icon download error", iconUrl, e);
        return undefined;
    }
};


const getCatalogAddAnalyticsOrigin = (
    data: OpdsFeed,
    origin?: TCatalogAddAnalyticsOrigin,
): TCatalogAddAnalyticsOrigin => {
    if (origin) {
        return origin;
    }

    return data.url.startsWith("apiapp://") ? "pnb" : "manual";
};

/*

    public async getFeed(identifier: string): Promise<IOpdsFeedView> {
        const doc = await this.opdsFeedRepository.get(identifier);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

    public async deleteFeed(identifier: string): Promise<void> {
        await this.opdsFeedRepository.delete(identifier);
    }

    public async findAllFeeds(): Promise<IOpdsFeedView[]> {
        const docs = await this.opdsFeedRepository.findAll();
        return docs.map((doc) => {
            return this.opdsFeedViewConverter.convertDocumentToView(doc);
        });
    }

    public async addFeed(data: OpdsFeed): Promise<IOpdsFeedView> {

        // ensures no duplicates (same URL ... but may be different titles)
        const opdsFeeds = await this.opdsFeedRepository.findAll();
        const found = opdsFeeds.find((o) => o.url === data.url);
        if (found) {
            return this.opdsFeedViewConverter.convertDocumentToView(found);
        }

        const doc = await this.opdsFeedRepository.save(data);
        return this.opdsFeedViewConverter.convertDocumentToView(doc);
    }

 */

export function* getFeed(identifier: string) {

    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");
    const opdsFeedRepository = diMainGet("opds-feed-repository");

    const doc = yield* callTyped(() => opdsFeedRepository.get(identifier));
    return yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc));
}

export function* deleteFeed(identifier: string) {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    yield* callTyped(() => opdsFeedRepository.delete(identifier));

    yield* spawnTyped(function*() {
        yield* callTyped(() => logCatalogEvent(catalogAnalyticsEvents.remove));
    });
}

export function* addFeed(
    data: OpdsFeed,
    origin?: TCatalogAddAnalyticsOrigin,
    iconUrl?: string,
): SagaGenerator<IOpdsFeedView> {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");

    // ensures no duplicates (same URL ... but may be different titles)
    const opdsFeeds = yield* callTyped(() => opdsFeedRepository.findAll());
    let found = opdsFeeds.find((o) => o.url === data.url);
    if (!found && origin === "deeplink") {
        const resolved = yield* callTyped(() => findDeeplinkCatalog(data.url, opdsFeeds));
        found = resolved.feed;
        data = { ...data, url: resolved.url };
    }
    if (found) {
        if (data.authenticationUrl && found.authenticationUrl !== data.authenticationUrl) {
            yield* callTyped(() => opdsFeedRepository.delete(found.identifier));
            const updated = yield* callTyped(() => opdsFeedRepository.save({
                ...found,
                authenticationUrl: data.authenticationUrl,
            }));
            yield* putTyped(opdsActions.refresh.build());
            return yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(updated));
        }
        return yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(found));
    }

    const icon = data.icon || (yield* callTyped(() => downloadOpdsFeedIcon(getOpdsFeedIconUrl(iconUrl))));
    const doc = yield* callTyped(() => opdsFeedRepository.save({ ...data, icon }));
    const view = yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc));

    // Discovery updates the saved feed, so it must start after the initial save.
    if (!data.authenticationUrl) {

        yield* spawnTyped(function* () {
            try {

                if (data.url.startsWith("apiapp://")) {
                    debug("find authenticationUrl API-APP Url not supported", data.url, "return;");
                    return;
                }

                const response = yield* callTyped(() => httpGetWithAuth(false)(data.url));
                const opdsFeedJson:any = yield* callTyped(() => response.response.json());
                const opdsFeed = TaJsonDeserialize(
                    opdsFeedJson,
                    OPDSFeed,
                );
                const opdsFeedView = opdsFeedViewConverter.convertOpdsFeedToView(opdsFeed, data.url);
                if (opdsFeedView) {
                    const candidates = [...(opdsFeedView.links?.authenticate || []), ...(opdsFeedView.links?.bookshelf || [])];
                    for (const bookshelf of candidates) {
                        try {
                            const responseBookshelf = yield* callTyped(() => httpGetWithAuth(false)(bookshelf.url));
                            const mimeType = parseContentType(responseBookshelf.contentType);
                            if (contentTypeisOpdsAuth(mimeType)) {
                                // link url found

                                const opdsFeeds = yield* callTyped(() => opdsFeedRepository.findAll());
                                const found = opdsFeeds.find((o) => o.url === data.url);
                                if (found) {
                                    yield* callTyped(() => opdsFeedRepository.delete(found.identifier));
                                    yield* callTyped(() => opdsFeedRepository.save({
                                        ...found,
                                        authenticationUrl: bookshelf.url,
                                    }));

                                    yield* putTyped(opdsActions.refresh.build());
                                    break;
                                }
                            }
                        } catch (e) {
                            debug(e);
                        }
                    }
                }
            } catch (e) {
                debug(e);
            }
        });
    }

    yield* spawnTyped(function*() {
        yield* callTyped(() => logCatalogAdd(getCatalogAddAnalyticsOrigin(data, origin)));
    });

    return view;
}

export function* updateFeed(
    identifier: string,
    data: OpdsFeed,
): SagaGenerator<IOpdsFeedView> {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");

    const previous = yield* callTyped(() => opdsFeedRepository.get(identifier));
    const isAddingFavorite = data.favorite === true && previous.favorite !== true;

    yield* callTyped(() => opdsFeedRepository.delete(identifier));
    const doc = yield* callTyped(() => opdsFeedRepository.save(data));
    const view = yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc));

    yield* spawnTyped(function*() {
        yield* callTyped(() => logCatalogEvent(catalogAnalyticsEvents.edit));
    });
    if (isAddingFavorite) {
        yield* spawnTyped(function*() {
            yield* callTyped(() => logCatalogEvent(catalogAnalyticsEvents.favorite));
        });
    }

    return view;
}

export function* setFeedFavorite(
    identifier: string,
    favorite: boolean,
): SagaGenerator<void> {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    const feed = yield* callTyped(() => opdsFeedRepository.get(identifier));

    if (favorite !== feed.favorite) {

        yield* callTyped(() => opdsFeedRepository.delete(identifier));
        const doc = yield* callTyped(() => opdsFeedRepository.save({
            ...feed,
            favorite,
        }));
        if (doc && favorite) {
            yield* spawnTyped(function*() {
                yield* callTyped(() => logCatalogEvent(catalogAnalyticsEvents.favorite));
            });
        }
    }
}

export function* findAllFeeds(): SagaGenerator<IOpdsFeedView[]> {

    const opdsFeedRepository = diMainGet("opds-feed-repository");
    const opdsFeedViewConverter = diMainGet("opds-feed-view-converter");
    const sortText = (value: unknown) => typeof value === "string" ? value : "";

    const docs = yield* callTyped(() => opdsFeedRepository.findAll());
    const res: IOpdsFeedView[] = [];
    for (const doc of docs) {
        res.push(yield* callTyped(() => opdsFeedViewConverter.convertDocumentToView(doc)));
    }

    // OPDS feed ordering deterministic sorting
    // favorite first
    // then title, case-insensitive
    // then url, case-insensitive
    return res.sort((a, b) => {
        const favoriteSort = Number(!!b.favorite) - Number(!!a.favorite);
        if (favoriteSort !== 0) {
            return favoriteSort;
        }

        const titleSort = sortText(a.title).localeCompare(sortText(b.title), undefined, { sensitivity: "base" });
        if (titleSort !== 0) {
            return titleSort;
        }

        return sortText(a.url).localeCompare(sortText(b.url), undefined, { sensitivity: "base" });
    });
}
