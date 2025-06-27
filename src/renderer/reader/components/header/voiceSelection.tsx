// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { Collection, Header as ReactAriaHeader, ListBoxSection } from "react-aria-components";
import { HoverEvent } from "@react-types/shared";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { IVoices, ILanguages } from "readium-speech";

export type TLanguageOptions = Array<{ id: string, name: string, count: number }>;
export type TVoiceOptions = Array<{ id: string, name: string, children: Array<{ id: string, name: string }> }>;

export interface IProps {
    // defaultVoices: IVoices[],
    languages: ILanguages[];
    selectedLanguage: ILanguages;
    setSelectedLanguage: (v: ILanguages) => void;
    voicesGroupByRegion: Array<[regionCode: string, voices: IVoices[]]>;
    selectedVoice: IVoices;
    setSelectedVoice: (v: IVoices) => void;
}

const createNameId = ({ name, voiceURI, language, index }: Pick<IVoices, "name" | "voiceURI" | "language"> & { index?: number }) => `${index || 0}__!!__${name}__!?__${voiceURI}__!?__${language}`;

export const VoiceSelection: React.FC<IProps> = (props) => {

    const [__] = useTranslator();

    const { languages, selectedLanguage, setSelectedLanguage, voicesGroupByRegion, selectedVoice, setSelectedVoice } = props;

    const languageOptions: TLanguageOptions = languages.map(({ label, count, code }, index) => ({ id: `${index}__!?__${code}`, name: label, count }));
    const voiceOptions: TVoiceOptions = voicesGroupByRegion.map(
        ([langLocalized, voices], index1) => ({
            id: `${index1}__!!__${langLocalized}`, name: langLocalized, children: voices.map(
                ({ name, voiceURI, language }, index2) => ({ id: createNameId({ name, voiceURI, language, index: index1 << 8 * index2}), name })),
        }));

    const voices = voicesGroupByRegion.reduce<IVoices[]>((acc, [__unusedLangLocalized, voices]) => [...acc, ...voices], []);

    // console.log("LANGUAGEOPTIONS=", languageOptions);
    // console.log("VOICEOPTIONS", voiceOptions);

    const selectedLanguageKey = languageOptions.find(({ id }) => id.split("__!?__")[1] === selectedLanguage?.code)?.id;
    const selectedVoiceKey = selectedVoice
        ? voiceOptions
            .map(({ children }) => children)
            .reduce((acc, cv) => [...acc, ...cv])
            .find(({ id }) => id.split("__!!__")[1] === createNameId(selectedVoice).split("__!!__")[1])?.id
        : undefined;

    console.log("selectedVoiceKey:", selectedVoice, selectedVoiceKey);

    return (
        <div className={stylesReader.ttsSelectVoice}>
            <ComboBox
                style={{ paddingBottom: 0 }}
                label={__("reader.tts.language")}
                aria-label={__("reader.tts.language")}
                defaultItems={languageOptions}
                defaultSelectedKey={selectedLanguageKey}
                selectedKey={selectedLanguageKey}
                onSelectionChange={(key) => {

                    if (key === null) {
                        // nothing
                    } else {

                        const found = languages.find(({ code }) => typeof key === "string" && code === key.split("__!?__")[1]);
                        if (found) {
                            setSelectedLanguage(found);
                        }
                    }
                }}
            >
                {item => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
            </ComboBox>
            <ComboBox
                label={__("reader.tts.voice")}
                aria-label={__("reader.tts.voice")}
                defaultItems={voiceOptions}
                defaultSelectedKey={selectedVoiceKey}
                selectedKey={selectedVoiceKey}
                onSelectionChange={(key) => {
                    if (key === null || key === -1) {
                        // nothing
                    } else {

                        console.log("KEY=", key);
                        const found = voices.find((voice) => typeof key === "string" && createNameId(voice).split("__!!__")[1] === key.split("__!!__")[1]);
                        if (found) {
                            setSelectedVoice(found);
                        }
                    }
                }}
                style={{ paddingBottom: 0, margin: 0 }}
            >
                {
                    (section) =>
                        <ListBoxSection id={section.id}>
                            <ReactAriaHeader
                                style={{ paddingLeft: "5px", fontSize: "16px", color: "var(--color-blue)", borderBottom: "1px solid var(--color-light-blue)" }}
                            >
                                {section.name}
                            </ReactAriaHeader>
                            <Collection items={section.children}>
                                {
                                    (item) => <ComboBoxItem
                                        onHoverStart={(e: HoverEvent) => {
                                            if (!e.target.getAttribute("title")) {
                                                e.target.setAttribute("title", item.name);
                                            }
                                        }}
                                        // aria-label={item.name}
                                        id={item.id}
                                    >
                                        {item.name}
                                    </ComboBoxItem>
                                }
                            </Collection>

                        </ListBoxSection>
                }
            </ComboBox>
        </div>
    );
};
