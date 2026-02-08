// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JsonConverter, JsonElementType, JsonObject, JsonProperty } from "ta-json-x";

import { JsonStringConverter } from "@r2-utils-js/_utils/ta-json-string-converter";

// http://www.idpf.org/epub/31/spec/epub-mediaoverlays.html#app-clock-examples
// https://www.w3.org/TR/2008/REC-SMIL3-20081201/smil-timing.html#q22
export function timeStrToSeconds(timeStr: string): number {
    if (!timeStr) {
        return 0;
    }

    // Normal Play Time
    timeStr = timeStr.replace("npt=", "");

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    try {
        const iMin = timeStr.indexOf("min");
        if (iMin > 0) {
            // time.fraction(min)
            const minsStr = timeStr.substr(0, iMin);
            minutes = parseFloat(minsStr);
        } else {
            const iMs = timeStr.indexOf("ms");
            if (iMs > 0) {
                // time.fraction(ms)
                const msStr = timeStr.substr(0, iMs);
                const ms = parseFloat(msStr);
                seconds = ms / 1000;
            } else {
                const iS = timeStr.indexOf("s");
                if (iS > 0) {
                    // time.fraction(s)
                    const sStr = timeStr.substr(0, iS);
                    seconds = parseFloat(sStr);
                } else {
                    const iH = timeStr.indexOf("h");
                    if (iH > 0) {
                        // time.fraction(h)
                        const hStr = timeStr.substr(0, iH);
                        hours = parseFloat(hStr);
                    } else {
                        const arr = timeStr.split(":");
                        if (arr.length === 1) {
                            // ss.fraction
                            seconds = parseFloat(arr[0]);

                        } else if (arr.length === 2) {
                            // mm:ss.fraction
                            minutes = parseFloat(arr[0]);
                            seconds = parseFloat(arr[1]);

                        } else if (arr.length === 3) {
                            // hh:mm:ss.fraction
                            hours = parseFloat(arr[0]);
                            minutes = parseFloat(arr[1]);
                            seconds = parseFloat(arr[2]);

                        } else {
                            console.log("SMIL TIME CLOCK SYNTAX PARSING ERROR ??");
                            console.log(timeStr);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
        console.log("SMIL TIME CLOCK SYNTAX PARSING ERROR!");
        console.log(timeStr);
        return 0;
    }

    return (hours * 3600) + (minutes * 60) + seconds; // total in seconds
}

// TODO: MEDIA OVERLAY not in JSON Schema
// tslint:disable-next-line:max-line-length
// https://github.com/readium/webpub-manifest/tree/master/schema
// https://w3c.github.io/sync-media-pub/synchronized-narration.html#properties
@JsonObject()
export class MediaOverlayNode {
    @JsonProperty("text")
    public Text!: string; // URL already decodeURI()

    @JsonProperty("audio")
    public Audio!: string; // URL already decodeURI()

    @JsonProperty("video")
    public Video!: string; // URL already decodeURI()

    @JsonProperty("role")
    @JsonConverter(JsonStringConverter)
    @JsonElementType(String)
    public Role!: string[];

    @JsonProperty("narration")
    @JsonElementType(MediaOverlayNode)
    public Children!: MediaOverlayNode[];

    public SmilPathInZip: string | undefined; // URL already decodeURI()

    public initialized = false;

    public ParID: string | undefined;
    public SeqID: string | undefined;
    public TextID: string | undefined;
    public AudioID: string | undefined;
    public VideoID: string | undefined;
    public ImgID: string | undefined;

    public AudioClipBegin: number | undefined;
    public AudioClipEnd: number | undefined;

    public VideoClipBegin: number | undefined;
    public VideoClipEnd: number | undefined;

    public duration: number | undefined;
    public totalElapsedTime: number | undefined;

    // public inspect(depth: number, opts: any): string | null | undefined {
    //     return "MediaOverlay: " + this.SmilPathInZip;
    // }

    // constructor(text: string = "T3") {
    //     this._JsonConstructor(text);
    // }

    // @JsonConstructor()
    // private _JsonConstructor(text: string = "T2") {
    //     console.log("_JsonConstructor");
    //     console.log("!!!! " + text);

    //     this.Text = text;
    // }

    // @BeforeDeserialized()
    // private _BeforeDeserialized() {
    //     console.log("_BeforeDeserialized");

    //     this.Text = "T1";
    //     // this.Audio = "";
    // }

    // @OnDeserialized()
    //// tslint:disable-next-line:no-unused-variable
    // protected _OnDeserialized() {
    //     console.log("_OnDeserialized");
    //     console.log("==> " + this.info);
    // }

    // public get info(): string {
    //     return `${this.Text} + ${this.Audio} - ` + (this.Children ? this.Children.length : "0");
    // }
}
