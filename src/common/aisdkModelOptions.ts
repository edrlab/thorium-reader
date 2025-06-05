// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const DEFAULT_SYSTEM_PROMPT = "Your goal is to describe the image, you should not answer on a topic other than this image. Answer all requests in {{languages}} unless I explicitly ask you otherwise.";
const ADVANCED_SYSTEM_PROMPT = {
    goal: "describe the image, you should not answer on a topic other than this image. Answer all requests in this language : \"{{languages}}\", unless I explicitly ask you otherwise",
    context: {
        title: "{{title}}",
        author: "{{author}}",
        publisher: "{{publisher}}",
        languages: "{{languages}}",
        text_before: "{{beforeText}}",
        text_after: "{{afterText}}",
        describedby: "{{describedby}}",
        details: "{{details}}",
        figcaption: "{{figcaption}}",
        labelledby: "{{labelledby}}",
    },
};

const ADVANCED_SYSTEM_PROMPT_STRING = JSON.stringify(ADVANCED_SYSTEM_PROMPT);

export interface IaiSdkModel { id: string, name: string, systemPrompt: string };
export const aiSDKModelOptions: Array<IaiSdkModel> = [
    {
        id: "openai__!__gpt-4o-mini__!__default-prompt",
        name: "openAI gpt-4o-mini (default)",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
    {
        id: "openai__!__gpt-4o-mini__!__specific-prompt",
        name: "openAI gpt-4o-mini (advanced)",
        systemPrompt: ADVANCED_SYSTEM_PROMPT_STRING,
    },
    {
        id: "mistralai__!__pixtral-12b-2409",
        name: "mistralAI Pixtral 12B",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
];
