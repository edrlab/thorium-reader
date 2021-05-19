// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as debug_ from "debug";
import { ToastType } from "readium-desktop/common/models/toast";
import { toastActions } from "readium-desktop/common/redux/actions";
import { allTyped, callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView, IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import { diMainGet } from "readium-desktop/main/di";
import { put } from "redux-saga/effects";
import { SagaGenerator } from "typed-redux-saga";
import { SCHEME } from "../../../getEventChannel";
import { openWindowModalAndReturnResult } from "../../../modal/open";
import { importFromFormService } from "./importFromForm";

import { importFromFsService } from "./importFromFs";
import { importFromLinkService } from "./importFromLink";
import { importFromStringService } from "./importFromString";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/import");

export function* importFromLink(
    link: IOpdsLinkView,
    pub?: IOpdsPublicationView,
): SagaGenerator<PublicationView | undefined> {

    const translate = diMainGet("translator").translate;

    try {

        const [publicationDocument, alreadyImported] = yield* callTyped(importFromLinkService, link, pub);

        if (!publicationDocument) {
            throw new Error("publicationDocument not imported on db");
        }

        const publicationViewConverter = diMainGet("publication-view-converter");
        const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

        if (alreadyImported) {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.alreadyImport",
                        { title: publicationView.title }),
                ),
            );

        } else {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.success",
                        { title: publicationView.title }),
                ),
            );

        }

        return publicationView;

    } catch (e) {

        debug("importFromLink failed", e.toString(), e.trace);
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                translate("message.import.fail",
                    { path: link.url, err: e.toString() }),
            ),
        );
    }

    return undefined;
}

export function* importFromString(
    manifest: string,
    baseFileUrl: string, // should starts with 'file://'
): SagaGenerator<PublicationView | undefined> {

    if (manifest) {

        try {
            const [publicationDocument] = yield* callTyped(importFromStringService, manifest, baseFileUrl);

            if (!publicationDocument) {
                throw new Error("publicationDocument not imported on db");
            }

            const publicationViewConverter = diMainGet("publication-view-converter");
            return publicationViewConverter.convertDocumentToView(publicationDocument);

        } catch (error) {
            throw new Error(`importFromLink error ${error}`);
        }
    }

    return undefined;
}

export function* importFromFs(
    filePath: string | string[],
): SagaGenerator<PublicationView[] | undefined> {

    const filePathArray = Array.isArray(filePath) ? filePath : [filePath];

    const publicationViewConverter = diMainGet("publication-view-converter");

    const effects = filePathArray.map(
        (fpath: string) =>
            callTyped(function* (): SagaGenerator<PublicationView> {

                const translate = diMainGet("translator").translate;

                try {

                    // const { b: [publicationDocument, alreadyImported] } = yield* raceTyped({
                    //     a: delay(30000),
                    //     b: callTyped(importFromFsService, fpath),
                    // });
                    const data = yield* callTyped(importFromFsService, fpath);
                    if (!data) {
                        throw new Error("importFromFsService undefined");
                    }
                    const [publicationDocument, alreadyImported] = data;

                    if (!publicationDocument) {
                        throw new Error("publicationDocument not imported on db");
                    }
                    const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

                    if (alreadyImported) {
                        yield put(
                            toastActions.openRequest.build(
                                ToastType.Success,
                                translate("message.import.alreadyImport",
                                    { title: publicationView.title }),
                            ),
                        );

                    } else {
                        yield put(
                            toastActions.openRequest.build(
                                ToastType.Success,
                                translate("message.import.success",
                                    { title: publicationView.title }),
                            ),
                        );

                    }

                    return publicationView;

                } catch (error) {

                    debug("importFromFs (hash + import) fail with :" + filePath, error);
                    yield put(
                        toastActions.openRequest.build(
                            ToastType.Error,
                            translate("message.import.fail",
                                { path: filePath }),
                        ),
                    );
                }

                return undefined;
            }),
    );

    const pubView = yield* allTyped(effects);
    const ret = pubView.filter((v) => v);

    return ret;
}

const importFromFormHtml = (submitUrl = "") => `
<!DOCTYPE html>
    <html>
<head>
    <meta charset="utf-8" />
    <title>Import publication</title>
    <style type="text/css">
    </style>
    <script type="text/javascript">
    </script>
</head>
<body>
        <form action="${submitUrl}" method="post">
            <fieldset>
                <legend>From URL</legend>
            <label for="url">enter URL : </label>
            <input type="url" name="url" id="url"/>
            </fieldset>
            <br>
        <fieldset>
                <legend>From JSON MANIFEST</legend>
            <label for="manifestjson">JSON manifest : </label>
        <textarea type="text" name="manifestjson" id="manifestjson"></textarea>
            </fieldset>
            <br>
        <fieldset>
                <legend>From RAW INFORMATION</legend>
                <fieldset>
                <legend>Metadata</legend>
            <label for="title">title : </label><input type="text" name="title" id="title">
                <br>
                <label for="desc">description : </label><input type="text" name="desc" id="desc">
                <br>
                <label for="author">author : </label><input type="text" name="author" id="author">
                </fieldset>
        <fieldset>
                <legend>Cover</legend>
            <label for="cover">cover URL : </label><input type="text" name="cover" id="cover">
        </fieldset>
        <fieldset>
                <legend>Reading Order</legend>
            <label for="reading"> URLs (split with \n) : </label>
                    <textarea type="text" name="reading" id="reading"></textarea>
        </fieldset>
            </fieldset>
            <br>
            <fieldset>
                <legend>Base URL</legend>
            <label for="baseurl">enter URL : </label>
            <input type="url" name="baseurl" id="baseurl"/>
            </fieldset>
            <br>
        <input type="submit" value="Submit">
        </form>
    </body>
</html>
`;

export function* importFromForm(): SagaGenerator<PublicationView[]> {

    const translate = diMainGet("translator").translate;
    const publicationViewConverter = diMainGet("publication-view-converter");

    // launch new window form with html
    const browserUrl = `data:text/html;charset=utf-8,${importFromFormHtml(`${SCHEME}://authorize`)}`;

    const result = yield* callTyped(openWindowModalAndReturnResult, browserUrl);
    if (!result) {
        return undefined;
    }

    try {

        const { request, callback } = result;
        ok(typeof request === "object", "request not defined");

        const [publicationDocument, alreadyImported] = yield* callTyped(importFromFormService, request);

        callback({
            url: undefined,
        });

        if (!publicationDocument) {
            throw new Error("publicationDocument not imported on db");
        }
        const publicationView = publicationViewConverter.convertDocumentToView(publicationDocument);

        if (alreadyImported) {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.alreadyImport",
                        { title: publicationView.title }),
                ),
            );

        } else {
            yield put(
                toastActions.openRequest.build(
                    ToastType.Success,
                    translate("message.import.success",
                        { title: publicationView.title }),
                ),
            );

        }

    } catch (e) {

        debug("importFromForm failed", e.toString());
        debug(e);
        yield put(
            toastActions.openRequest.build(
                ToastType.Error,
                e.toString(),
            ),
        );
    }

    return undefined;
}
