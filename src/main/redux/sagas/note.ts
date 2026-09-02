// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { dialog } from "electron";
import * as fs from "node:fs";
import { buildPublicationUserAnalyticsParams, publicationAnalyticsEvents } from "readium-desktop/common/analytics/publication";
import { ToastType } from "readium-desktop/common/models/toast";
import { annotationActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import { diMainGet, getLibraryWindowFromDi, getReaderWindowFromDi } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped, put as putTyped, take as takeTyped, delay as delayTyped, all as allTyped, select as selectTyped } from "typed-redux-saga/macro";
import path from "node:path";
import { getPublication } from "./api/publication/getPublication";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { takeSpawnLatest } from "readium-desktop/common/redux/sagas/takeSpawnLatest";
import { getTranslator, type I18nFunction } from "readium-desktop/common/services/translator";
import {
    getPublicationNoteImportSelectorTypesLabel,
    getPublicationNoteImportUnresolvedReasonLabel,
    hydratePublicationNotesView,
    publicationNoteImportUnresolvedReasons,
    type PublicationNote,
    type PublicationNoteImportUnresolvedReason,
    type PublicationNotesImportReport,
    withoutPublicationNotesViewPagination,
} from "readium-desktop/common/publication-notes";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { publicationActions as publicationActionsFromMainAction } from "../actions";
import { EXT_ANNOTATIONS } from "readium-desktop/common/extension";
import { convertAnnotationStateArrayToReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/exportConverter";
import { noteExportHtmlMustacheTemplate } from "readium-desktop/common/readium/annotation/htmlTemplate";
import { sanitizeForFilename } from "readium-desktop/common/safe-filename";
import { JsonStringifySortedKeys } from "readium-desktop/common/utils/json";
import { RootState } from "../states";
import { ActionWithSender, SenderType } from "readium-desktop/common/models/sync";
import {
    PublicationNotesImportController,
    type PublicationNotesImportPreview,
} from "readium-desktop/main/publication-notes/importController";
import { spawnPublicationAnalyticsEvent } from "./analyticsPublication";
import type { TAnalyticsEventParams } from "readium-desktop/common/api/interface/analyticsApi.interface";

// Logger
const filename_ = "readium-desktop:main:saga:annotationsImporter";
const debug = debug_(filename_);
debug("_");

export function* getPublicationNotesFromSnapshot(publicationIdentifier: string): SagaGenerator<PublicationNote[]> {

    const snapshot = yield* callTyped(() => diMainGet("publication-notes-controller").list(publicationIdentifier));

    return snapshot.notes;
}

function getPublicationSpineItemHrefsFromR2PublicationJson(r2PublicationJson: unknown): string[] {

    const r2Publication = TaJsonDeserialize(r2PublicationJson, R2Publication);
    return (r2Publication.Spine || [])
        .map((link) => link.Href)
        .filter((href): href is string => !!href);
}

function* getPublicationSpineItemHrefs(publicationIdentifier: string): SagaGenerator<string[]> {

    const pubView = yield* callTyped(getPublication, publicationIdentifier);
    if (!pubView.r2PublicationJson) {
        return [];
    }

    return getPublicationSpineItemHrefsFromR2PublicationJson(pubView.r2PublicationJson);
}

function* hydratePublicationNotesSnapshot(publicationIdentifier: string): SagaGenerator<void> {

    const snapshot = yield* callTyped(() => diMainGet("publication-notes-controller").list(publicationIdentifier));

    yield* putTyped(readerActions.publicationNotes.snapshot.build(publicationIdentifier, snapshot));
}

function* pushNotesFromMainWindow(
    publicationIdentifier: string,
    notes: PublicationNote[],
    existingNotes: PublicationNote[] = [],
    options?: { alreadyPersisted?: boolean | undefined },
): SagaGenerator<void> {

    for (const note of notes) {
        yield* delayTyped(1);
        const previousNote = existingNotes.find(({ uuid }) => uuid === note.uuid);
        yield* putTyped(readerActions.publicationNotes.commands.save.build(publicationIdentifier, note, previousNote, options));
    }

    // const sessionReader = yield* selectTyped((state: RootState) => state.win.session.reader);
    // const winSessionReaderStateArray = Object.values(sessionReader).filter((v) => v.publicationIdentifier === publicationIdentifier);

    // if (winSessionReaderStateArray.length) {
    //     // dispatch action

    // } else {
    //     const sessionRegistry = yield* selectTyped((state: RootState) => state.win.registry.reader);
    //     const reduxState = sessionRegistry[publicationIdentifier]?.reduxState || {};
    //     // reduxState.note = [...(reduxState.note || []), ...notes];
    //     const winBound = sessionRegistry[publicationIdentifier]?.windowBound || { height: WINDOW_MIN_HEIGHT, width: WINDOW_MIN_WIDTH, x: 0, y: 0 };

    //     yield* putTyped(winActions.registry.registerReaderPublication.build(
    //         publicationIdentifier,
    //         winBound,
    //         reduxState),
    //     );
    // }
}

function* savePublicationNote(publicationIdentifier: string, newNote: PublicationNote, previousNote?: PublicationNote): SagaGenerator<void> {

    const controller = diMainGet("publication-notes-controller");
    const persistedNote = yield* callTyped(() => controller.get(publicationIdentifier, newNote.uuid));

    if (!persistedNote) {
        if (previousNote) {
            debug("No persisted note found to update", newNote.uuid, previousNote.uuid);
            return;
        }

        debug("NO persisted note ==> CREATE new note");
        yield* callTyped(() => controller.create(publicationIdentifier, newNote));
    } else {
        debug("Persisted note found ==> UPDATE note", newNote.uuid, previousNote?.uuid);
        yield* callTyped(() => controller.update(publicationIdentifier, newNote));
    }
}

function* deletePublicationNote(publicationIdentifier: string, note: PublicationNote): SagaGenerator<void> {

    const controller = diMainGet("publication-notes-controller");
    const persistedNote = yield* callTyped(() => controller.get(publicationIdentifier, note.uuid));
    if (!persistedNote) {
        debug("No persisted note found to delete", note.uuid);
        return;
    }

    yield* callTyped(() => controller.delete(publicationIdentifier, note.uuid));
}

type PublicationNoteCommandAction =
    | readerActions.publicationNotes.commands.save.TAction
    | readerActions.publicationNotes.commands.remove.TAction;

function* persistPublicationNoteCommand(action: PublicationNoteCommandAction): SagaGenerator<void> {

    if (action.type === readerActions.publicationNotes.commands.save.ID) {
        debug("RECEIVE PUBLICATION NOTES SAVE COMMAND");
        debug(action);

        const { publicationIdentifier, previousNote, newNote } = action.payload;
        if (!action.meta?.alreadyPersisted) {
            yield* callTyped(savePublicationNote, publicationIdentifier, newNote, previousNote);
        }
        yield* callTyped(hydratePublicationNotesSnapshot, publicationIdentifier);
        return;
    }

    debug("RECEIVE PUBLICATION NOTES REMOVE COMMAND");
    debug(action);

    yield* callTyped(deletePublicationNote, action.payload.publicationIdentifier, action.payload.note);
    yield* callTyped(hydratePublicationNotesSnapshot, action.payload.publicationIdentifier);
}

function getPublicationNotesExportWindowIdentifier(action: unknown): string | undefined {

    const explicitWindowIdentifier = (action as { payload?: { windowIdentifier?: string | undefined } })?.payload?.windowIdentifier;
    if (explicitWindowIdentifier) {
        return explicitWindowIdentifier;
    }

    const sender = (action as unknown as ActionWithSender).sender;
    if (sender?.type !== SenderType.Renderer || !sender.identifier) {
        return undefined;
    }

    return sender.identifier;
}

function getPublicationNotesExportWindow(windowIdentifier?: string): Electron.BrowserWindow | undefined {

    if (!windowIdentifier) {
        return undefined;
    }

    try {
        const win = getReaderWindowFromDi(windowIdentifier);
        if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
            return undefined;
        }

        return win;
    } catch (_err) {
        return undefined;
    }
}

