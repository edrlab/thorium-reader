// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";

import * as React from "react";
import { OVERLAY_Z_INDEX, PopoverArrow } from "readium-desktop/renderer/common/components/overlayHelpers";
import { FocusScope } from "react-aria";
import { DialogTrigger, Pressable, Popover, Dialog as PopoverDialog } from "react-aria-components";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
    noCollisionPadding?: boolean;
}

const Menu = (props: React.PropsWithChildren<IBaseProps>) => {

    const [triggerOpen, setTriggerOpen] = React.useState(false);

    return (
        <DialogTrigger onOpenChange={setTriggerOpen}>
            <Pressable>
                <button className={classNames(stylesDropDown.dropdown_trigger, triggerOpen ? "popover_open" : "")}>
                    {props.button}
                </button>
            </Pressable>
            <Popover
                placement="bottom end"
                offset={10}
                crossOffset={0}
                containerPadding={props.noCollisionPadding ? 0 : 12}
                style={{ zIndex: OVERLAY_Z_INDEX }}
            >
                <PopoverDialog>
                    <FocusScope autoFocus>
                        <div className={stylesDropDown.dropdown_menu}>{props.children}</div>
                        <PopoverArrow className={stylesDropDown.PopoverArrow} aria-hidden />
                    </FocusScope>
                </PopoverDialog>
            </Popover>
        </DialogTrigger>
    );
};

export default (Menu);
