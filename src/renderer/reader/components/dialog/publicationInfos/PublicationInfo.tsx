// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";

import debug_ from "debug";
import * as React from "react";
import { OverlayTriggerStateContext, VisuallyHidden } from "react-aria-components";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { URL_HOST_COMMON, URL_PATH_PREFIX_PUB, URL_PROTOCOL_THORIUMHTTPS } from "readium-desktop/common/streamerProtocol";
import { convertHttpUrlToCustomScheme } from "readium-desktop/r2-xxx-js/r2-navigator-js/electron/common/sessions";
import { encodeURIComponent_RFC3986 } from "readium-desktop/r2-xxx-js/r2-utils-js/_utils/http/UrlUtils";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import * as Dialog from "readium-desktop/renderer/common/components/Dialog";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { PublicationInfoContent } from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import TagManager from "./TagManager";

// Logger
const debug = debug_("readium-desktop:renderer:reader:publication-info");
debug("_");

const context = React.createContext<DialogType[DialogTypeName.PublicationInfoReader] | undefined>(undefined);
// export const PublicationInfoReaderWithRAC: React.FC<React.PropsWithChildren<{actionPayload: dialogActions.openRequest.Payload<DialogTypeName.PublicationInfoReader>["data"]}>> = (props) => {
export const PublicationInfoReaderWithRAC: React.FC<React.PropsWithChildren<{ handlePublicationInfo: (open: boolean) => void }>> = (props) => {
    const defaultOpen = false;

    // const dispatch = useDispatch();
    const open = useSelector((state: IReaderRootState) => state.dialog.open && state.dialog.type === DialogTypeName.PublicationInfoReader);
    const data = useSelector((state: IReaderRootState) =>
        state.dialog.type === DialogTypeName.PublicationInfoReader
            ? state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader]
            : undefined);
    return (
        <Dialog.Root
            defaultOpen={defaultOpen}
            isOpen={open}
            onOpenChange={
                (open) => {
                    // if (open) {
                        // dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoReader, props.actionPayload));
                        props.handlePublicationInfo(open);
                    // } else {
                        // dispatch(dialogActions.closeRequest.build());
                    // }
                }}
        >
            <context.Provider value={data}>
                {props.children}
            </context.Provider>
        </Dialog.Root>
    );
};

export const PublicationInfoReaderWithRACTrigger = Dialog.Trigger;
PublicationInfoReaderWithRACTrigger.displayName = Dialog.Trigger.displayName;
export const PublicationInfoReaderWithRACContent = React.forwardRef<HTMLElement>(
    ({ ...props }, forwardRef) => {
        const [__] = useTranslator();
        return (
            <Dialog.Portal className={stylesModals.modal_dialog_overlay}>
                <Dialog.Content className={stylesModals.modal_dialog} {...props} ref={forwardRef} aria-describedby={undefined}>
                    <VisuallyHidden>
                        <Dialog.Title>{__("catalog.bookInfo")}</Dialog.Title>
                    </VisuallyHidden>
                    <div className={stylesModals.modal_dialog_header}>
                        {/* <Dialog.Title className="DialogTitle">{__("catalog.bookInfo")}</Dialog.Title> */}
                        <h1>{__("catalog.bookInfo")}</h1>
                        <Dialog.Close asChild>
                            <button
                                data-css-override=""
                                className={stylesButtons.button_transparency_icon}
                                aria-label={__("accessibility.closeDialog")}
                            >
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div className={stylesModals.modal_dialog_body}>
                        <PublicationInfoWithRACContent />
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        );
    },
);
PublicationInfoReaderWithRACContent.displayName = "PublicationInfoReaderWithRACContent";

const PublicationInfoWithRACContent = () => {
    const data = React.useContext(context);

    // const manifestUrlR2Protocol_ = useSelector((state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol);
    // const manifestUrlHttp_ = useSelector((state: IReaderRootState) => state.reader.info.manifestUrlHttp);
    // const manifestUrlHttp = manifestUrlHttp_.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL) ? convertCustomSchemeToHttpUrl(manifestUrlHttp_) : manifestUrlHttp_;
    // const filesystemPath = useSelector((state: IReaderRootState) => state.reader.info.filesystemPath);
    // const pubPathBase64 = decodeURIComponent(manifestUrlHttp.replace(/\/manifest.json$/, "").replace(`${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}/${URL_PATH_PREFIX_PUB}/`, ""));
    // const filesystemPath_ = Buffer.from(pubPathBase64, "base64").toString();
    const publicationIdentifier = useSelector((state: IReaderRootState) => state.reader.info.publicationIdentifier);
    const publicationViewIdentifier = useSelector((state: IReaderRootState) => state.reader.info.publicationView.identifier);
    const manifestUrlR2Protocol_pub_id_not_path = convertHttpUrlToCustomScheme(`${URL_PROTOCOL_THORIUMHTTPS}://${URL_HOST_COMMON}/${URL_PATH_PREFIX_PUB}/${encodeURIComponent_RFC3986(Buffer.from(publicationIdentifier || publicationViewIdentifier, "utf8").toString("base64"))}/manifest.json`);

    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);

    const dialogState = React.useContext(OverlayTriggerStateContext);

    if (!data) {
        return <></>;
    }
    if (!data.publication) {
        return <></>;
    }

    return (
        <PublicationInfoContent
            publicationViewMaybeOpds={data.publication}
            r2Publication={r2Publication}
            manifestUrlR2Protocol={manifestUrlR2Protocol_pub_id_not_path}
            handleLinkUrl={data.handleLinkUrl}
            // toggleCoverZoomCb={toggleCoverZoom}
            TagManagerComponent={TagManager}
            // coverZoom={coverZoom}
            focusWhereAmI={data.focusWhereAmI}
            pdfPlayerNumberOfPages={data.pdfPlayerNumberOfPages}
            divinaNumberOfPages={data.divinaNumberOfPages}
            divinaContinousEqualTrue={data.divinaContinousEqualTrue}
            readerReadingLocation={data.readerReadingLocation}
            // Use the same close path as Escape and the close button so reader shortcuts are restored.
            closeDialogCb={() => dialogState?.close()}
        >
        </PublicationInfoContent>
    );
};
