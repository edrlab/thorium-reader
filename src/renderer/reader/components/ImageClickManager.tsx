// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

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


const Controls = () => {
    const { zoomIn, zoomOut, resetTransform } = useControls();
  
    return (
      <div style={{position: "absolute", display: "flex", flexDirection: "column", zIndex: 105, top: "42%", right: "10px"}}>
        <button className={stylesButtons.button_nav_primary} onClick={() => zoomIn()}>+</button>
        <button className={stylesButtons.button_nav_primary} onClick={() => zoomOut()}>-</button>
        <button className={stylesButtons.button_nav_primary} onClick={() => resetTransform()}>x</button>
      </div>
    );
  };

export const ImageClickManager: React.FC = () => {

    const { open, href, altAttribute, titleAttribute, imageWidth, imageHeight} = useSelector((state: IReaderRootState) => state.img);
    const dispatch = useDispatch();
    const [__] = useTranslator();

    const scaleX = (window.innerHeight - 50) / imageHeight;
    const scaleY = (window.innerWidth - 50) / imageWidth;
    let scale = Math.min(scaleX, scaleY);
    if (scale > 1) scale = 1 

    return (<>

        <Dialog.Root open={open} onOpenChange={(openState: boolean) => {
            if (openState == false) {
                dispatch(readerLocalActionSetImageClick.build());
            }
        }}
        >
            <Dialog.Portal>
                <div className={stylesModals.modal_dialog_overlay}></div>
                <Dialog.Content style={{ width: "100%", height: "100%", backgroundColor: "unset", border: "unset" }} className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
                    <Dialog.Close asChild>
                        <button style={{position: "absolute", top: "10px", right: "10px", zIndex: 105}} className={stylesButtons.button_transparency_icon} aria-label={__("accessibility.closeDialog")}>
                            <SVG ariaHidden={true} svg={QuitIcon} />
                        </button>
                    </Dialog.Close>
                    <TransformWrapper initialScale={scale} minScale={scale / 2} maxScale={4 * scale}>
                        <Controls />
                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%", minHeight: "inherit" }} >
                            <img
                                src={href}
                                alt={altAttribute}
                                title={titleAttribute}
                                tabIndex={0}
                            />
                        </TransformComponent>
                    </TransformWrapper>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    </>);
};
