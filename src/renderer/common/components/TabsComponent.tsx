// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import {
    Tab as TabReactAria,
    TabList as TabListReactAria,
    TabPanel as TabPanelReactAria,
    TabPanels as TabPanelsReactAria,
    Tabs as TabsReactAria,
} from "react-aria-components";

type TTabsReactAriaProps = Parameters<typeof TabsReactAria>[0];
export interface TabsProps extends Omit<TTabsReactAriaProps, "children"> {
    children: React.ReactNode;
}

export function Tabs({ children, ...props }: TabsProps) {
    return (
        <TabsReactAria {...props}>
            {children}
        </TabsReactAria>
    );
}

export function TabList<T extends object>(props: Parameters<typeof TabListReactAria<T>>[0]) {
    return <TabListReactAria {...props} />;
}

export function Tab(props: Parameters<typeof TabReactAria>[0]) {
    return <TabReactAria {...props} />;
}

export function TabPanels(props: Parameters<typeof TabPanelsReactAria>[0]) {
    return <TabPanelsReactAria {...props} />;
}

export function TabPanel(props: Parameters<typeof TabPanelReactAria>[0]) {
    return <TabPanelReactAria {...props} />;
}
