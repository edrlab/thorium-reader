// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export type aiSDKModelIDEnumType = "openai-gpt-4o-mini" | "mistralai-pixtral-12b-2409";

export const aiSDKModelOptions: Array<{ id: aiSDKModelIDEnumType, name: string }> = [
    {
        id: "openai-gpt-4o-mini",
        name: "openAI gpt-4o-mini",
    },
    {
        id: "mistralai-pixtral-12b-2409",
        name: "mistralAI Pixtral 12B",
    },
];
