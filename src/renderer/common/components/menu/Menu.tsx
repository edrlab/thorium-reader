// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";

import * as React from "react";
import { ViewportBoundary } from "readium-desktop/renderer/common/components/overlayHelpers";
import { FocusScope } from "react-aria";
import { DialogPortalContext } from "readium-desktop/renderer/common/components/Dialog";
import { DialogTrigger, Pressable, Popover, Dialog as PopoverDialog } from "react-aria-components";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
    noCollisionPadding?: boolean;
}

const Menu = (props: React.PropsWithChildren<IBaseProps>) => {

    const [triggerOpen, setTriggerOpen] = React.useState(false);

    const collisionValue = location.hash === "#/home" ? 10 : 280;

    return (
        <DialogTrigger onOpenChange={setTriggerOpen}>
            <Pressable>
                <button className={classNames(stylesDropDown.dropdown_trigger, triggerOpen ? "popover_open" : "")}>
                    {props.button}
                </button>
            </Pressable>
            <DialogPortalContext.Consumer>
                {(portalContainer) => (
                    <ViewportBoundary top={props.noCollisionPadding ? 0 : collisionValue}>
                        {(boundaryElement) => (
                            <Popover
                                UNSTABLE_portalContainer={portalContainer}
                                boundaryElement={boundaryElement}
                                placement="bottom end"
                                offset={5}
                                crossOffset={-10}
                                containerPadding={0}
                                style={{ zIndex: 101 }}
                            >
                                <PopoverDialog>
                                    <FocusScope autoFocus>
                                        <div className={stylesDropDown.dropdown_menu}>{props.children}</div>
                                    </FocusScope>
                                </PopoverDialog>
                            </Popover>
                        )}
                    </ViewportBoundary>
                )}
            </DialogPortalContext.Consumer>
        </DialogTrigger>
    );
};

export default (Menu);
