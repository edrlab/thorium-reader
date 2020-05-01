// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const base = 256;
const prime = 101;

const mod = (a: number, b: number) => {
    const m = ((a % b) + b) % b;
    return m < 0 ? m + Math.abs(b) : m;
};

const range = (n: number, start = 0) => Array.from({length: n}, (_v, k) => k + start);

// https://en.wikipedia.org/wiki/Rolling_hash
export const hashString = (s: string, hash: number = 0): number =>
    Array
        .from(s)
        .reduce((pv, cv) => mod((pv * base + cv.charCodeAt(0)), prime), hash);

export const rollingHash = (prevHash: number, prevString: string, newString: string) =>
    Array
        .from(newString)
        .map<[string, string]>((v, i) => [v, prevString[i]])
        .reduce((pv, [sn, sp]) => {

            const hashWithSn = hashString(sn, pv);
            const size = prevString.length;
            const basePowerI = range(size).reduce((_pv) => (_pv * base) % prime, 1);

            const popFirstHash = sp.charCodeAt(0) * basePowerI;
            const hashFinal = mod((hashWithSn - popFirstHash), prime);

            return hashFinal;
        }, prevHash);

export const rabinKarp = (text: string, search: string) => {
    const firstPattern = text.slice(0, search.length);
    let hpattern = hashString(firstPattern);
    const hsearch = hashString(search);

    const textToSearch = text.slice(search.length);
    return Array.from(textToSearch)
        .reduce<number[]>((pv, cv, index) => {

            const pattern = text.slice(index, index + search.length);

            let flag = false;
            if (hpattern === hsearch) {
                if (search === pattern) {
                    flag = true;
                }
            }

            // next hash calcul
            hpattern = rollingHash(hpattern, pattern, cv);

            return flag ? [ ...pv, index] : pv;
        }, []);
};