function* savePublicationNotesExportData(
    windowIdentifier: string | undefined,
    stringData: string,
    title: string | undefined,
    extension: typeof EXT_ANNOTATIONS | ".html",
): SagaGenerator<void> {

    const filenameWithExtension = sanitizeForFilename((title || "thorium-notes") + extension);
    const exportWindow = getPublicationNotesExportWindow(windowIdentifier);
    const dialogOptions: Electron.SaveDialogOptions = {
        defaultPath: filenameWithExtension,
        filters: [{
            extensions: [extension.substring(1)],
            name: extension === EXT_ANNOTATIONS ? `Readium Annotation Set (${EXT_ANNOTATIONS})` : "HTML (.html)",
        }],
        properties: ["createDirectory"],
    };
    const res = yield* callTyped(() => exportWindow
        ? dialog.showSaveDialog(exportWindow, dialogOptions)
        : dialog.showSaveDialog(dialogOptions));

    if (!res.canceled && res.filePath) {
        yield* callTyped(() => fs.promises.writeFile(res.filePath, stringData, { encoding: "utf-8" }));
    }
}

function* exportPublicationNotes(
    action: readerActions.publicationNotes.export.TAction,
): SagaGenerator<void> {

    const { publicationIdentifier, filter, title, fileType } = action.payload;
    const windowIdentifier = getPublicationNotesExportWindowIdentifier(action);
    const exportFilter = withoutPublicationNotesViewPagination(filter);
    const spineItemHrefs = exportFilter.sort === "progression"
        ? yield* callTyped(getPublicationSpineItemHrefs, publicationIdentifier)
        : [];
    const snapshot = yield* callTyped(() =>
        diMainGet("publication-notes-controller").list(publicationIdentifier));
    const publicationNotesView = hydratePublicationNotesView(snapshot.notes, exportFilter, spineItemHrefs);
    const publicationView = yield* callTyped(getPublication, publicationIdentifier);
    const locale = yield* selectTyped((state: RootState) => state.i18n.locale);
    const readiumAnnotationSet = yield* callTyped(() =>
        convertAnnotationStateArrayToReadiumAnnotationSet(locale, publicationNotesView.notes, publicationView, title));

    if (fileType === "annotation") {
        yield* savePublicationNotesExportData(
            windowIdentifier,
            JsonStringifySortedKeys(readiumAnnotationSet, 2),
            title,
            EXT_ANNOTATIONS,
        );
        return;
    }

    if (!windowIdentifier) {
        debug("Cannot render publication notes HTML export without a reader window identifier");
        return;
    }

    const { htmlContent, overrideHTMLTemplate } = yield* selectTyped((state: RootState) => state.noteExport);
    const htmlMustacheTemplateContent = overrideHTMLTemplate ? htmlContent : noteExportHtmlMustacheTemplate;
    yield* putTyped(readerActions.publicationNotes.exportHtmlRequest.build(
        publicationIdentifier,
        readiumAnnotationSet,
        htmlMustacheTemplateContent,
        title,
        windowIdentifier,
    ));
}

