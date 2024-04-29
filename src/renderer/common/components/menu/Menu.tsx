// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as stylesDropDown from "readium-desktop/renderer/assets/styles/components/dropdown.scss";
import * as Popover from "@radix-ui/react-popover";
import classNames from "classnames";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    button: React.ReactElement;
}

const Menu = (props: React.PropsWithChildren<IBaseProps>) => {

    const [triggerOpen, setTriggerOpen] = React.useState(false);

    const collisionValue = location.hash === "#/home" ? 10 : 280;
    const collision: Partial<Record<"top", number>> = {top : collisionValue};
    
    return (
        <Popover.Root onOpenChange={() => setTriggerOpen(!triggerOpen)}>
            <Popover.Trigger asChild>
                <button className={classNames(stylesDropDown.dropdown_trigger, triggerOpen ? "popover_open" : "")}>
                    {props.button}
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content sideOffset={5} align="end" alignOffset={-10} hideWhenDetached collisionPadding={collision}>
                    <div className={stylesDropDown.dropdown_menu}>
                        {props.children}
                    </div>
                    <Popover.Arrow className={stylesDropDown.PopoverArrow} aria-hidden />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

export default (Menu);
