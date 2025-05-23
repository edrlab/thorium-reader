// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import * as React from "react";
import { PublicationView } from "readium-desktop/common/views/publication";
import PublicationExportButton from "./PublicationExportButton";
import DeletePublicationConfirm from "../../dialog/DeletePublicationConfirm";
import { PublicationInfoLibWithRadix, PublicationInfoLibWithRadixContent, PublicationInfoLibWithRadixTrigger } from "../../dialog/publicationInfos/PublicationInfo";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/export-icon.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as TrashIcon from "readium-desktop/renderer/assets/icons/trash-icon.svg";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as ImportIcon from "readium-desktop/renderer/assets/icons/import.svg";
import { publicationActions } from "readium-desktop/common/redux/actions";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { ImportAnnotationsDialog } from "../../../../common/components/ImportAnnotationsDialog";
import { exportAnnotationSet } from "readium-desktop/renderer/common/redux/sagas/readiumAnnotation/export";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_PUB_NOTES } from "readium-desktop/common/streamerProtocol";
import debounce from "debounce";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { getSaga } from "readium-desktop/renderer/library/createStore";

const CatalogMenu: React.FC<{ publicationView: PublicationView }> = (props) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const locale = useSelector((state: ILibraryRootState) => state.i18n.locale);

    return (
        <>
            <PublicationInfoLibWithRadix
                publicationView={props.publicationView}
            >
                <PublicationInfoLibWithRadixTrigger asChild>
                    <button
                        className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                    >
                        <SVG ariaHidden svg={InfoIcon} />
                        <p>{__("catalog.bookInfo")}</p>
                    </button>
                </PublicationInfoLibWithRadixTrigger>
                <PublicationInfoLibWithRadixContent
                />
            </PublicationInfoLibWithRadix>
            <div style={{ borderBottom: "1px solid var(--color-blue)" }}></div>
            {props.publicationView.lastReadTimeStamp ?
                <button
                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                    onClick={() => {
                        const pubId = props.publicationView.identifier;
                        dispatch(publicationActions.readingFinished.build(pubId));

                        // just to refresh allPublicationPage.tsx
                        apiDispatch(dispatch)()("publication/readingFinishedRefresh")();
                    }}>
                    <SVG ariaHidden svg={DoubleCheckIcon} />
                    {__("publication.markAsRead")}
                </button>
                : <></>
            }
            <div style={{ borderBottom: "1px solid var(--color-blue)" }}></div>
            <DeletePublicationConfirm
                trigger={(
                    <button
                        className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                    >
                        <SVG ariaHidden svg={TrashIcon} />
                        <p>{__("catalog.delete")}</p>
                    </button>
                )}
                publicationView={props.publicationView}
            />
            <div style={{ borderBottom: "1px solid var(--color-blue)" }}></div>
            <PublicationExportButton
                publicationView={props.publicationView}
            />
            <div style={{ borderBottom: "1px solid var(--color-blue)" }}></div>
            <ImportAnnotationsDialog winId={undefined} publicationView={props.publicationView}>
                <button
                    className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                >
                    <SVG ariaHidden svg={ImportIcon} />
                    {__("catalog.importAnnotation")}
                </button>
            </ImportAnnotationsDialog>
            <div style={{ borderBottom: "1px solid var(--color-blue)" }}></div>
            <button
                className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                onClick={debounce(async () => {
                    try {

                        const url = `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_PUB_NOTES}/publication-notes/${props.publicationView.identifier}`;
                        console.log("NOTE_URL", url);
                        const notes = await (await fetch(url)).json();
                        const title = convertMultiLangStringToString(props.publicationView.publicationTitle, locale) || "annotation";
                        let label = title.slice(0, 200);
                        label = label.trim();
                        label = label.replace(/[^a-z0-9_-]/gi, "_");
                        label = label.replace(/^_+|_+$/g, ""); // leading and trailing underscore
                        label = label.replace(/^\./, ""); // remove dot start
                        label = label.toLowerCase();

                        // Be careful Selector can be not settled on th3.0 / th3.1 publication, you need to open it first to generate selectors for each notes
                        // TODO: add a dialog to warm user on incorrect notes

                        await getSaga().run(exportAnnotationSet, notes, props.publicationView, label, "annotation").toPromise();
                    } catch (e) {
                        console.error("EXPORT NOTES:", e);
                    }
                }, 1000, { immediate: true })}
            >
            <SVG ariaHidden svg={SaveIcon} />
            {__("catalog.exportAnnotation")}
        </button >
        </>
    );
};

export default (CatalogMenu);
