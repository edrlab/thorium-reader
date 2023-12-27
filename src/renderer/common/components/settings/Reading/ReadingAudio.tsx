import * as React from "react";

import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import { ICommonRootState } from "readium-desktop/common/redux/states/commonRootState";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useSaveConfig } from "./useSaveConfig";


const ReadingAudio = () => {
    const [__] = useTranslator();
    const captions = useSelector((s: ICommonRootState) => s.reader.defaultConfig.mediaOverlaysEnableCaptionsMode);
    const skippability = useSelector((s: ICommonRootState) => s.reader.defaultConfig.mediaOverlaysEnableSkippability);
    const splitTTStext = useSelector((s: ICommonRootState) => s.reader.defaultConfig.ttsEnableSentenceDetection);

    const saveConfigDebounced = useSaveConfig();


    const options = [
        {
            id: "captions",
            name: "Captions",
            parameter: "mediaOverlaysEnableCaptionsMode",
            action: captions,
            label: `${__("reader.media-overlays.captions")}`,
            description: "Mauris aliquet ligula ac augue aliquet sollicitudin. Nunc eget hendrerit lectus.",
            checked: captions,
            onChange: () => {
                saveConfigDebounced({ mediaOverlaysEnableCaptionsMode: !captions });
            },
        },
        {
            id: "skippability",
            name: "Skippability",
            parameter: "mediaOverlaysEnableSkippability",
            action: skippability,
            label: `${__("reader.media-overlays.skip")}`,
            description: "Ut ex justo, rhoncus vitae magna eget, fringilla ullamcorper ligula.",
            checked: skippability,
            onChange: () => {
                saveConfigDebounced({ mediaOverlaysEnableSkippability: !skippability });
            },
        },
        {
            id: "splitTTStext",
            name: "splitTTStext",
            parameter: "ttsEnableSentenceDetection",
            action: splitTTStext,
            label: `${__("reader.tts.sentenceDetect")}`,
            description: "Nunc at purus ut mauris tincidunt egestas non at velit. In dolor massa, commodo at diam a, dictum faucibus sem.",
            checked: splitTTStext,
            onChange: () => {
                saveConfigDebounced({ ttsEnableSentenceDetection: !splitTTStext });
            },
        },
    ];

    return (
        <div>
            {options.map((option) => (
                <section className={stylesSettings.section} key={option.id}>
                    <div>
                        <input
                            id={option.id}
                            type="checkbox"
                            name={option.name}
                            onChange={option.onChange}
                            defaultChecked={option.checked}
                        />
                        <label htmlFor={option.id}>{option.label}</label>
                        <p className={stylesSettings.session_text}>{option.description}</p>
                    </div>
                </section>

            ))}
        </div>
    );
};

export default ReadingAudio;
