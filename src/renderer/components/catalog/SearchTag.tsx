// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as Autosuggest from "react-autosuggest";

interface SearchContainerProps {
    tagTabs: string[];
}

export class SearchContainer extends React.Component<SearchContainerProps> {
    public constructor(props: any) {
        super(props);
        this.state = {
            value: "",
            suggestions: [],
        };
    }

    public render(): React.ReactElement<{}> {
        return ();
    }

    private getSuggestions(value: string): any[] {
        let escapedValue: string;
        value.trim();
        escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (escapedValue === "") {
            return [];
        }
        const regex = new RegExp("^" + escapedValue, "i");
    }



}
