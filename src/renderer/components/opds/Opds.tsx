// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import OpdsAddForm from "./OpdsAddForm";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import OpdsList from "./OpdsList";

export default class Opds extends React.Component<{}, null> {
    public render(): React.ReactElement<{}>  {
        return (
            <LibraryLayout>
                <OpdsAddForm />
                <OpdsList />
            </LibraryLayout>
        );
    }
}
