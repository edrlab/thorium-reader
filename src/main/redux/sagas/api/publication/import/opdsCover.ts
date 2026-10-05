// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "node:path";
import type { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import type { IPublicationCoverData } from "readium-desktop/main/storage/publication-storage";
import { httpGet } from "readium-desktop/main/network/http";
import { findExtWithMimeType, findMimeTypeWithExtension } from "readium-desktop/utils/mimeTypes";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

const normalizeContentType = (contentType: string | undefined): string | undefined =>
    contentType?.split(";", 1)[0]?.trim().toLowerCase() || undefined;

const isImageContentType = (contentType: string | undefined): contentType is string =>
    !!contentType?.startsWith("image/");

const getImageExtensionFromUrl = (url: URL): string | undefined => {
    const ext = path.extname(url.pathname).replace(/^\./, "").toLowerCase();
    return isImageContentType(findMimeTypeWithExtension(ext)) ? ext : undefined;
};

const firstUsableLink = (links: IOpdsLinkView[] | undefined): IOpdsLinkView | undefined =>
    links?.find((link) => typeof link?.url === "string" && link.url.length > 0);

/**
 * Prefer the full-size OPDS image, then fall back to its thumbnail.
 */
export const selectOpdsCoverLink = (publication: IOpdsPublicationView | undefined): IOpdsLinkView | undefined =>
    firstUsableLink(publication?.cover?.coverLinks) ||
    firstUsableLink(publication?.cover?.thumbnailLinks);

/**
 * Download an OPDS cover through Thorium's authenticated HTTP stack.
 *
 * The caller treats this as a best-effort fallback: an invalid or unavailable
 * image must not prevent the publication itself from being imported.
 */
export const downloadOpdsCoverData = async (
    link: IOpdsLinkView,
): Promise<IPublicationCoverData | undefined> => {

    let url: URL;
    try {
        url = new URL(link.url);
    } catch {
        return undefined;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return undefined;
    }

    const response = await httpGet(url);
    if (!response?.isSuccess || !response.body) {
        return undefined;
    }

    const responseContentType = normalizeContentType(response.contentType);
    const linkContentType = normalizeContentType(link.type);
    const urlExt = getImageExtensionFromUrl(url);
    const urlContentType = urlExt ? findMimeTypeWithExtension(urlExt) : undefined;

    // A positive, non-image response type is authoritative. If the server omits
    // the type (or uses the generic binary type), use the OPDS declaration or URL.
    if (responseContentType &&
        responseContentType !== "application/octet-stream" &&
        !isImageContentType(responseContentType)) {
        (response.body as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
        return undefined;
    }

    const contentType = isImageContentType(responseContentType) ? responseContentType :
        isImageContentType(linkContentType) ? linkContentType :
            isImageContentType(urlContentType) ? urlContentType : undefined;
    if (!contentType) {
        (response.body as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
        return undefined;
    }

    const ext = findExtWithMimeType(contentType) || urlExt;
    if (!ext) {
        (response.body as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
        return undefined;
    }
    const storedContentType = findMimeTypeWithExtension(ext);
    if (!isImageContentType(storedContentType)) {
        (response.body as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
        return undefined;
    }

    const buffer = await streamToBufferPromise(response.body);
    if (!buffer.length) {
        return undefined;
    }

    return {
        buffer,
        contentType: storedContentType,
        ext,
    };
};
