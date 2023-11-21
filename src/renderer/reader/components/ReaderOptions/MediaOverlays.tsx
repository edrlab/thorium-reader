import * as React from "react";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

const MediaOverlays = (props: any) => {
    const { readerConfig } = props;
    const [__] = useTranslator();

    const toggleMediaOverlaysEnableSkippability = () => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        readerConfig.mediaOverlaysEnableSkippability = !readerConfig.mediaOverlaysEnableSkippability;
        props.setSettings(readerConfig);
    };
    const toggleTTSEnableSentenceDetection = () => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        readerConfig.ttsEnableSentenceDetection = !readerConfig.ttsEnableSentenceDetection;
        props.setSettings(readerConfig);
    };
    const toggleMediaOverlaysEnableCaptionsMode = () => {
        // TODO: smarter clone?
        const readerConfig = JSON.parse(JSON.stringify(props.readerConfig));

        readerConfig.mediaOverlaysEnableCaptionsMode = !readerConfig.mediaOverlaysEnableCaptionsMode;

        // TTS and MO both use the same checkbox, for "Captions / clean view"
        readerConfig.ttsEnableOverlayMode = !readerConfig.ttsEnableOverlayMode;

        props.setSettings(readerConfig);
    };

    return (<>
        <div className={stylesReader.mathml_section}>
            <input
                id="mediaOverlaysEnableCaptionsModeCheckBox"
                type="checkbox"
                checked={readerConfig.mediaOverlaysEnableCaptionsMode}
                onChange={() => toggleMediaOverlaysEnableCaptionsMode()}
            />
            <label htmlFor="mediaOverlaysEnableCaptionsModeCheckBox">{
                __("reader.media-overlays.captions")
            }</label>
        </div>
        <div className={stylesReader.mathml_section}>
            <input
                id="mediaOverlaysEnableSkippabilityCheckBox"
                type="checkbox"
                checked={readerConfig.mediaOverlaysEnableSkippability}
                onChange={() => toggleMediaOverlaysEnableSkippability()}
            />
            <label htmlFor="mediaOverlaysEnableSkippabilityCheckBox">{
                __("reader.media-overlays.skip")
            }</label>
        </div>
        <div className={stylesReader.mathml_section}>
            <input
                id="ttsEnableSentenceDetectionCheckBox"
                type="checkbox"
                checked={readerConfig.ttsEnableSentenceDetection}
                onChange={() => toggleTTSEnableSentenceDetection()}
            />
            <label htmlFor="ttsEnableSentenceDetectionCheckBox">{
                __("reader.tts.sentenceDetect")
            }</label>
        </div>
    </>);
};

export default MediaOverlays;
