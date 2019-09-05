// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import OpdsAddForm from "./OpdsAddForm";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/hoc/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import FeedList from "./FeedList";

class Opds extends React.Component<TranslatorProps> {
    public render(): React.ReactElement<{}>  {
        const { __ } = this.props;
        return (
            <LibraryLayout title={__("header.catalogs")}>
                <OpdsAddForm />
                <FeedList />
            </LibraryLayout>
        );
    }
}

export default withTranslator(Opds);
