// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { TaJsonDeserialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import { OPDSPublication } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-publication";
import { acceptedExtensionObject } from "readium-desktop/common/extension";
import { Download } from "readium-desktop/common/models/download";
import { ToastType } from "readium-desktop/common/models/toast";
import { downloadActions, toastActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { getTagsFromOpdsPublication } from "readium-desktop/main/converter/tools/getTags";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { ContentType } from "readium-desktop/utils/content-type";
import { put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromLinkService");

export function* importFromLinkService(
    link: IOpdsLinkView,
    r2OpdsPublicationBase64: string,
): SagaGenerator<PublicationDocument | undefined> {

    let returnPublicationDocument: PublicationDocument;

    if (!(link?.url && r2OpdsPublicationBase64)) {
        debug("Unable to get an acquisition url from opds publication", link);
        throw new Error("Unable to get acquisition url from opds publication");
    }

    const title = link.title || link.url;
    const isLcpFile = link.type === ContentType.Lcp;
    const isEpubFile = link.type === ContentType.Epub;
    const isAudioBookPacked = link.type === ContentType.AudioBookPacked;
    const isAudioBookPackedLcp = link.type === ContentType.AudioBookPackedLcp;
    if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp) {
        throw new Error(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
    }

    const ext = isLcpFile ? acceptedExtensionObject.lcpLicence :
        (isEpubFile ? acceptedExtensionObject.epub :
            (isAudioBookPacked ? acceptedExtensionObject.audiobook :
                (isAudioBookPackedLcp ? acceptedExtensionObject.audiobookLcp : // not acceptedExtensionObject.audiobookLcpAlt
                    ""))); // downloader will try HTTP response headers
    // start the download service

    const downloader = diMainGet("downloader");
    const download = downloader.addDownload(link.url, ext);

    // this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
    //     this.translator.translate("message.download.start", { title })));

    // send to the front-end the signal of download
    yield put(downloadActions.request.build(download.srcUrl, title));

    const r2OpdsPublicationStr = Buffer.from(r2OpdsPublicationBase64, "base64").toString("utf-8");
    const r2OpdsPublicationJson = JSON.parse(r2OpdsPublicationStr);
    const r2OpdsPublication = TaJsonDeserialize<OPDSPublication>(r2OpdsPublicationJson, OPDSPublication);

    let lcpHashedPassphrase: string | undefined;
    const downloadLink = r2OpdsPublication.Links.find((l) => {
        return l.Href === link.url;
    });
    if (downloadLink) {
        const key = "lcp_hashed_passphrase";
        if (downloadLink.Properties &&
            downloadLink.Properties.AdditionalJSON &&
            downloadLink.Properties.AdditionalJSON[key]) {
            const lcpHashedPassphraseObj = downloadLink.Properties.AdditionalJSON[key];
            if (typeof lcpHashedPassphraseObj === "string") {
                const lcpHashedPassphraseHexOrB64 = lcpHashedPassphraseObj as string;
                let isHex = false;
                try {
                    const low1 = lcpHashedPassphraseHexOrB64.toLowerCase();
                    const buff = Buffer.from(low1, "hex");
                    const str = buff.toString("hex");
                    const low2 = str.toLowerCase();
                    isHex = low1 === low2;
                    if (!isHex) {
                        debug(`OPDS lcp_hashed_passphrase should be HEX! (${lcpHashedPassphraseHexOrB64}) ${low1} !== ${low2}`);
                    } else {
                        debug(`OPDS lcp_hashed_passphrase is HEX: ${lcpHashedPassphraseHexOrB64}`);
                    }
                } catch (err) {
                    debug(err); // ignore
                }
                if (isHex) {
                    lcpHashedPassphrase = lcpHashedPassphraseHexOrB64;
                } else {
                    let isBase64 = false;
                    try {
                        const buff = Buffer.from(lcpHashedPassphraseHexOrB64, "base64");
                        const str = buff.toString("hex");
                        const b64 = Buffer.from(str, "hex").toString("base64");
                        isBase64 = lcpHashedPassphraseHexOrB64 === b64;
                        if (!isBase64) {
                            debug(`OPDS lcp_hashed_passphrase is not BASE64?! (${lcpHashedPassphraseHexOrB64}) ${lcpHashedPassphraseHexOrB64} !== ${b64}`);
                        } else {
                            debug(`OPDS lcp_hashed_passphrase is BASE64! (${lcpHashedPassphraseHexOrB64})`);
                        }
                    } catch (err) {
                        debug(err); // ignore
                    }
                    if (isBase64) {
                        lcpHashedPassphrase = Buffer.from(lcpHashedPassphraseHexOrB64, "base64").toString("hex");
                    }
                }
            }
        }
        // NOTE: remove this in production!
        // if (// IS_DEV &&
        //     !lcpHashedPassphrase &&
        //     downloadLink && downloadLink.Href.indexOf("cantookstation.com/") > 0) {

        //     // mock for testing, as OPDS server does not provide "lcp_hashed_passphrase" yet...
        //     lcpHashedPassphrase = "d62414a0ede9e20898a1cb0e26dd05c57d7ef7a396d195fac9b43c1447bfd9ac";
        // }
    }

    // track download progress
    debug("[START] Download publication", link.url);
    let newDownload: Download;
    try {
        newDownload = yield* callTyped(() => downloader.processDownload(
            download.identifier,
            {
                onProgress: (dl: Download) => {
                    debug("[PROGRESS] Downloading publication", dl.progress);
                    const store = diMainGet("store");
                    store.dispatch(downloadActions.progress.build(download.srcUrl, dl.progress));
                },
            },
        ));
    } catch (err) {
        const translate = diMainGet("translator").translate;
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translate(
                    "message.download.error", { title, err: `[${err}]` },
                ),
            ),
        );

        yield put(downloadActions.error.build(download.srcUrl));
        throw err;
    }

    // this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
    //     this.translator.translate("message.download.success", { title })));

    debug("[END] Download publication", link.url, newDownload);

    yield put(downloadActions.success.build(download.srcUrl));

    // Import downloaded publication in catalog
    let publicationDocument = yield* importFromFsService(download.dstPath, lcpHashedPassphrase);

    if (publicationDocument) {
        const tags = getTagsFromOpdsPublication(r2OpdsPublication);

        // Merge with the original publication
        publicationDocument = Object.assign(
            {},
            publicationDocument,
            {
                resources: {
                    r2PublicationBase64: publicationDocument.resources.r2PublicationBase64,
                    r2LCPBase64: publicationDocument.resources.r2LCPBase64,
                    r2LSDBase64: publicationDocument.resources.r2LSDBase64,
                    r2OpdsPublicationBase64,
                },
                tags,
            },
        );

        const publicationRepository = diMainGet("publication-repository");
        returnPublicationDocument = yield* callTyped(() => publicationRepository.save(publicationDocument));
    }

    return returnPublicationDocument;
}
