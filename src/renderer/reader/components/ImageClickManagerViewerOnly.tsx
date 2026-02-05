// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

import * as ResetIcon from "readium-desktop/renderer/assets/icons/backward-icon.svg";
import * as PlusIcon from "readium-desktop/renderer/assets/icons/add-alone.svg";
import * as MinusIcon from "readium-desktop/renderer/assets/icons/Minus-Bold.svg";

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as Dialog from "@radix-ui/react-dialog";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { readerLocalActionSetImageClick } from "../redux/actions";
import classNames from "classnames";

import SVG from "readium-desktop/renderer/common/components/SVG";
import * as QuitIcon from "readium-desktop/renderer/assets/icons/baseline-close-24px.svg";

import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
    const [__] = useTranslator();

    return (
        <>
        <style>{`

.imgViewerControls {
    // position: absolute;
    align-items: center;
    justify-content: center;
    z-index: 105;
    // transform: translate(-50%, 50%);
    display: flex;
    // opacity: 0;
    transition: 200ms;
    gap: 10px;
    margin-top: 10px;
}

.imgViewerControls button {
        border-radius: 6px;
        background-color: var(--color-brand-secondary);
        padding: 0 5px;
        color: var(--color-brand-primary);
        fill: var(--color-brand-primary);
        border: 1px solid var(--color-brand-primary);
        filter: opacity(0.8);
        transition: 200ms;
        width: 24px;
        height: 24px;
}
        
.imgViewerControls button:hover {
    filter: opacity(1);
}

.imgViewerControls svg {
    width: 15px;
    height: 15px;
    fill: var(--color-brand-primary);
}
        `}</style>
            <div style={{ bottom: "20px", right: "50%", left: "50%" }} className="imgViewerControls">
                <button title={__("reader.imgViewer.zoomIn")} onClick={() => zoomIn()}><SVG svg={PlusIcon} /></button>
                <button title={__("reader.imgViewer.zoomOut")} onClick={() => zoomOut()}><SVG svg={MinusIcon} /></button>
                <button title={__("reader.imgViewer.zoomReset")} onClick={() => resetTransform()}><SVG svg={ResetIcon} /></button>
            </div>
        </>
    );
};

export const ImageClickManagerImgViewerOnly: React.FC = () => {

    const { open, isSVGFragment, HTMLImgSrc_SVGImageHref_SVGFragmentMarkup, altAttributeOf_HTMLImg_SVGImage_SVGFragment, titleAttributeOf_HTMLImg_SVGImage_SVGFragment, ariaLabelAttributeOf_HTMLImg_SVGImage_SVGFragment, naturalWidthOf_HTMLImg_SVGImage, naturalHeightOf_HTMLImg_SVGImage, dom_describedbyText, dom_detailsText, dom_figcaptionText, dom_labelledByText } = useSelector((state: IReaderRootState) => state.img);
    const dispatch = useDispatch();
    const [__] = useTranslator();

    const scaleX = naturalWidthOf_HTMLImg_SVGImage ? ((window.innerHeight - 50) / naturalWidthOf_HTMLImg_SVGImage) : 1;
    const scaleY = naturalHeightOf_HTMLImg_SVGImage ? ((window.innerWidth - 50) / naturalHeightOf_HTMLImg_SVGImage) : 1;
    let scale = Math.min(scaleX, scaleY);
    if (scale > 1) scale = 1;

    const descriptions = [
        { label: __("reader.imgViewer.description.details"), value: dom_detailsText },
        { label: __("reader.imgViewer.description.figcaption"), value: dom_figcaptionText },
        { label: __("reader.imgViewer.description.describedby"), value: dom_describedbyText },
        { label: __("reader.imgViewer.description.labelledby"), value: dom_labelledByText },
    ];

    const hasAlt = !!altAttributeOf_HTMLImg_SVGImage_SVGFragment;
    const activeDescriptions = descriptions.filter(d => !!d.value);
    const hasOtherDescriptions = activeDescriptions.length > 0;

    const imageHasDescription = hasAlt || hasOtherDescriptions;
    const imageHasOnlyAltDescription = hasAlt && !hasOtherDescriptions;

    const DescriptionList = (
        <details style={{ fontSize: "14px", cursor: "pointer" }}>
            <summary>
                {altAttributeOf_HTMLImg_SVGImage_SVGFragment || __("reader.imgViewer.description.about")}
            </summary>
            <ul style={{ marginTop: "10px", listStyleType: "none", paddingLeft: 0 }}>
                {activeDescriptions.map(({ label, value }) => (
                    <li key={label} style={{ marginBottom: "10px" }}>
                        <strong>{label}: </strong> {value}
                    </li>
                ))}
            </ul>
        </details>
    );

    const imageDescription = imageHasOnlyAltDescription 
        ? altAttributeOf_HTMLImg_SVGImage_SVGFragment 
        : DescriptionList;

    return (<>

        <Dialog.Root open={open} onOpenChange={(openState: boolean) => {
            if (openState == false) {
                dispatch(readerLocalActionSetImageClick.build());
            }
        }}
        >
            <Dialog.Portal>
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined} style={{ minWidth: "700px", minHeight: "400px", padding: "5px 10px", width: "unset", maxWidth: "calc(100% - 200px)", maxHeight: "calc(100% - 100px)" }} >
                    <VisuallyHidden>
                        <Dialog.DialogTitle>{__("reader.imgViewer.title")}</Dialog.DialogTitle>
                    </VisuallyHidden>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "end" }}>
                        <Dialog.Close asChild>
                            <button style={{ zIndex: 105 }} className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                                <SVG ariaHidden={true} svg={QuitIcon} />
                            </button>
                        </Dialog.Close>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", padding: "5px 10px", alignItems: "center", flex: 1 }}>
                        <div className={stylesModals.imageViewerContent}>
                            <div style={{transition: "600ms ease-in-out"}}>
                            <TransformWrapper initialScale={scale} minScale={scale / 2} maxScale={4 * scale}>
                                <TransformComponent wrapperStyle={{ display: "flex", margin: "auto", width: "90%", height: "90%", minHeight: "350px", flex: "1", position: "relative", transition: "600ms ease-in-out" }} >
                                    <img
                                        style={{ height: "100%", width: "100%", maxHeight: "calc(100vh - 250px)", backgroundColor: "white", color: "black", fill: "currentcolor", stroke: "currentcolor" }}
                                        src={isSVGFragment ? ("data:image/svg+xml;base64," + Buffer.from(HTMLImgSrc_SVGImageHref_SVGFragmentMarkup).toString("base64")) : HTMLImgSrc_SVGImageHref_SVGFragmentMarkup}
                                        alt={altAttributeOf_HTMLImg_SVGImage_SVGFragment}
                                        title={titleAttributeOf_HTMLImg_SVGImage_SVGFragment}
                                        aria-label={ariaLabelAttributeOf_HTMLImg_SVGImage_SVGFragment}
                                        tabIndex={0}
                                    />
                                </TransformComponent>
                                <Controls />
                            </TransformWrapper>
                            </div>
                            {imageHasDescription && (
                                <div style={{ width: "100%", marginTop: "10px" }}>
                                    {imageDescription}
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </>);
};
