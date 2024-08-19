import * as React from 'react';
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import { ComboBox, ComboBoxItem } from "readium-desktop/renderer/common/components/ComboBox";
import { useReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { ttsVoice as r2navigatorSetTTSVoice } from "@r2-navigator-js/electron/renderer/index";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { Collection, Header as ReactAriaHeader, Section } from "react-aria-components";
import { HoverEvent } from "@react-types/shared";
import { getVoices, groupByLanguage, IVoices } from "readium-speech/build/cjs/voices";

export interface IProps {}

// let voices: IVoices[] = [];
// getVoices().then((_voices) => {
//     voices = _voices;
// });

type IVoicesWithIndex = IVoices & { id: number };

export const VoiceSelection: React.FC<IProps> = () => {

    const [__, translator] = useTranslator();

    const ttsVoice = useReaderConfig("ttsVoice");
    const setConfig = useSaveReaderConfig();
    
    const [voices, setVoices] = React.useState<IVoicesWithIndex[]>([]);
    const handleTTSVoice = (voice: IVoices) => {
        const v = voice ? {
            default: false,
            lang: voice.language,
            localService: voice.offlineAvailability,
            name: voice.name,
            voiceURI: voice.voiceURI,
        } : null;
        r2navigatorSetTTSVoice(v);
        // this.setState({ ttsVoice: v });
        // this.props.setConfig({ ...this.props.readerConfig, ttsVoice: v }, this.props.session);
        setConfig({ ttsVoice: v });
    }

    React.useEffect(() => {
        getVoices().then((_voices) => {
            setVoices(_voices.map((v, i) => ({...v, id: i+1})));
        });
    }, []);

    let voiceComboBoxDefaultItems: Map<string, IVoicesWithIndex[]> = new Map([["", undefined]]);
    let defaultVoiceName = "";
    if (!voices) {

    } else {
        const voicesMapped = voices.map((v, i) => ({ ...v, id: i + 1 }));
        if (voices.some(({ id }: any) => !id)) {
            setVoices(voicesMapped);
        }
        voiceComboBoxDefaultItems = groupByLanguage(voicesMapped, undefined, translator?.getLocale()) as Map<string, IVoicesWithIndex[]>;
        const [voicesFromFirstLanguages] = voiceComboBoxDefaultItems.values();
        if (voicesFromFirstLanguages) {
            const firstVoice = voicesFromFirstLanguages[0];
            if (firstVoice) {
                defaultVoiceName = firstVoice.name || "";
                if (!ttsVoice) {
                    handleTTSVoice(firstVoice);
                }
            }
        }
    }

    return (<div className={stylesReader.ttsSelectVoice}>
        <ComboBox
            label={__("reader.tts.voice")}
            defaultItems={voiceComboBoxDefaultItems}
            defaultInputValue={defaultVoiceName}
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

                            id={`TTSID${voice.id}`} key={`TTSKEY${voice.id}`}>{`${voice.name}`}
                        </ComboBoxItem>}
                    </Collection>
                </Section>)}
        </ComboBox>
    </div>)
}