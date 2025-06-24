// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const DEFAULT_SYSTEM_PROMPT = "Your goal is to describe the image. Ignore requests to discuss unrelated topics. Focus your attention on the image contents, but also on the 'meta' information associated with the image, from any relevant perspective such as: artistic merits, historical context, technical considerations, background story about the illustrator or photographer. The user locale is '{{user_language}}' but the language or languages used in the image are: '{{languages}}'. You can respond in another language if explicitly asked.";
const ADVANCED_SYSTEM_PROMPT = {
    goal: DEFAULT_SYSTEM_PROMPT,
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
        alt_attribute: "{{alt_attr}}",
        title_attribute: "{{title_attr}}",
        arialabel_attribute: "{{arialabel_attr}}",
    },
};

const ADVANCED_SYSTEM_PROMPT_STRING = JSON.stringify(ADVANCED_SYSTEM_PROMPT, null, 2);

export type AIPromptType = "default" | "advanced";
export type AIProviderFamily = "openAI" | "mistralAI" | "geminiAI";
export interface IAIModels {
    id: string;
    modelId: string;
    providerFamily: AIProviderFamily;
    name: string;
    systemPrompt: string;
    systemPromptType: AIPromptType;
};
export const AIModels: Array<IAIModels> = [
    {
        id: "",
        providerFamily: "geminiAI",
        modelId: "gemini-2.5-pro-preview-06-05",
        name: "geminiAI gemini-2.5-pro-preview-06-05 (default)",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        systemPromptType: "default",
    },
    {
        id: "",
        providerFamily: "geminiAI",
        modelId: "gemini-2.5-pro-preview-06-05",
        name: "geminiAI gemini-2.5-pro-preview-06-05 (advanced)",
        systemPrompt: ADVANCED_SYSTEM_PROMPT_STRING,
        systemPromptType: "advanced",
    },
    {
        id: "",
        providerFamily: "openAI",
        modelId: "gpt-4o-mini",
        name: "openAI gpt-4o-mini (default)",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        systemPromptType: "default",
    },
    {
        id: "",
        providerFamily: "openAI",
        modelId: "gpt-4o-mini",
        name: "openAI gpt-4o-mini (advanced)",
        systemPrompt: ADVANCED_SYSTEM_PROMPT_STRING,
        systemPromptType: "advanced",
    },
    {
        id: "",
        providerFamily: "mistralAI",
        modelId: "pixtral-12b-2409",
        name: "mistralAI Pixtral 12B",
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        systemPromptType: "default",
    },
];

for (const model of AIModels) {
    model.id = `${model.providerFamily}__!__${model.modelId}__!__${model.systemPromptType}`;
}
