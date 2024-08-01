// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


export interface IVoices extends SpeechSynthesisVoice {
    id: number
}

export interface IVoicesLanguages {
    count: number;
    language: string;
}

export const voices = (): IVoices[] => {

    const voicesWithIndex = speechSynthesis.getVoices()
        .reduce((acc, curr) => {
            const found = acc.find((voice) => {
                return voice.lang === curr.lang &&
                    voice.name === curr.name &&
                    voice.localService === curr.localService &&
                    voice.voiceURI === curr.voiceURI
                    // voice.default === curr.default
                    ;
            });
            if (!found) {
                acc.push(curr);
            }
            return acc;
        }, [] as SpeechSynthesisVoice[])
        .map<IVoices>((voice, i) => (
            {id: i, name: voice.name, default: voice.default, lang: voice.lang, localService: voice.localService, voiceURI: voice.voiceURI}
        ));

    return voicesWithIndex;
}

export const languages = (_voices?: IVoices[] | undefined) => {
    if (!_voices) {
        _voices = voices();
    }

    interface ILangToVoicesMap {
        [key: string]: IVoices[];
    }
    const langToVoicesMap = _voices.reduce((acc, voice) => {
        if (!acc[voice.lang]) {
            acc[voice.lang] = [] as Array<IVoices>;
        }
        acc[voice.lang].push(voice);
        return acc;
    }, {} as ILangToVoicesMap);

    return Object.keys(langToVoicesMap).map((lang) => 
        ({
            language: lang,
            count: langToVoicesMap[lang].length,
        }));
}