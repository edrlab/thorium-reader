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

    const options = [
        {
            id: "captions",
            name: "Captions",
            parameter: "mediaOverlaysEnableCaptionsMode",
            action: captions,
            label: `${__("reader.media-overlays.captions")}`,
            description: "Mauris aliquet ligula ac augue aliquet sollicitudin. Nunc eget hendrerit lectus.",
        },
        {
            id: "skippability",
            name: "Skippability",
            parameter: "mediaOverlaysEnableSkippability",
            action: skippability,
            label: `${__("reader.media-overlays.skip")}`,
            description: "Ut ex justo, rhoncus vitae magna eget, fringilla ullamcorper ligula.",
        },
        {
            id: "splitTTStext",
            name: "splitTTStext",
            parameter: "ttsEnableSentenceDetection",
            action: splitTTStext,
            label: `${__("reader.tts.sentenceDetect")}`,
            description: "Nunc at purus ut mauris tincidunt egestas non at velit. In dolor massa, commodo at diam a, dictum faucibus sem.",
        },
    ];

    const saveConfigDebounced = useSaveConfig();

    React.useEffect(() => {
        const captionsInput = document.getElementById("captions") as HTMLInputElement;
        const skipInput = document.getElementById("skippability") as HTMLInputElement;
        const ttsSplitInput = document.getElementById("splitTTStext") as HTMLInputElement;
        if (captions) {
            captionsInput.checked = true;
        }
        if (skippability) {
            skipInput.checked = true;
        }
        if (splitTTStext) {
            ttsSplitInput.checked = true;
        }
    }, []);

    const toggleBox = (parameter: any, action: any) => {
        action = !action;
        switch (parameter) {
            case ("mediaOverlaysEnableCaptionsMode"):
                parameter = { mediaOverlaysEnableCaptionsMode: action };
                break;
            case ("mediaOverlaysEnableSkippability"):
                parameter = { mediaOverlaysEnableSkippability: action };
                break;
        }
        saveConfigDebounced(parameter);
    };

    return (
        <div className={stylesSettings.settings_tab_container_reading_spacing}>
            {options.map((option) => (
                <section className={stylesSettings.section} key={option.id}>
                    <div>
                        <input
                            id={option.id}
                            type="checkbox"
                            name={option.name}
                            onChange={() => toggleBox(option.parameter, option.action)}
                        />
                        <label htmlFor="captions">{option.label}</label>
                        <p>{option.description}</p>
                    </div>
                </section>

            ))}
        </div>
    );
};

export default ReadingAudio;

