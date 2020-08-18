// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { promises as fsp } from "fs";
import * as moment from "moment";
import * as path from "path";
import { LCP } from "r2-lcp-js/dist/es6-es2015/src/parser/epub/lcp";
import { TaJsonDeserialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { extractCrc32OnZip } from "readium-desktop/main/crc";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { call, put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";

import { downloader } from "../../../downloader";
import { importPublicationFromFS } from "./importPublicationFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import/publicationFromFs");

export function* importLcplFromFS(
    filePath: string,
    lcpHashedPassphrase?: string,
): SagaGenerator<PublicationDocument> {

    const lcpManager = diMainGet("lcp-manager");
    const publicationRepository = diMainGet("publication-repository");
    const translate = diMainGet("translator").translate;

    const jsonStr = yield* callTyped(() => fsp.readFile(filePath, { encoding: "utf8" }));
    const lcpJson = JSON.parse(jsonStr);
    const r2LCP = TaJsonDeserialize<LCP>(lcpJson, LCP);
    r2LCP.JsonSource = jsonStr;
    r2LCP.init();

    // LCP license checks to avoid unnecessary download:
    // CERTIFICATE_SIGNATURE_INVALID = 102
    // CERTIFICATE_REVOKED = 101
    // LICENSE_SIGNATURE_DATE_INVALID = 111
    // LICENSE_SIGNATURE_INVALID = 112
    // (USER_KEY_CHECK_INVALID = 141) is guaranteed because of dummy passphrase
    // (LICENSE_OUT_OF_DATE = 11) occurs afterwards, so will only be checked after passphrase try
    if (r2LCP.isNativeNodePlugin()) {
        if (r2LCP.Rights) {
            const now = moment.now();
            let res = 0;
            try {
                if (r2LCP.Rights.Start) {
                    if (moment(r2LCP.Rights.Start).isAfter(now)) {
                        res = 11;
                    }
                }
                if (r2LCP.Rights.End) {
                    if (moment(r2LCP.Rights.End).isBefore(now)) {
                        res = 11;
                    }
                }
            } catch (err) {
                debug(err);
            }
            if (res) {
                const msg = lcpManager.convertUnlockPublicationResultToString(res);
                yield put(
                    toastActions.openRequest.build(
                        ToastType.Error, msg,
                    ),
                );
                throw new Error(`[${msg}] (${filePath})`);
            }
        }

        try {
            // await r2LCP.tryUserKeys([toSha256Hex("READIUM2-DESKTOP-THORIUM-DUMMY-PASSPHRASE")]);
            yield call(() => r2LCP.dummyCreateContext());
        } catch (err) {
            if (err !== 141) { // USER_KEY_CHECK_INVALID
                // CERTIFICATE_SIGNATURE_INVALID = 102
                // CERTIFICATE_REVOKED = 101
                // LICENSE_SIGNATURE_DATE_INVALID = 111
                // LICENSE_SIGNATURE_INVALID = 112
                const msg = lcpManager.convertUnlockPublicationResultToString(err);
                yield put(
                    toastActions.openRequest.build(
                        ToastType.Error, msg,
                    ),
                );
                throw new Error(`[${msg}] (${filePath})`);
            }
        }
    }

    const title = path.basename(filePath);
    const [downloadFilePath] = yield* downloader(r2LCP.Links.map((ln) => ln.Href), title);

    // // search the path of the epub file
    // const downloader = diMainGet("downloader");
    // let download: Download | undefined;

    // let title: string | undefined;
    // if (r2LCP.Links) {
    //     for (const link of r2LCP.Links) {
    //         if (link.Rel === "publication") {
    //             const isEpubFile = link.Type === ContentType.Epub;
    //             const isAudioBookPacked = link.Type === ContentType.AudioBookPacked;
    //             const isAudioBookPackedLcp = link.Type === ContentType.AudioBookPackedLcp;
    //             const ext = isEpubFile ? acceptedExtensionObject.epub :
    //                 (isAudioBookPacked ? acceptedExtensionObject.audiobook :
    //   (isAudioBookPackedLcp ? acceptedExtensionObject.audiobookLcp : // not acceptedExtensionObject.audiobookLcpAlt
    //                         "")); // downloader will try HTTP response headers

    //             download = downloader.addDownload(link.Href, ext);
    //             title = link.Title ?? download.srcUrl;
    //         }
    //     }
    // }

    // if (!download) {
    //     throw new Error(`Unable to initiate download of LCP pub: ${filePath}`);
    // }

    // // this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
    // //     this.translator.translate("message.download.start", { title })));

    // yield put(downloadActions.request.build(download.srcUrl, title));

    // debug("[START] Download publication", filePath);
    // let newDownload: Download;
    // try {
    //     newDownload = yield* callTyped(() => downloader.processDownload(
    //         download.identifier,
    //         {
    //             onProgress: (dl: Download) => {
    //                 debug("[PROGRESS] Downloading publication", dl.progress);
    //                 const store = diMainGet("store");
    //                 store.dispatch(downloadActions.progress.build(download.srcUrl, dl.progress));
    //             },
    //         },
    //     ));
    // } catch (err) {
    //     yield put(toastActions.openRequest.build(ToastType.Error,
    //         translate("message.download.error", { title, err: `[${err}]` })));

    //     yield put(downloadActions.error.build(download.srcUrl));
    //     throw err;
    // }

    // // this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
    // //     this.translator.translate("message.download.success", { title })));

    // debug("[END] Download publication", filePath, newDownload);

    // yield put(downloadActions.success.build(download.srcUrl));

    // inject LCP license into temporary downloaded file, so that we can check CRC
    // caveat: processStatusDocument() which is invoked later
    // can potentially update LCP license with latest from server,
    // so not a complete guarantee of match with an already-imported LCP EPUB.
    // Plus, such already-existing EPUB in the local bookshelf may or may not
    // include the latest injected LCP license! (as it only gets updated during user interaction
    // such as when opening the publication information dialog, and of course when reading the EPUB)

    if (downloadFilePath) {

        yield call(() => lcpManager.injectLcplIntoZip(downloadFilePath, r2LCP));
        const hash = yield* callTyped(() => extractCrc32OnZip(downloadFilePath));
        const [pubDocument] = yield* callTyped(() => publicationRepository.findByHashId(hash));

        debug("importLcplFromFS", pubDocument, hash);
        if (pubDocument) {

            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate(
                        "message.import.alreadyImport", { title: pubDocument.title },
                    ),
                ),
            );
            return pubDocument;
        }

        const publicationDocument = yield* callTyped(
            () => importPublicationFromFS(downloadFilePath, hash, lcpHashedPassphrase));

        return publicationDocument;
    } else {
        throw new Error("downloadFilePath undefined");
    }
    // return this.lcpManager.injectLcpl(publicationDocument, r2LCP);
}