function* savePublicationNotesHtmlExport(
    action: readerActions.publicationNotes.exportHtmlResult.TAction,
): SagaGenerator<void> {

    const { html, title } = action.payload;
    yield* savePublicationNotesExportData(
        getPublicationNotesExportWindowIdentifier(action),
        html,
        title,
        ".html",
    );
}

function countUnresolvedImportedNotes(
    notes: PublicationNote[],
): Record<PublicationNoteImportUnresolvedReason, number> {

    return notes.reduce<Record<PublicationNoteImportUnresolvedReason, number>>((acc, note) => {
        const reason = note.readiumAnnotation?.import?.unresolved?.reason;
        if (reason) {
            acc[reason] += 1;
        }
        return acc;
    }, {
        "source-mismatch": 0,
        "unsupported-selector": 0,
        "selector-not-found": 0,
        "ambiguous-match": 0,
    });
}

function formatUnresolvedCounts(
    counts: Record<PublicationNoteImportUnresolvedReason, number>,
    translate: I18nFunction,
): string {

    return publicationNoteImportUnresolvedReasons
        .filter((reason) => counts[reason] > 0)
        .map((reason) => `${getPublicationNoteImportUnresolvedReasonLabel(reason, translate)}: ${counts[reason]}`)
        .join("; ");
}

