// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { diMainGet } from "readium-desktop/main/di";
import { ContentType } from "readium-desktop/utils/content-type";
import { SagaGenerator } from "typed-redux-saga";

import { downloader } from "../../../downloader";
import { importFromFsService } from "./importFromFs";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromLinkService");

export function* importFromLinkService(
    link: IOpdsLinkView,
    pub: IOpdsPublicationView,
): SagaGenerator<PublicationDocument | undefined> {

    let returnPublicationDocument: PublicationDocument;

    if (!(link?.url && pub)) {
        debug("Unable to get an acquisition url from opds publication", link);
        throw new Error("Unable to get acquisition url from opds publication");
    }

    const title = link.title || link.url;
    const isLcpFile = link.type === ContentType.Lcp;
    const isEpubFile = link.type === ContentType.Epub;
    const isAudioBookPacked = link.type === ContentType.AudioBookPacked;
    const isAudioBookPackedLcp = link.type === ContentType.AudioBookPackedLcp;
    if (!isLcpFile && !isEpubFile && !isAudioBookPacked && !isAudioBookPackedLcp) {
        // throw new Error(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
        debug(`OPDS download link is not EPUB or AudioBook! ${link.url} ${link.type}`);
    }

    // const ext = isLcpFile ? acceptedExtensionObject.lcpLicence :
    //     (isEpubFile ? acceptedExtensionObject.epub :
    //         (isAudioBookPacked ? acceptedExtensionObject.audiobook :
    //   (isAudioBookPackedLcp ? acceptedExtensionObject.audiobookLcp : // not acceptedExtensionObject.audiobookLcpAlt
    //                 ""))); // downloader will try HTTP response headers
    // // start the download service

    debug("Start the download", link.url);

    const [downloadPath] = yield* downloader([link.url], title);

    debug("downloadPath:", downloadPath);

    // const downloader = diMainGet("downloader");
    // const download = downloader.addDownload(link.url, ext);

    // // this.store.dispatch(toastActions.openRequest.build(ToastType.Default,
    // //     this.translator.translate("message.download.start", { title })));

    // // send to the front-end the signal of download
    // yield put(downloadActions.request.build(download.srcUrl, title));

    // // track download progress
    // debug("[START] Download publication", link.url);
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
    //     const translate = diMainGet("translator").translate;
    //     yield put(
    //         toastActions.openRequest.build(
    //             ToastType.Error,
    //             translate(
    //                 "message.download.error", { title, err: `[${err}]` },
    //             ),
    //         ),
    //     );

    //     yield put(downloadActions.error.build(download.srcUrl));
    //     throw err;
    // }

    // // this.store.dispatch(toastActions.openRequest.build(ToastType.Success,
    // //     this.translator.translate("message.download.success", { title })));

    // debug("[END] Download publication", link.url, newDownload);

    // yield put(downloadActions.success.build(download.srcUrl));

    if (downloadPath) {

        // Import downloaded publication in catalog
        const lcpHashedPassphrase = link?.properties?.lcpHashedPassphrase;
        let publicationDocument = yield* importFromFsService(downloadPath, lcpHashedPassphrase);

        if (publicationDocument) {
            const tags = pub.tags.map((v) => v.name);

            // Merge with the original publication
            publicationDocument = Object.assign(
                {},
                publicationDocument,
                {
                    resources: {
                        r2PublicationBase64: publicationDocument.resources.r2PublicationBase64,
                        r2LCPBase64: publicationDocument.resources.r2LCPBase64,
                        r2LSDBase64: publicationDocument.resources.r2LSDBase64,
                        r2OpdsPublicationBase64: pub.r2OpdsPublicationBase64,
                    },
                    tags,
                },
            );

            const publicationRepository = diMainGet("publication-repository");
            returnPublicationDocument = yield* callTyped(() => publicationRepository.save(publicationDocument));
        }
    }

    return returnPublicationDocument;
}
