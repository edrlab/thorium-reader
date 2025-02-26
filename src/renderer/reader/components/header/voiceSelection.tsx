import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { Collection, Header as ReactAriaHeader, ListBoxSection } from "react-aria-components";
import { HoverEvent } from "@react-types/shared";
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

const createNameId = ({ name, voiceURI, language, label }: Pick<IVoices, "name" | "voiceURI" | "label" | "language">) => `${name}__!?__${voiceURI}__!?__${label}__!?__${language}`;

export const VoiceSelection: React.FC<IProps> = (props) => {

    const [__] = useTranslator();

    const { languages, selectedLanguage, setSelectedLanguage, voicesGroupByRegion, selectedVoice, setSelectedVoice } = props;

    const languageOptions: TLanguageOptions = languages.map(({ label, count, code }) => ({ id: code, name: label, count }));
    const voiceOptions: TVoiceOptions = voicesGroupByRegion.map(
        ([langLocalized, voices]) => ({
            id: langLocalized, name: langLocalized, children: voices.map(
                ({ name, voiceURI, label, language }) => ({ id: createNameId({ name, voiceURI, label, language }), name })),
        }));

    const voices = voicesGroupByRegion.reduce<IVoices[]>((acc, [__unusedLangLocalized, voices]) => [...acc, ...voices], []);

    console.log("LANGUAGEOPTIONS=", languageOptions);
    console.log("VOICEOPTIONS", voiceOptions);


    const defaultSelectedLanguage = selectedLanguage?.code;
    const defaultSelectedVoice = selectedVoice ? createNameId(selectedVoice) : undefined;

    return (
        <div className={stylesReader.ttsSelectVoice}>
            <ComboBox
                style={{ paddingBottom: "0" }}
                label={__("reader.tts.language")}
                aria-label={__("reader.tts.language")}
                defaultItems={languageOptions}
                defaultSelectedKey={defaultSelectedLanguage}
                onSelectionChange={(key) => {

                    if (key === null) {
                        // nothing
                    } else {

                        const found = languages.find(({ code }) => code === key);
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
                defaultSelectedKey={defaultSelectedVoice}
                onSelectionChange={(key) => {

                    if (key === null || key === -1) {
                        // nothing
                    } else {

                        const found = voices.find((voice) => createNameId(voice) === key);
                        if (found) {
                            setSelectedVoice(found);
                        }
                    }
                }}
                style={{ paddingBottom: "0", margin: "0" }}
            >
                {
                    (section) =>
                        <ListBoxSection id={section.id}>
                            <ReactAriaHeader style={{ paddingLeft: "5px", fontSize: "16px", color: "var(--color-blue)", borderBottom: "1px solid var(--color-light-blue)" }}>
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
