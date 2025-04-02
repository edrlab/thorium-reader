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
// import { AiProviderType } from "readium-desktop/common/redux/states/api_key";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";

// import * as EyeOpenIcon from "readium-desktop/renderer/assets/icons/eye-icon.svg";
// import * as EyeClosedIcon from "readium-desktop/renderer/assets/icons/eye-password-hide-icon.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as OpenAiIcon from "readium-desktop/renderer/assets/icons/open-ai-icon.svg";
import * as LinkIcon from "readium-desktop/renderer/assets/icons/link-icon.svg";
import * as MistralAiIcon from "readium-desktop/renderer/assets/icons/mistral-ai-icon.svg";
import { AiProviderType } from "readium-desktop/common/redux/states/ai_apiKey";

const ApiKeyComponent2 = ({provider}:{provider: string}) => {
    const [__] = useTranslator();
    const dispatch = useDispatch();

    const setKey = React.useMemo(() =>
        debounce((key, provider) => dispatch(apiKeysActions.setKey.build(key, provider)), 200),
        [dispatch],
    );

    const apiKeys = useSelector((state: ICommonRootState) => state.aiApiKeys);
    const apiKey = apiKeys.find(v => v.provider === provider)?.aiKey || "";


    const openAiLink = "https://platform.openai.com/api-keys";
    const mistralAiLink = "https://console.mistral.ai/api-keys";
    const description = `Visit ${provider} website to create and manage your keys. `;

    const openAiPlaceholder = "ex: sk-00000000000000000000000000000000000000000000000000000000000000";
    const mistralPLaceholder = "ex: aBCdef1234567890Abcdef1234567890abcDEf1234567890";


    return (
        <div className={stylesSettings.apiKey_container} key={provider}>
            <p>
                {provider === "openAI" ? (
                    <h4>
                        <SVG svg={OpenAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                        {__("settings.apiKey.openAi")}
                    </h4>
                ) : (
                    <h4>
                        <SVG svg={MistralAiIcon} className={classNames(stylesChatbot.provider_logo, stylesChatbot.openai)} />
                        {__("settings.apiKey.mistral")}
                    </h4>
                )}
            </p>
            <div>
                <ul>
                    <li>
                        {description}
                        <a href={
                            provider === AiProviderType.openAI ? openAiLink : 
                            provider === AiProviderType.mistralAI ? mistralAiLink : 
                            ""
                            } 
                            target="blank"
                        >
                            <SVG svg={LinkIcon} ariaHidden style={{width: "10px", height: "10px"}} />
                        </a>
                    </li>
                </ul>
            </div>
            <form className={stylesSettings.apiKey_input_edit_container}>
                <div className={stylesInput.form_group}>
                    <input
                        name="api-key"
                        className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE"
                        title={provider}
                        defaultValue={apiKey}
                        onChange={(e) => setKey(e.target.value, provider)}
                        placeholder={
                            provider === AiProviderType.openAI ? openAiPlaceholder : 
                            provider === AiProviderType.mistralAI ? mistralPLaceholder : 
                            ""
                            }
                    />
                    <label htmlFor="api-key">{__("settings.apiKey.keyLabel")}</label>
                </div>      
            </form>
        </div>
    );
};

export const ApiKeysList2 = () => {
    const [__] = useTranslator();
    const allProviders = ["openAI", "mistralAI"];

    return (
        <section className={stylesSettings.section} style={{ position: "relative" }}>
            <h4>{__("settings.apiKey.title")}</h4>
            <div className={stylesSettings.session_text}>
                <SVG ariaHidden svg={InfoIcon} />
                <p>{__("settings.apiKey.help")}</p>
            </div>
            {allProviders.map((provider) => {

                return (
                    <ApiKeyComponent2
                        key={provider}
                        provider={provider}
                    />
                );
            })}
        </section>
    );
};
