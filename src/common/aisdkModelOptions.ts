// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const DEFAULT_SYSTEM_PROMPT = "Your goal is to describe the image, you should not answer on a topic other than this image";

export interface IaiSdkModel { id: string, name: string, systemPrompt: string };
export const aiSDKModelOptions: Array<IaiSdkModel> = [
    {
        id: "openai__!__gpt-4o-mini__!__default-prompt",
        name: "openAI gpt-4o-mini (default system prompt)",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
    {
        id: "openai__!__gpt-4o-mini__!__specific-prompt",
        name: "openAI gpt-4o-mini with a specific system prompt",
        systemPrompt: "Your goal is to describe the image, you should not answer on a topic other than this image. The book metadata is {{title}} {{author}} {{publisher}}. The text before the image is {{beforeText}} and the text after is {{afterText}}",
    },
    {
        id: "mistralai__!__pixtral-12b-2409",
        name: "mistralAI Pixtral 12B",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
];
