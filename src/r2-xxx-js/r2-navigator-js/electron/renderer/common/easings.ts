// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// tslint:disable:object-literal-sort-keys
export const easings = {
    linearTween: (t: number, b: number, c: number, d: number): number => {
        return c * t / d + b;
    },
    easeInQuad: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        return c * t * t + b;
    },
    easeOutQuad: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        return -c * t * (t - 2) + b;
    },
    easeInOutQuad: (t: number, b: number, c: number, d: number): number => {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t + b;
        }
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },
    easeInCubic: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        return c * t * t * t + b;
    },
    easeOutCubic: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    },
    easeInOutCubic: (t: number, b: number, c: number, d: number): number => {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t * t + b;
        }
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    },
    easeInQuart: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        return c * t * t * t * t + b;
    },
    easeOutQuart: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        t--;
        return -c * (t * t * t * t - 1) + b;
    },
    easeInOutQuart: (t: number, b: number, c: number, d: number): number => {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t * t * t + b;
        }
        t -= 2;
        return -c / 2 * (t * t * t * t - 2) + b;
    },
    easeInQuint: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        return c * t * t * t * t * t + b;
    },
    easeOutQuint: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        t--;
        return c * (t * t * t * t * t + 1) + b;
    },
    easeInOutQuint: (t: number, b: number, c: number, d: number): number => {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t * t * t * t + b;
        }
        t -= 2;
        return c / 2 * (t * t * t * t * t + 2) + b;
    },
    easeInSine: (t: number, b: number, c: number, d: number): number => {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: (t: number, b: number, c: number, d: number): number => {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: (t: number, b: number, c: number, d: number): number => {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: (t: number, b: number, c: number, d: number): number => {
        return c * Math.pow(2, 10 * (t / d - 1)) + b;
    },
    easeOutExpo: (t: number, b: number, c: number, d: number): number => {
        return c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },
    easeInOutExpo: (t: number, b: number, c: number, d: number): number => {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        }
        t--;
        return c / 2 * (-Math.pow(2, -10 * t) + 2) + b;
    },
    easeInCirc: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        return -c * (Math.sqrt(1 - t * t) - 1) + b;
    },
    easeOutCirc: (t: number, b: number, c: number, d: number): number => {
        t /= d;
        t--;
        return c * Math.sqrt(1 - t * t) + b;
    },
    easeInOutCirc: (t: number, b: number, c: number, d: number): number => {
        t /= d / 2;
        if (t < 1) {
            return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        }
        t -= 2;
        return c / 2 * (Math.sqrt(1 - t * t) + 1) + b;
    },
};
