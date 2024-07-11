// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Collection, Key, Section, Header as ReactAriaHeader } from "react-aria-components";
import styleCascading from "readium-desktop/renderer/assets/styles/components/cascadingSelect.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { HoverEvent } from "@react-types/shared";

type VoiceWithIndex = SpeechSynthesisVoice & { id: number };

interface IProps {
    voices : {
        lang: string;
        voices: VoiceWithIndex[];
    }[];
    handleTTSVoice: (voice: SpeechSynthesisVoice) => void;
    voicesWithIndex: VoiceWithIndex[];
    ttsVoice: SpeechSynthesisVoice[] | SpeechSynthesisVoice;
    pubLang: string;
}

const languageObjects = [
    { id: 0, lang: "default", code: "default" },
    { id: 1, lang: "Arabic", code: "ar" },
    { id: 2, lang: "Bulgarian", code: "bg" },
    { id: 3, lang: "Catalan", code: "ca" },
    { id: 4, lang: "Czech", code: "cs" },
    { id: 5, lang: "Danish", code: "da" },
    { id: 6, lang: "German", code: "de" },
    { id: 7, lang: "Greek", code: "el" },
    { id: 8, lang: "Spanish", code: "es" },
    { id: 9, lang: "Finish", code: "fi" },
    { id: 10, lang: "French", code: "fr" },
    { id: 11, lang: "Hebrew", code: "he" },
    { id: 12, lang: "Hindi", code: "hi" },
    { id: 13, lang: "Croatian", code: "hr" },
    { id: 14, lang: "Hungarian", code: "hu" },
    { id: 15, lang: "Indonesian", code: "id" },
    { id: 16, lang: "Italian", code: "it" },
    { id: 17, lang: "Japanese", code: "ja" },
    { id: 18, lang: "Korean", code: "ko" },
    { id: 19, lang: "Malay", code: "ms" },
    { id: 20, lang: "Norwegian", code: "no" },
    { id: 21, lang: "Dutch", code: "nl" },
    { id: 22, lang: "Polish", code: "pl" },
    { id: 23, lang: "Portuguese", code: "pt" },
    { id: 24, lang: "Romanian", code: "ro" },
    { id: 25, lang: "Russian", code: "ru" },
    { id: 26, lang: "Slovak", code: "sk" },
    { id: 27, lang: "Swedish", code: "sv" },
    { id: 28, lang: "Thai", code: "th" },
    { id: 29, lang: "Turkish", code: "tr" },
    { id: 30, lang: "English", code: "en", defaultVoice: "Bonnes nouvelles" },
    { id: 31, lang: "Vietnamese", code: "vi" },
    { id: 32, lang: "Chinese", code: "zh" },
];

export const CascadingSelect : React.FC<IProps> = (props) => {
    const [selectedCategory, setSelectedCategory] = React.useState<string>(
        languageObjects.find((voice) => voice.code === props.pubLang).lang,
    );
    const [items, setItems] = React.useState<IProps["voices"]>(
        props.voices.filter((elem) => elem.lang.includes(languageObjects.find((voice) => voice.code === props.pubLang).code)),
    );
    const [selectedItem, setSelectedItem] = React.useState<string>(() => {
        if (props.ttsVoice && Array.isArray(props.ttsVoice)) {
            const voice = props.ttsVoice.find((voice) => voice.lang.includes(props.pubLang));
            if (voice && voice.name) {
                return voice.name;
            } else {
                const languageObject = languageObjects.find((voice) => voice.code === props.pubLang);
                return languageObject.defaultVoice;
            }
        } else if (props.ttsVoice && !Array.isArray(props.ttsVoice)) {
            console.log("ttsVoice", props.ttsVoice.name);
            return props.ttsVoice.name;
        }
        return items[0].voices[0].name;
    });
    const [__] = useTranslator();

    const handleCategoryChange = (event: Key) => {
        const lang = event.toString();
        const index = languageObjects.findIndex((language) => language.lang === lang);
        const currentVoices = props.voices.filter((elem) => elem.lang.includes(languageObjects[index].code));
        setSelectedCategory(lang);
        setItems(currentVoices);
        setSelectedItem("");
    };

    console.log("category:", selectedCategory);
    console.log("items", items);
    return (
      <div className={styleCascading.cascadingSelect}>
        <ComboBox
            id="category"
            label={"Language"}
            defaultItems={languageObjects}
            defaultInputValue={selectedCategory}
            // selectedKey={selectedCategory}
            onSelectionChange={(event) => handleCategoryChange(event)}
            style={{ paddingBottom: "0", margin: "0" }}
        >
            {item => <ComboBoxItem id={item.lang} key={`TTSKEY${item.id}`}>{item.lang}</ComboBoxItem>}
        </ComboBox>

        <ComboBox
            id="item"
            label={"Voice"}
            defaultItems={items}
            defaultInputValue={selectedItem}
            isDisabled={items.length === 0}
            // selectedKey={
            //     props.ttsVoice ?
            //         `TTSID${(props.voicesWithIndex.find((voice) =>
            //             voice.name === props.ttsVoice[0].name
            //             && voice.lang === props.ttsVoice[0].lang
            //             && voice.voiceURI === props.ttsVoice[0].voiceURI,
            //         ) || { id: -1 }).id}` :
            //         "TTSID-1"
            // }
            onSelectionChange={(key) => {
                if (!key) return;

                key = key.toString();
                const id = parseInt(key.replace("TTSID", ""), 10);
                const v = id === -1 ? null : (props.voicesWithIndex.find((voice) => voice.id === id) || null);
                props.handleTTSVoice(v);
            }}
            style={{ paddingBottom: "0", margin: "0" }}
        >
            {section => (
                <Section id={section.lang} key={`section-${section.lang}`}>
                    <ReactAriaHeader style={{ paddingLeft: "5px", fontSize: "16px", color: "var(--color-blue)", borderBottom: "1px solid var(--color-light-blue)" }}>
                        {section.lang}
                    </ReactAriaHeader>
                    <Collection items={section.voices} key={`collection-${section.lang}`}>
                        {voice => <ComboBoxItem
                            onHoverStart={(e: HoverEvent) => {
                                if (!e.target.getAttribute("title")) {
                                    e.target.setAttribute("title", voice.name);
                                }
                            }}
                            // aria-label={item.name}

                            id={`TTSID${voice.id}`} key={`TTSKEY${voice.id}`}>{`${voice.name}${voice.default ? " *" : ""}`}
                        </ComboBoxItem>}
                    </Collection>
                </Section>)}
        </ComboBox>
      </div>
    );
  };
