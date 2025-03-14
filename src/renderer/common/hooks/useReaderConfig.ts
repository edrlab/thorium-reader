// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { useSelector } from "./useSelector";
import { ReaderConfig, ReaderConfigPublisher } from "readium-desktop/common/models/reader";
import { useDispatch } from "./useDispatch";
import * as React from "react";
import { readerLocalActionSetConfig, readerLocalActionSetTransientConfig } from "readium-desktop/renderer/reader/redux/actions";
import debounce from "debounce";
import { equals } from "ramda";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

export const useReaderConfigAll = () => {
    const config = useSelector((state: IReaderRootState) => state.reader.config);

    return config;
};

export function useReaderConfig<T extends keyof ReaderConfig>(key: T): ReaderConfig[T] {
    const config = useSelector((state: IReaderRootState) => state.reader.config);

    return config[key];
}

export const usePublisherReaderConfig = (key: keyof ReaderConfigPublisher) => {
    return useReaderConfig(key);
};

export const useSaveReaderConfig = () => {
    const dispatch = useDispatch();

    const cb = React.useCallback(
        (state: Partial<ReaderConfig>) => {

            dispatch(readerLocalActionSetConfig.build(state));
        }, [dispatch]);

    return cb;
};

export const useSaveReaderConfigDebounced = () => {
    const cb = useSaveReaderConfig();

    // XXeslint-disable-next-line react-hooks/exhaustive-deps
    // const debounceCB = React.useCallback(debounce(cb, 400), [cb]);
    // https://legacy.reactjs.org/docs/hooks-reference.html#usecallback
    const debounceCB = React.useMemo(() => debounce(cb, 400), [cb]);
    return debounceCB;
};

export const useSavePublisherReaderConfig = () => {
    const dispatch = useDispatch();
    const setReaderConfig = useSaveReaderConfig();

    const cb = React.useCallback(
        (state: Partial<ReaderConfigPublisher>) => {

            dispatch(readerLocalActionSetTransientConfig.build(state));
            setReaderConfig(state);
        }, [dispatch, setReaderConfig]);

    return cb;
};

export const useSavePublisherReaderConfigDebounced = () => {
    const cb = useSavePublisherReaderConfig();

    // XXeslint-disable-next-line react-hooks/exhaustive-deps
    // const debounceCB = React.useCallback(debounce(cb, 400), [cb]);
    // https://legacy.reactjs.org/docs/hooks-reference.html#usecallback
    const debounceCB = React.useMemo(() => debounce(cb, 400), [cb]);
    return debounceCB;
};

export const useDiffBoolBetweenReaderConfigAndDefaultConfig = () => {
    const config = useSelector((state: IReaderRootState) => state.reader.config);
    const defaultConfig = useSelector((state: IReaderRootState) => state.reader.defaultConfig);

    const diff = React.useMemo(() => {

        for (const v of ObjectKeys(config)) {

            // skip tab section change
            if (v === "readerMenuSection") {
                continue ;
            }
            if (v === "readerSettingsSection") {
                continue ;
            }

            if (v === "ttsVoices") {
                // skip ttsVoices with readium/speech 
                continue ;
            }
            if (!equals(config[v], defaultConfig[v])) {
                return true;
            }
        }
        return false;
    }, [config, defaultConfig]);

    return diff;
};
