// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function iso8601DurationsToSeconds(iso8601: string): number {
    // https://en.wikipedia.org/wiki/ISO_8601#Durations

    // https://regex101.com/r/qtDvmT/2
    const regexp = new RegExp("^P((\\d+|\\d+.\\d+)Y)?((\\d+|\\d+.\\d+)M)?((\\d+|\\d+.\\d+)D)?T((\\d+|\\d+.\\d+)H)?((\\d+|\\d+.\\d+)M)?((\\d+|\\d+.\\d+)S)?$");

    const isValid = regexp.test(iso8601);

    let totalSecond = -1;

    if (isValid) {
        const time = 60;
        const minute = time;
        const hour = time * minute;
        const day = 24 * hour;
        const month = 30.416666666666668 * day; // average of days
        const year = 12 * month;

        const data = regexp.exec(iso8601);

        if (data?.length) {

            let i = 2;

            totalSecond = 0;
            totalSecond += data[i] ? parseFloat(data[i]) * year : 0;
            i += 2;
            totalSecond += data[i] ? parseFloat(data[i]) * month : 0;
            i += 2;
            totalSecond += data[i] ? parseFloat(data[i]) * day : 0;
            i += 2;
            totalSecond += data[i] ? parseFloat(data[i]) * hour : 0;
            i += 2;
            totalSecond += data[i] ? parseFloat(data[i]) * minute : 0;
            i += 2;
            totalSecond += data[i] ? parseFloat(data[i]) : 0;

        }
    }

    return Math.round(totalSecond);
}
