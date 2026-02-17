// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
// import { publicationActions as publicationActionsCommon, wizardActions } from "readium-desktop/common/redux/actions";

import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { publicationActions } from "../redux/actions";

export const PublicationCheckerModal = () => {
    const [__] = useTranslator();
    const dispatch = useDispatch();
    const opened = useSelector((state: ILibraryRootState) => state.publicationIntegrityChecker.open);

    return <Dialog.Root defaultOpen={!opened} onOpenChange={(openState: boolean) => {
        if (openState == false) {
            dispatch(publicationActions.closePublicationChecker.build());
        }
    }}
    >
        {/* <Dialog.Trigger asChild>
        <button title={__("header.settings")}>
            <h3>Visite Guidée</h3>
        </button>
        </Dialog.Trigger> */}
        <Dialog.Portal>
            <div className={stylesModals.modal_dialog_overlay}></div>
            <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
                
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>;
};
