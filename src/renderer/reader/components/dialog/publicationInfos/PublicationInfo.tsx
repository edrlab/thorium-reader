// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import debug_ from "debug";
import * as React from "react";
import { DialogType, DialogTypeName } from "readium-desktop/common/models/dialog";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import TagManager from "./TagManager";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/close-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { PublicationInfoContent } from "readium-desktop/renderer/common/components/dialog/publicationInfos/publicationInfoContent";
import { DialogRAC } from "readium-desktop/renderer/common/components/DialogComponent";

// Logger
const debug = debug_("readium-desktop:renderer:reader:publication-info");
debug("_");

const context = React.createContext<{data: DialogType[DialogTypeName.PublicationInfoReader] | undefined, openDialog: (open: boolean) => void}>({ data: undefined, openDialog: () => undefined });
// export const PublicationInfoReaderWithRadix: React.FC<React.PropsWithChildren<{actionPayload: dialogActions.openRequest.Payload<DialogTypeName.PublicationInfoReader>["data"]}>> = (props) => {
export const PublicationInfoReaderWithRadix: React.FC<React.PropsWithChildren<{ handlePublicationInfo: (open: boolean) => void }>> = (props) => {
    const openDialog = props.handlePublicationInfo;
    const data = useSelector((state: IReaderRootState) =>
        state.dialog.type === DialogTypeName.PublicationInfoReader
            ? state.dialog.data as DialogType[DialogTypeName.PublicationInfoReader]
            : undefined);
    return (
            <context.Provider value={{ data, openDialog }}>
                {props.children}
        </context.Provider>
    );
};

export const PublicationInfoReaderWithRadixTrigger: React.FC<React.PropsWithChildren<{asChild?: boolean}>> = ({ children }) => {
    const { openDialog } = React.useContext(context);
    const trigger = React.Children.only(children) as React.ReactElement<{onClick?: React.MouseEventHandler}>;
    return React.cloneElement(trigger, { onClick: (event) => { trigger.props.onClick?.(event); openDialog(true); } });
};
PublicationInfoReaderWithRadixTrigger.displayName = "PublicationInfoReaderWithRadixTrigger";
export const PublicationInfoReaderWithRadixContent = React.forwardRef<HTMLDivElement>(
    (_props, forwardRef) => {
        const appOverlayElement = React.useMemo(() => document.getElementById("app-overlay"), []);
        const [__] = useTranslator();
        const open = useSelector((state: IReaderRootState) => state.dialog.open && state.dialog.type === DialogTypeName.PublicationInfoReader);
        const dispatch = useDispatch();
        return (
            <DialogRAC
                isOpen={open}
                title={__("catalog.bookInfo")}
                overlayClassName={stylesModals.modal_dialog_overlay}
                contentRef={forwardRef}
                UNSTABLE_portalContainer={appOverlayElement ?? undefined}
                onOpenChange={(isOpen) => { if (!isOpen) { dispatch(dialogActions.closeRequest.build()); } }}
                content={
                    <>
                        <div className={stylesModals.modal_dialog_header}>
                            <h1>{__("catalog.bookInfo")}</h1>
                            <button data-css-override="" className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")} onClick={() => dispatch(dialogActions.closeRequest.build())}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </div>
                        <div className={stylesModals.modal_dialog_body}>
                            <PublicationInfoWithRadixContent />
                        </div>
                    </>
                }
            />
        );
    },
);
PublicationInfoReaderWithRadixContent.displayName = "PublicationInfoReaderWithRadixContent";

const PublicationInfoWithRadixContent = () => {
    const { data } = React.useContext(context);
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const manifestUrlR2Protocol = useSelector((state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol);
    const dispatch = useDispatch();

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
            manifestUrlR2Protocol={manifestUrlR2Protocol}
            handleLinkUrl={data.handleLinkUrl}
            // toggleCoverZoomCb={toggleCoverZoom}
            TagManagerComponent={TagManager}
            // coverZoom={coverZoom}
            focusWhereAmI={data.focusWhereAmI}
            pdfPlayerNumberOfPages={data.pdfPlayerNumberOfPages}
            divinaNumberOfPages={data.divinaNumberOfPages}
            divinaContinousEqualTrue={data.divinaContinousEqualTrue}
            readerReadingLocation={data.readerReadingLocation}
            closeDialogCb={() => dispatch(dialogActions.closeRequest.build())}
        >
        </PublicationInfoContent>
    );
};
