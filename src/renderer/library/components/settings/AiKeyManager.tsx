// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import classNames from "classnames";
import debounce from "debounce";

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesChatbot from "readium-desktop/renderer/assets/styles/chatbot.scss";
import * as stylesInput from "readium-desktop/renderer/assets/styles/components/inputs.scss";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { apiKeysActions } from "readium-desktop/common/redux/actions";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

// import * as EyeOpenIcon from "readium-desktop/renderer/assets/icons/eye-icon.svg";
// import * as EyeClosedIcon from "readium-desktop/renderer/assets/icons/eye-password-hide-icon.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as OpenAiIcon from "readium-desktop/renderer/assets/icons/open-ai-icon.svg";
import * as LinkIcon from "readium-desktop/renderer/assets/icons/link-icon.svg";
import * as MistralAiIcon from "readium-desktop/renderer/assets/icons/mistral-ai-icon.svg";
import * as GeminiIcon from "readium-desktop/renderer/assets/icons/gemini.svg";
import { AIProviderFamily } from "readium-desktop/common/AIModels";

const AiKeyCard = ({ provider }: { provider: AIProviderFamily }) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const apiKeys = useSelector((state: ICommonRootState) => state.aiApiKeys);
    const apiKey = apiKeys.find(v => v.provider === provider)?.aiKey || "";
    const inputRef = React.useRef(null);
    const [isFocused, setIsFocused] = React.useState(false);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        inputRef.current.blur();
      }
    };

    const setKey = React.useMemo(() =>
        debounce((aiKey, provider) => dispatch(apiKeysActions.setKey.build(aiKey, provider)), 200),
        [dispatch],
    );

    const openAiLink = "https://platform.openai.com/api-keys";
    const mistralAiLink = "https://console.mistral.ai/api-keys";
    const geminiAiLink = "https://aistudio.google.com/apikey";
    const openAiPlaceholder = "ex: sk-0000000000000000000000000000000000000000000000";
    const mistralPLaceholder = "ex: aBCdef1234567890Abcdef1234567890abcDEf1234567890";
    const geminiPlaceholder = "ex: AI...";


    return (
        <div className={stylesSettings.apiKey_container} key={provider}>
            <div>
                {provider === "openAI" ? (
                    <h4>
                        <SVG svg={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                        {__("settings.apiKey.openAi")}
                    </h4>
                ) : provider === "mistralAI" ? (
                    <h4>
                        <SVG svg={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                        {__("settings.apiKey.mistral")}
                    </h4>
                ) : <h4>
                    <SVG svg={GeminiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                    {"gemini"}
                </h4>
                }
            </div>
            <div>
                <ul>
                    <li>
                        {__("settings.apiKey.howTo1", { provider: provider })}
                        <a href={provider === "openAI" ? openAiLink : provider === "mistralAI" ? mistralAiLink : geminiAiLink} target="blank" style={{ marginLeft: "3px" }}>
                            <SVG svg={LinkIcon} ariaHidden style={{ width: "10px", height: "10px" }} />
                        </a>
                    </li>
                    <li>{__("settings.apiKey.howTo2", { provider: provider })}</li>
                    <li>{__("settings.apiKey.howTo3", { provider: provider })}</li>
                </ul>
            </div>
            <form className={stylesSettings.apiKey_input_edit_container} onSubmit={(e) => e.preventDefault()}>
                <div className={stylesInput.form_group} style={{ transition: "500ms", border: isFocused || !apiKey ? "1px solid var(--color-light-grey)" : "1px solid transparent", borderRadius: isFocused || !apiKey ? "6px" : "unset" }}>
                    <input
                        name="api-key"
                        className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                        title={provider}
                        defaultValue={apiKey}
                        onChange={(e) => setKey(e.target.value, provider)}
                        placeholder={
                            provider === "openAI" ? openAiPlaceholder :
                                provider === "mistralAI" ? mistralPLaceholder :
                                    geminiPlaceholder
                        }
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={handleKeyDown}
                        ref={inputRef}
                        style={{ transition: "500ms", backgroundColor: isFocused || !apiKey ? "var(--color-annotations-txt-area)" : "inherit", borderBottom: isFocused || !apiKey ? "1px solid transparent" : "1px solid var(--color-light-grey)" }}
                    />
                    <label htmlFor="api-key">{__("settings.apiKey.keyLabel")}</label>
                </div>
            </form>
        </div>
    );
};

export const ApiKeysList = () => {
    const [__] = useTranslator();
    const allProviders: AIProviderFamily[] = ["openAI", "mistralAI", "geminiAI"];

    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4>{__("settings.apiKey.title")}</h4>
            <div className={stylesSettings.session_text}>
                <SVG ariaHidden svg={InfoIcon} />
                <p>{__("settings.apiKey.help")}</p>
            </div>
            {
                allProviders.map((provider) => {
                    return (
                        <AiKeyCard
                            key={provider}
                            provider={provider}
                        />
                    );
                })}
        </section>
    );
};
