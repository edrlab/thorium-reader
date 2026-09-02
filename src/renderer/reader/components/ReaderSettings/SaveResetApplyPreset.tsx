// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesSettings from "readium-desktop/renderer/assets/styles/components/settings.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as React from "react";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as SaveIcon from "readium-desktop/renderer/assets/icons/floppydisk-icon.svg";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as ResetIcon from "readium-desktop/renderer/assets/icons/clock-reverse-icon.svg";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { useDiffBoolBetweenReaderConfigAndDefaultConfig, useReaderConfig, useSavePublisherReaderConfig, useSaveReaderConfig } from "readium-desktop/renderer/common/hooks/useReaderConfig";
import { readerActions } from "readium-desktop/common/redux/actions";
import { comparePublisherReaderConfig } from "readium-desktop/common/publisherConfig";
import debounce from "debounce";

export const SaveResetApplyPreset = () => {

    const dispatch = useDispatch();
    const readerConfig = useSelector((state: IReaderRootState) => state.reader.config);
    const setReaderConfig = useSaveReaderConfig();
    const setPublisherConfig = useSavePublisherReaderConfig();
    const readerDefaultConfig = useSelector((state: IReaderRootState) => state.reader.defaultConfig);
    const allowCustomCheckboxChecked = useSelector((state: IReaderRootState) => state.reader.allowCustomConfig.state);
    const publisherConfigOverrided = !comparePublisherReaderConfig(readerDefaultConfig, readerConfigInitialState);
    const diffBetweenDefaultConfigAndConfig = useDiffBoolBetweenReaderConfigAndDefaultConfig();

    const dockingMode = useReaderConfig("readerDockingMode");
    const dockedMode = dockingMode !== "full";

    const cb = React.useCallback(() => {

        const { ttsVoices: __ttsVoiceUNUSED, readerSettingsSection: __readerSettingsSectionUNUSED, readerMenuSection: __readerMenuSectionUNUSED, ...readerDefaultConfigWithoutSomeDefaultKeys} = readerDefaultConfig;
        setReaderConfig(readerDefaultConfigWithoutSomeDefaultKeys);

        if (allowCustomCheckboxChecked) {
            if (publisherConfigOverrided) {
                setPublisherConfig(readerDefaultConfigWithoutSomeDefaultKeys);
            } else {
                dispatch(readerActions.allowCustom.build(false));
            }
        } else {
            if (publisherConfigOverrided) {
                setPublisherConfig(readerDefaultConfigWithoutSomeDefaultKeys);
                dispatch(readerActions.allowCustom.build(true));
            } else {
                // nothing to do
            }
        }
    }, [allowCustomCheckboxChecked, dispatch, publisherConfigOverrided, readerDefaultConfig, setPublisherConfig, setReaderConfig]);
    const applyPreferredConfig = React.useMemo(() => debounce(cb, 400), [cb]);

    const [__] = useTranslator();
    return (

        <div className={stylesSettings.preset_settings_container}>
            <div>
                <button className={stylesButtons.button_secondary_blue} style={{maxWidth: dockedMode ? "284px" : "", height: dockedMode ? "fit-content" : "30px"}} onClick={() => {
                    dispatch(readerActions.configSetDefault.build(readerConfig));
                }} disabled={!diffBetweenDefaultConfigAndConfig}>
                    <SVG ariaHidden={true} svg={SaveIcon} />
                    {__("reader.settings.preset.save")}</button>
                <p>{__("reader.settings.preset.saveDetails")}</p>
            </div>

            <div>
                <button className={stylesButtons.button_secondary_blue} style={{maxWidth: dockedMode ? "284px" : "", height: dockedMode ? "fit-content" : "30px"}} onClick={applyPreferredConfig}>
                    <SVG ariaHidden={true} svg={DoubleCheckIcon} />
                    {__("reader.settings.preset.apply")}
                </button>
                <p>{__("reader.settings.preset.applyDetails")}</p>
            </div>

            <div>
                <button className={stylesButtons.button_secondary_blue} style={{maxWidth: dockedMode ? "284px" : "", height: dockedMode ? "fit-content" : "30px"}} onClick={() => {
                    dispatch(readerActions.configSetDefault.build(readerConfigInitialState));
                    applyPreferredConfig();
                }}>
                    <SVG ariaHidden={true} svg={ResetIcon} />
                    {__("reader.settings.preset.reset")}
                </button>
                <p>{__("reader.settings.preset.resetDetails")}</p>
            </div>
        </div>
    );
};
