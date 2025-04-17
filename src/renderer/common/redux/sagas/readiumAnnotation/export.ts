// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { select as selectTyped, call as callTyped, SagaGenerator} from "typed-redux-saga/macro";
import { convertAnnotationStateArrayToReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/converter";
import { IReadiumAnnotation, IReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/annotationModel.type";
import * as Mustache from "mustache";
import { noteExportHtmlMustacheTemplate } from "readium-desktop/common/readium/annotation/htmlTemplate";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { PublicationView } from "readium-desktop/common/views/publication";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

// Logger
const debug = debug_("readium-desktop:renderer:common:redux:sagas:readiumAnnotation:export");


const __htmlMustacheViewConverterFn: (readiumAnnotation: IReadiumAnnotationSet) => Promise<object> = async (readiumAnnotation) => {

    const view = {
        ...readiumAnnotation,
    };
    const tmpItems = [];
    for (const item of (view.items || [])) {

        try {
            tmpItems.push({ ...item, body: { ...item.body || {}, htmlValue: DOMPurify.sanitize(await marked.parse((item.body?.value || "").replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""), { gfm: true })) } });
        } catch (_) {
            tmpItems.push(item);
        }
    }
    view.items = tmpItems as IReadiumAnnotation[];

    return view;
};
const convertReadiumAnnotationSetToHtml = async (
    readiumAnnotation: IReadiumAnnotationSet,
    viewConverterFn: (_: IReadiumAnnotationSet) => Promise<object> = __htmlMustacheViewConverterFn,
    htmlMustacheTemplate: string = noteExportHtmlMustacheTemplate,
): Promise<string> => {
    const output = Mustache.render(htmlMustacheTemplate, await viewConverterFn(readiumAnnotation));
    return output;
};
const downloadAnnotationFile = (data: string, filename: string, extension: ".annotation" | ".html") => {

    const blob = new Blob([data], { type: extension === ".annotation" ? "application/rd-annotations+json" : "text/html" });
    const jsonObjectUrl = URL.createObjectURL(blob);
    const anchorEl = document.createElement("a");
    anchorEl.href = jsonObjectUrl;
    anchorEl.download = filename + extension;
    anchorEl.click();
    URL.revokeObjectURL(jsonObjectUrl);
};
export function* exportAnnotationSet(notes: INoteState[], publicationView: PublicationView, label?: string, fileType: "html" | "annotation" = "annotation"): SagaGenerator<void> {

    
    debug("exportAnnotationSet just started !");
    debug("AnnotationArray: ", notes);
    debug("PubView ok?", typeof publicationView);
    debug("label:", label);
    debug("fileType:", fileType);

    
    // notes selector generation with cacheDocument included in note on export, computed after creation
    // yield* callTyped(getResourceCache);
    // const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);

    const locale = yield* selectTyped((state: ICommonRootState) => state.i18n.locale);
    const readiumAnnotationSet = yield* callTyped(() => convertAnnotationStateArrayToReadiumAnnotationSet(locale, notes, publicationView, label));

    debug("readiumAnnotationSet generated, prepare to download it");

    const {htmlContent, overrideHTMLTemplate} = (yield* selectTyped((state: ICommonRootState) => state.noteExport));
    const htmlMustacheTemplateContent = overrideHTMLTemplate ? htmlContent : noteExportHtmlMustacheTemplate || noteExportHtmlMustacheTemplate;

    const extension = fileType === "annotation" ? ".annotation" : ".html";
    const stringData = extension === ".annotation" ?
        JSON.stringify(readiumAnnotationSet, null, 2) :
        yield* callTyped(() => convertReadiumAnnotationSetToHtml(readiumAnnotationSet, __htmlMustacheViewConverterFn, htmlMustacheTemplateContent));
    downloadAnnotationFile(stringData, label, extension);
}