function formatUnsupportedSelectorNoteItem(
    note: PublicationNote,
    translate: I18nFunction,
): string {

    return translate("message.annotations.unsupportedSelectorItem", {
        id: note.uuid,
        source: note.readiumAnnotation?.import?.unresolved?.source || note.readiumAnnotation?.import?.target.source || "",
        selectorTypes: getPublicationNoteImportSelectorTypesLabel(
            note,
            translate("message.annotations.unsupportedSelectorNoSelector"),
        ),
    });
}

function formatUnsupportedSelectorDiagnostics(
    notes: PublicationNote[],
    translate: I18nFunction,
): string {

    if (!notes.length) {
        return "";
    }

    return `${translate("message.annotations.unsupportedSelectorSummary", {
        count: notes.length,
    })} ${notes
        .map((note) => formatUnsupportedSelectorNoteItem(note, translate))
        .join("; ")}`;
}

function formatImportReportDiagnostics(
    importReport: PublicationNotesImportReport,
    translate: I18nFunction,
): string {

    const unresolvedCounts: Record<PublicationNoteImportUnresolvedReason, number> = {
        "source-mismatch": importReport.sourceMismatch.length,
        "unsupported-selector": 0,
        "selector-not-found": importReport.selectorNotFound.length,
        "ambiguous-match": importReport.ambiguousMatch.length,
    };
    const importReportConflictNewerLabel = translate("message.annotations.importReportConflictNewer");
    const importReportConflictOlderLabel = translate("message.annotations.importReportConflictOlder");
    const importReportAlreadyImportedLabel = translate("message.annotations.importReportAlreadyImported");
    const importReportPrefixLabel = translate("message.annotations.importReportPrefix");
    const parts = [
        formatUnresolvedCounts(unresolvedCounts, translate),
        formatUnsupportedSelectorDiagnostics(importReport.unsupportedSelector, translate),
        importReport.annotationsConflictListNewer.length
            ? `${importReportConflictNewerLabel}: ${importReport.annotationsConflictListNewer.length}`
            : "",
        importReport.annotationsConflictListOlder.length
            ? `${importReportConflictOlderLabel}: ${importReport.annotationsConflictListOlder.length}`
            : "",
        importReport.annotationsAlreadyImportedList.length
            ? `${importReportAlreadyImportedLabel}: ${importReport.annotationsAlreadyImportedList.length}`
            : "",
    ].filter((part) => !!part);

    return parts.length ? `${importReportPrefixLabel}: ${parts.join("; ")}` : "";
}

function appendImportReportDiagnostics(
    message: string,
    importReport: PublicationNotesImportReport,
    translate: I18nFunction,
): string {

    const importReportDiagnostics = formatImportReportDiagnostics(importReport, translate);
    return importReportDiagnostics ? `${message} ${importReportDiagnostics}` : message;
}

function appendImportedUnresolvedDiagnostics(
    message: string,
    importedNotes: PublicationNote[],
    translate: I18nFunction,
): string {

    const unresolvedCounts = countUnresolvedImportedNotes(importedNotes);
    unresolvedCounts["unsupported-selector"] = 0;
    const unresolvedDiagnostics = formatUnresolvedCounts(unresolvedCounts, translate);
    const unsupportedSelectorDiagnostics = formatUnsupportedSelectorDiagnostics(
        importedNotes.filter((note) => note.readiumAnnotation?.import?.unresolved?.reason === "unsupported-selector"),
        translate,
    );
    const diagnostics = [
        unresolvedDiagnostics ? `${translate("message.annotations.importReportUnresolvedImportedNotes")}: ${unresolvedDiagnostics}.` : "",
        unsupportedSelectorDiagnostics,
    ].filter((part) => !!part);

    return diagnostics.length
        ? `${message} ${diagnostics.join(" ")}`
        : message;
}

