import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { ttsVoice as r2navigatorSetTTSVoice } from "@r2-navigator-js/electron/renderer/index";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { Collection, Header as ReactAriaHeader, Section } from "react-aria-components";
import { HoverEvent } from "@react-types/shared";
import { filterOnLanguage, getLanguages, getVoices, groupByRegions, IVoices } from "readium-speech/build/cjs/voices";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";

export interface IProps {}

type IVoicesWithIndex = IVoices & { id: number };

export const VoiceSelection: React.FC<IProps> = () => {

    const [__] = useTranslator();

    const ttsVoice = useReaderConfig("ttsVoice");
    const setConfig = useSaveReaderConfig();

    const r2Publication = useSelector((state: IReaderRootState) => state.reader.info.r2Publication);
    const locale = useSelector((state: IReaderRootState) => state.i18n.locale);
    
    const [voices, setVoices] = React.useState<IVoicesWithIndex[]>([]);
    const [selectedLanguage, setSelectedLanguage] = React.useState<string>("");
    const handleTTSVoice = (voice: IVoices) => {
        const v = voice ? {
            default: false,
            lang: voice.language,
            localService: voice.offlineAvailability,
            name: voice.name,
            voiceURI: voice.voiceURI,
        } : null;
        r2navigatorSetTTSVoice(v);
        setConfig({ ttsVoice: v });
    };

    React.useEffect(() => {
        getVoices().then((_voices) => {
            if (Array.isArray(_voices)) {
                setVoices(_voices.map((v, i) => ({...v, id: i+1})));
            }
        });
    }, []);

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

    const firstVoice = ((Array.from(voicesGroupedByRegions)[0] || [])[1] || [])[0];
    if (firstVoice) {
        if (ttsVoice) {
            if (firstVoice.voiceURI === ttsVoice.voiceURI && firstVoice.name === ttsVoice.name && firstVoice.language === ttsVoice.lang) {
                // nothing
            } else {
                if (firstVoice.language.split("-")[0] === ttsVoice.lang.split("-")[0]) {
                    // nothing
                } else {
                    // when language code switch, change the default ttsVoice
                    handleTTSVoice(firstVoice);
                }
            }
        } else {
            // if there is no default TTSVoice, set the first voice returned par getVoices
            handleTTSVoice(firstVoice);
        }
    }

    return (<div className={stylesReader.ttsSelectVoice}>
        <ComboBox
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
