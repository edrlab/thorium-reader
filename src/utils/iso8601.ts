// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function iso8601DurationsToSeconds(iso8601: string): number {
    // https://en.wikipedia.org/wiki/ISO_8601#Durations

    // https://regex101.com/r/qtDvmT/1
    const regexp = new RegExp("^P((\\d+)Y)?((\\d+)M)?((\\d+)D)?T((\\d+)H)?((\\d+)M)?((\\d+)S)?$");

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
            totalSecond += data[i] ? parseInt(data[i], 10) * year : 0;
            i += 2;
            totalSecond += data[i] ? parseInt(data[i], 10) * month : 0;
            i += 2;
            totalSecond += data[i] ? parseInt(data[i], 10) * day : 0;
            i += 2;
            totalSecond += data[i] ? parseInt(data[i], 10) * hour : 0;
            i += 2;
            totalSecond += data[i] ? parseInt(data[i], 10) * minute : 0;
            i += 2;
            totalSecond += data[i] ? parseInt(data[i], 10) : 0;

        }
    }

    return totalSecond;
}