function* handlePublicationNotesImportPreviewStatus(
    importPreview: PublicationNotesImportPreview,
    readerPublicationIdentifier: string | undefined,
    translate: I18nFunction,
): SagaGenerator<boolean> {

    switch (importPreview.status) {
        case "invalidAnnotationSet":
            debug("Error: ", importPreview.errors);
            yield* putTyped(toastActions.openRequest.build(
                ToastType.Error,
                translate("message.annotations.errorParsing") + importPreview.errors,
                readerPublicationIdentifier,
            ));
            return true;

        case "emptyFile":
            debug("there are no annotations in the file, exit");
            yield* putTyped(toastActions.openRequest.build(
                ToastType.Success,
                translate("message.annotations.emptyFile"),
                readerPublicationIdentifier,
            ));
            return true;

        case "publicationCorrupted":
            debug("ERROR: the publication doesn't have an r2PublicationJson value !!");
            yield* putTyped(toastActions.openRequest.build(
                ToastType.Error,
                "The publication is corrupted",
                readerPublicationIdentifier,
            ));
            return true;

        case "nothing":
            debug("there are no annotations ready to be imported, exit");
            yield* putTyped(toastActions.openRequest.build(
                ToastType.Success,
                appendImportReportDiagnostics(
                    translate("message.annotations.nothing"),
                    importPreview.importReport,
                    translate,
                ),
                readerPublicationIdentifier,
            ));
            return true;

        case "alreadyImported":
            debug("all annotations are already imported, exit");
            yield* putTyped(toastActions.openRequest.build(
                ToastType.Success,
                appendImportReportDiagnostics(
                    translate("message.annotations.alreadyImported"),
                    importPreview.importReport,
                    translate,
                ),
                readerPublicationIdentifier,
            ));
            return true;

        case "ready":
            return false;
    }
}

