// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Root as DialogRoot, RootProps } from "./Dialog";

export type AlertDialogProps = Omit<RootProps, "children" | "modal" | "alert"> & React.PropsWithChildren;

export function Root(props: AlertDialogProps) {
    return <DialogRoot {...props} alert>{props.children}</DialogRoot>;
}

export { Trigger, Portal, Content, Title, Description, Cancel, Action } from "./Dialog";
