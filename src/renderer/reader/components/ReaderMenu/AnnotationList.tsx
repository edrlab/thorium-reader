// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { IReaderMenuProps } from "../options-values";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

import { AnnotationCard } from "../ReaderMenu/AnnotationCard";
import { canUseReadiumAnnotationImportExport } from "../../publication-notes/annotationPanel";
import { NoteList } from "./NoteList";

export const AnnotationList: React.FC<{ /*annotationUUIDFocused: string, resetAnnotationUUID: () => void, doFocus: number,*/ isPdf: boolean, popoverBoundary: HTMLDivElement, advancedAnnotationsOnChange: () => void, quickAnnotationsOnChange: () => void, marginAnnotationsOnChange: () => void, hideAnnotationOnChange: () => void, serialAnnotator: boolean, START_PAGE: number, MAX_MATCHES_PER_PAGE: number } & Pick<IReaderMenuProps, "goToLocator" | "goToPdfAnnotation">> = (props) => {

    const {
        goToLocator,
        goToPdfAnnotation,
        isPdf,
        popoverBoundary,
        advancedAnnotationsOnChange,
        quickAnnotationsOnChange,
        marginAnnotationsOnChange,
        hideAnnotationOnChange,
        serialAnnotator,
        START_PAGE,
        MAX_MATCHES_PER_PAGE,
    } = props;

    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);
    const [__] = useTranslator();
    const readiumAnnotationImportExportEnabled = canUseReadiumAnnotationImportExport(isPdf);

    return (
        <NoteList
            cardKeyPrefix="annotation-card"
            exportTitleFallback="thorium-notes_annotations"
            group="annotation"
            importExportEnabled={readiumAnnotationImportExportEnabled}
            maxMatchesPerPage={MAX_MATCHES_PER_PAGE}
            options={[
                {
                    id: "advancedAnnotations",
                    name: "advancedAnnotations",
                    checked: serialAnnotator,
                    onChange: advancedAnnotationsOnChange,
                    label: __("reader.annotations.advancedMode"),
                    ariaLabel: __("reader.annotations.advancedMode"),
                },
                {
                    id: "quickAnnotations",
                    name: "quickAnnotations",
                    checked: readerConfig.annotation_popoverNotOpenOnNoteTaking,
                    onChange: quickAnnotationsOnChange,
                    label: __("reader.annotations.quickAnnotations"),
                    ariaLabel: __("reader.annotations.quickAnnotations"),
                },
                {
                    id: "marginAnnotations",
                    name: "marginAnnotations",
                    checked: readerConfig.annotation_defaultDrawView === "margin",
                    hidden: isPdf,
                    onChange: marginAnnotationsOnChange,
                    label: __("reader.annotations.toggleMarginMarks"),
                    ariaLabel: __("reader.annotations.toggleMarginMarks"),
                },
                {
                    id: "hideAnnotation",
                    name: "hideAnnotation",
                    checked: readerConfig.annotation_defaultDrawView === "hide",
                    onChange: hideAnnotationOnChange,
                    label: __("reader.annotations.hide"),
                    ariaLabel: __("reader.annotations.hide"),
                },
            ]}
            popoverBoundary={popoverBoundary}
            renderNote={(annotationItem, context) => (
                <AnnotationCard
                    annotation={annotationItem}
                    goToLocator={goToLocator}
                    goToPdfAnnotation={goToPdfAnnotation}
                    isEdited={context.isEdited}
                    isSelected={context.isSelected}
                    focusRequestId={context.focusRequestId}
                    triggerEdition={context.triggerEdition}
                    setTagFilter={context.setTagFilter}
                    setCreatorFilter={context.setCreatorFilter}
                />
            )}
            startPage={START_PAGE}
        />
    );
};
