// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function formatTime(seconds: number): string {
    const secondsPerMinute = 60;
    const minutesPerHours = 60;
    const secondsPerHour = minutesPerHours * secondsPerMinute;
    let remainingSeconds = seconds;
    const nHours = Math.floor(remainingSeconds / secondsPerHour);
    remainingSeconds -= (nHours * secondsPerHour);
    if (remainingSeconds < 0) {
        remainingSeconds = 0;
    }
    const nMinutes = Math.floor(remainingSeconds / secondsPerMinute);
    remainingSeconds -= (nMinutes * secondsPerMinute);
    if (remainingSeconds < 0) {
        remainingSeconds = 0;
    }
    remainingSeconds = Math.floor(remainingSeconds);

    return formatTime_(nHours, nMinutes, remainingSeconds);
}

export function formatTime_(nHours: number, nMinutes: number, nSeconds: number): string {
    return `${nHours > 0 ? (nHours.toString().padStart(2, "0") + ":") : ``}${nMinutes > 0 ? (nMinutes.toString().padStart(2, "0") + ":") : `00:`}${nSeconds > 0 ? (nSeconds.toString().padStart(2, "0")) : `00`}`;
}
