import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { Collection, Header as ReactAriaHeader, Section } from "react-aria-components";
import { HoverEvent } from "@react-types/shared";
import { filterOnLanguage, groupByRegions, IVoices, getLanguages } from "readium-speech";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

export interface IProps {
    voices: IVoicesWithIndex[],
    handleTTSVoice: (v: IVoicesWithIndex) => void,
}

type IVoicesWithIndex = IVoices & { id: number };

export const VoiceSelection: React.FC<IProps> = (props) => {

    const [__] = useTranslator();

    const ttsVoice = useReaderConfig("ttsVoice");
    const { voices, handleTTSVoice } = props;

    const [selectedLanguage, setSelectedLanguage] = React.useState<string>("");
    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const locale = useSelector((state: IReaderRootState) => state.i18n.locale);

    const languages = getLanguages(voices, r2Publication.Metadata?.Language || [], locale);
    const ttsVoiceDefaultLanguageCode = (ttsVoice?.lang || "").split("-")[0];
    const defaultLanguageCode =  languages.find(({code}) => code === ttsVoiceDefaultLanguageCode)
        ? ttsVoiceDefaultLanguageCode
        : languages[0]?.code || ""; 

    if (selectedLanguage === "" && defaultLanguageCode) {
        setSelectedLanguage(defaultLanguageCode);
    }

    const voicesFilteredOnLanguage = filterOnLanguage(voices, selectedLanguage || "") as IVoicesWithIndex[];
    const voicesGroupedByRegions = groupByRegions(voicesFilteredOnLanguage, r2Publication.Metadata?.Language || [], locale) as Map<string, IVoicesWithIndex[]>;

    return (<div className={stylesReader.ttsSelectVoice}>
        <ComboBox
        style={{paddingBottom: "0"}}
            label={__("reader.tts.language")}
            defaultItems={languages}
            // defaultSelectedKey={`TTS_LANG_${selectedLanguage}`}
            selectedKey={`TTS_LANG_${selectedLanguage}`}
            onSelectionChange={
                (key: React.Key) => {
                    setSelectedLanguage(((key as string) || "").split("TTS_LANG_")[1] || "");
                }}
        >
            {item => <ComboBoxItem id={`TTS_LANG_${item.code}`} key={`TTS_LANG_${item.code}`}>{item.label}</ComboBoxItem>}
        </ComboBox>
        <ComboBox
            label={__("reader.tts.voice")}
            defaultItems={voicesGroupedByRegions}
            selectedKey={
                ttsVoice ?
                `TTSID${(voices.find((voice) =>
                    voice.name === ttsVoice.name
                    && voice.language === ttsVoice.lang
                    && voice.voiceURI === ttsVoice.voiceURI,
                ) || { id: -1 }).id}` :
                "TTSID-1"
            }
            onSelectionChange={(key) => {
                if (!key) return;

                key = key.toString();
                const id = parseInt(key.replace("TTSID", ""), 10);
                const v = id === -1 ? null : (voices.find((voice) => voice.id === id) || null);
                handleTTSVoice(v);
            }}
            style={{ paddingBottom: "0", margin: "0" }}
        >
            {([lang, voicesSelected]) => (
                <Section id={lang} key={`section-${lang}`}>
                    <ReactAriaHeader style={{ paddingLeft: "5px", fontSize: "16px", color: "var(--color-blue)", borderBottom: "1px solid var(--color-light-blue)" }}>
                        {lang}
                    </ReactAriaHeader>
                    <Collection items={voicesSelected} key={`collection-${lang}`}>
                        {voice => <ComboBoxItem
                            onHoverStart={(e: HoverEvent) => {
                                if (!e.target.getAttribute("title")) {
                                    e.target.setAttribute("title", voice.name);
                                }
                            }}
                            // aria-label={item.name}

                            id={`TTSID${voice.id}`} key={`TTSKEY${voice.id}`}>{`${voice.label}`}
                        </ComboBoxItem>}
                    </Collection>
                </Section>)}
        </ComboBox>
    </div>);
};