function* importAnnotationSet(action: annotationActions.importAnnotationSet.TAction): SagaGenerator<void> {

    const { payload: { publicationIdentifier, winId } } = action;
    debug("Start annotations Importer");
    const { __ } = getTranslator();

    const readerPublicationIdentifier = winId ? publicationIdentifier : undefined; // if undefined toast notification will be displayed in library win

    const win = winId ? getReaderWindowFromDi(winId) : getLibraryWindowFromDi();

    if (!win || win.isDestroyed() || win.webContents.isDestroyed()) {
        debug("ERROR!! No Browser window !!! exit");
        return;
    }

    let filePath = "";
    let analyticsParams: TAnalyticsEventParams | undefined;
    try {

        debug("Open ShowOpenDialog and ask to user the filePath");
        const res = yield* callTyped(() => dialog.showOpenDialog(win, { filters: [{ extensions: [EXT_ANNOTATIONS.substring(1)], name: __("reader.marks.annotationsReadium") + " [" + EXT_ANNOTATIONS + "]" }], properties: ["openFile"] }));

        if (!res.canceled) {
            filePath = res.filePaths[0] || "";

        }
    } catch (e) {
        debug("Error!!! to open a file, exit", e);
        yield* putTyped(toastActions.openRequest.build(ToastType.Error, "" + e, readerPublicationIdentifier));
        return;
    }

    debug("FilePath=", filePath);
    const fileName = path.basename(filePath).slice(0, -1 * EXT_ANNOTATIONS.length);
    let importedNotes: PublicationNote[] = [];

    try {

        const dataString = yield* callTyped(() => fs.promises.readFile(filePath, { encoding: "utf8" }));
        const publicationView = yield* callTyped(getPublication, publicationIdentifier);
        analyticsParams = buildPublicationUserAnalyticsParams(publicationView);
        const spineItemHrefs = publicationView.r2PublicationJson
            ? getPublicationSpineItemHrefsFromR2PublicationJson(publicationView.r2PublicationJson)
            : undefined;
        const importController = new PublicationNotesImportController({
            publicationNotesController: diMainGet("publication-notes-controller"),
            logger: {
                debug: (...args) => debug("%O", args),
            },
        });
        const importPreview = yield* callTyped(() => importController.preview({
            publicationIdentifier,
            fileName,
            dataString,
            spineItemHrefs,
        }));

        const previewHandled = yield* handlePublicationNotesImportPreviewStatus(
            importPreview,
            readerPublicationIdentifier,
            __,
        );
        if (previewHandled) {
            return;
        }
        if (importPreview.status !== "ready") {
            return;
        }

        yield* putTyped(annotationActions.importTriggerModal.build(
            {
                about: importPreview.about,
                title: importPreview.title || "",
                generated: importPreview.generated || "",
                generator: importPreview.generator,
                annotationsList: importPreview.annotationsList,
                annotationsConflictListOlder: importPreview.annotationsConflictListOlder,
                annotationsConflictListNewer: importPreview.annotationsConflictListNewer,
                importReport: importPreview.importReport,
                winId,
            },
        ));

        const actionConfirmOrAbort = yield* takeTyped(annotationActions.importConfirmOrAbort.build); // not .ID because we need Action return type
        const importDecision = actionConfirmOrAbort?.payload?.state;
        if (!importDecision || importDecision === "abort") {
            debug("ABORTED, exit");
            return;
        }

        const importResult = yield* callTyped(() => importController.apply(importPreview, importDecision));
        importedNotes = importResult.changes.map(({ note }) => note);
        const previousNotes = importResult.changes
            .map(({ previousNote }) => previousNote)
            .filter((note): note is PublicationNote => !!note);

        debug("ready to send", importedNotes.length, "annotation(s) to the annotationImportQueue processed to the reader");

        yield* callTyped(pushNotesFromMainWindow, publicationIdentifier, importedNotes, previousNotes, {
            alreadyPersisted: true,
        });

    } catch (e: any) {
        debug("Error to read the file: ", e);
        if (e?.path !== "") {
            yield* putTyped(toastActions.openRequest.build(ToastType.Error, "" + e, readerPublicationIdentifier));
        }
        return;
    }

    debug("Annotations importer success and exit");
    yield* spawnPublicationAnalyticsEvent(publicationAnalyticsEvents.importAnnotations, analyticsParams);
    yield* putTyped(toastActions.openRequest.build(
        ToastType.Success,
        appendImportedUnresolvedDiagnostics(
            __("message.annotations.success"),
            importedNotes,
            __,
        ),
        readerPublicationIdentifier,
    ));
    return;
}

export function saga() {
    return allTyped([
        takeSpawnLatest(
            annotationActions.importAnnotationSet.ID,
            importAnnotationSet,
            (e) => error(filename_, e),
        ),
        takeSpawnLeading(
            publicationActionsFromMainAction.deletePublication.ID,
            function* (action: publicationActionsFromMainAction.deletePublication.TAction): SagaGenerator<void> {
                debug("RECEIVE PUBLICATION DELETE ACTION");
                debug(action);
                yield* callTyped(() => diMainGet("publication-notes-controller").deleteByPublication(action.payload.publicationIdentifier));
            },
            (e) => error(filename_, e),
        ),
        takeSpawnLatest(
            readerActions.publicationNotes.export.ID,
            exportPublicationNotes,
            (e) => error(filename_, e),
        ),
        takeSpawnLeading(
            readerActions.publicationNotes.exportHtmlResult.ID,
            savePublicationNotesHtmlExport,
            (e) => error(filename_, e),
        ),
        takeSpawnLeading(
            [
                readerActions.publicationNotes.commands.save.ID,
                readerActions.publicationNotes.commands.remove.ID,
            ],
            persistPublicationNoteCommand,
            (e) => error(filename_, e),
        ),
    ]);
}
