// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

interface MenuButtonProps {
    menuId: string;
    open: boolean;
    toggle: () => void;
}

export default class Header extends React.Component<MenuButtonProps, undefined> {
    public constructor(props: any) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { toggle, open, menuId, children } = this.props;
        return (
            <button
                aria-expanded={open}
                aria-controls={menuId}
                onClick={toggle}
            >
                {children}
            </button>
        );
    }
}
