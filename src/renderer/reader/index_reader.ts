// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ipcRenderer } from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { readerIpc } from "readium-desktop/common/ipc";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { createStoreFromDi } from "readium-desktop/renderer/reader/createStore";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { publicationHasMediaOverlays } from "@r2-navigator-js/electron/renderer";
import { pushTags } from "./tags";
import { getTranslator } from "readium-desktop/common/services/translator";

// let devTron: any;
let axe: any;
if (IS_DEV) {
    // requires electron.remote!
    // enableRemoteModule: false
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // devTron = require("devtron");

    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    axe = require("@axe-core/react");
}

initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// if (IS_DEV) {
//     setTimeout(() => {
//         devTron.install();
//     }, 5000);
// }

ipcRenderer.on(readerIpc.CHANNEL,
    (_0: any, data: readerIpc.EventPayload) => {
        switch (data.type) {
            case readerIpc.EventType.request:
                // Initialize window

                // Legacy Base64 data blobs
                // const r2PublicationStr = Buffer.from(data.payload.reader.info.publicationView.r2PublicationBase64, "base64").toString("utf-8");
                // const r2PublicationJson = JSON.parse(r2PublicationStr);
                const r2PublicationJson = data.payload.reader.info.publicationView.r2PublicationJson;
                const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);

                data.payload.reader.info.r2Publication = r2Publication;

                data.payload.reader.info.navigator = {
                    r2PublicationHasMediaOverlays: publicationHasMediaOverlays(r2Publication),
                };

                const annotationList = data.payload.reader.annotation || [];
                for (const [_createdTimestampFromAnno,anno] of annotationList) {

                    // TODO? why do not used the _createdTimestampFromAnno instead !?
                    if (!anno.created && anno.modified) {
                        anno.created = anno.modified;
                    }
                    if (!anno.created) {
                        anno.created = (new Date()).getTime();
                    }
                }
                const annotationTagsList = [];
                for (const [_, {tags}] of annotationList) {
                    annotationTagsList.push(...(tags || []));
                }
                data.payload.annotationTagsIndex = pushTags({}, annotationTagsList);


                const bookmarkList = data.payload.reader.bookmark || [];
                const bookmarkListLength = bookmarkList.length;

                if (!data.payload.reader.bookmarkTotalCount) {
                    data.payload.reader.bookmarkTotalCount = {
                        state: bookmarkListLength,
                    };
                } else if (data.payload.reader.bookmarkTotalCount.state < bookmarkListLength) {
                    data.payload.reader.bookmarkTotalCount.state = bookmarkListLength;
                }
                let bookmarkIndex = 0;
                for (const [created, bookmark] of bookmarkList) {
                    bookmarkIndex = bookmarkIndex + 1;
                    if (!bookmark.created && created > bookmark.modified) {
                        bookmark.created = bookmark.modified;
                    }
                    if (!bookmark.created) {
                        bookmark.created = created;
                    }
                    if (!bookmark.index) {
                        bookmark.index = bookmarkIndex;
                    }
                }

                const store = createStoreFromDi(data.payload);
                const locale = store.getState().i18n.locale;
                getTranslator().setLocale(locale);

                store.dispatch(winActions.initRequest.build(data.payload.win.identifier));

                break;
        }
    });

if (IS_DEV) {
    ipcRenderer.once("AXE_A11Y", () => {
        const publicationViewport = document.getElementById("publication_viewport");
        let parent: Element | undefined;
        if (publicationViewport) {
            parent = publicationViewport.parentElement; // .publication_viewport_container
            if (parent) {
                publicationViewport.remove();
            }
        }

        const reloadLink = document.createElement("div");
        reloadLink.setAttribute("onClick", "javascript:window.location.reload();");
        const reloadText = document.createTextNode("REACT AXE A11Y CHECKER RUNNING (CLICK TO RESET)");
        reloadLink.appendChild(reloadText);
        reloadLink.setAttribute("style", "background-color: #e2f9fe; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: underline; padding: 0; margin: 0; height: 100%; font-size: 120%; font-weight: bold; font-family: arial; color: blue;");
        parent.appendChild(reloadLink);

        // https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure
        const config = {
            // rules: [
            //     {
            //         id: "skip-link",
            //         enabled: true,
            //     },
            // ],
        };
        axe(React, ReactDOM, 1000, config);

        // r2-navigator-js is removed for good, until next reload.
        // setTimeout(() => {
        //     if (parent && publicationViewport) {
        //         parent.appendChild(publicationViewport);
        //     }
        // }, 1500);
    });
}
