// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function formatTime(seconds: number, pad = true): string {

    seconds = Math.round(seconds);

    const secondsPerMinute = 60;
    const minutesPerHours = 60;
    const secondsPerHour = minutesPerHours * secondsPerMinute;

    const hours = Math.floor(seconds / secondsPerHour);
    seconds %= secondsPerHour;

    const minutes = Math.floor(seconds / secondsPerMinute);
    seconds %= secondsPerMinute;

    return formatTime_(hours, minutes, seconds, pad);
}

export function formatTime_(nHours: number, nMinutes: number, nSeconds: number, pad = true): string {
    return `${nHours > 0 ? (nHours.toString().padStart(2, "0") + ":") : (pad ? "00:" : "")}${nMinutes > 0 ? (nMinutes.toString().padStart(2, "0") + ":") : "00:"}${nSeconds > 0 ? (nSeconds.toString().padStart(2, "0")) : "00"}`;
}
