// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import { app, screen } from "electron";
import os from "node:os";

import {
    IAnalyticsLogEventOptions,
    IAnalyticsLogEventResult,
    TAnalyticsEventParams,
    TAnalyticsValidationBehavior,
} from "readium-desktop/common/api/interface/analyticsApi.interface";
import isURL from "readium-desktop/common/utils/isURL";
import { httpPost } from "readium-desktop/main/network/http";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

const debug = debug_("readium-desktop:main:analytics:measurement-protocol");
const sessionId = Math.floor(Date.now() / 1000);

const getDeviceLanguage = (): string | undefined => {
    try {
        const preferredSystemLanguage = app.getPreferredSystemLanguages()?.[0];
        if (preferredSystemLanguage) {
            return preferredSystemLanguage;
        }
    } catch (err) {
        debug("Measurement Protocol device preferred language unavailable", err);
    }

    try {
        const systemLocale = app.getSystemLocale();
        if (systemLocale) {
            return systemLocale;
        }
    } catch (err) {
        debug("Measurement Protocol device system locale unavailable", err);
    }

    return undefined;
};

/**
 * Sends one GA4 Measurement Protocol event immediately, without queueing or retry.
 *
 * Request reference:
 * - Endpoint: https://www.google-analytics.com/mp/collect, or /debug/mp/collect for validation.
 * - Query string: api_secret and measurement_id.
 * - JSON body: client_id and events[].
 *
 * Google recommends using the validation endpoint during development, and warns not to retry
 * the same request because repeated sends can inflate event counts.
 *
 * References:
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events?client_type=gtag
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/verify-implementation?client_type=gtag
 */
export const logMeasurementProtocol = async (
    name: string,
    params?: TAnalyticsEventParams,
    options: IAnalyticsLogEventOptions & { clientId?: string; locale?: string } = {},
): Promise<IAnalyticsLogEventResult> => {

    debug("Measurement Protocol log event request", {
        name,
        hasParams: !!params && Object.keys(params).length > 0,
        optionKeys: Object.keys(options),
    });

    if (!__TH__FIREBASE_ENABLED__) {
        debug("Measurement Protocol disabled");
        return {
            sent: false,
            isSuccess: false,
            reason: "disabled",
        };
    }

    if (typeof name !== "string" || !name || name.length > 40) {
        debug("Measurement Protocol invalid event name", { name });
        return {
            sent: false,
            isSuccess: false,
            reason: "invalid-event-name",
        };
    }

    const debugMode = typeof options.debug === "boolean" ? options.debug : __TH__FIREBASE_DEBUG__;
    const clientId = options.clientId;
    const apiSecret = __TH__FIREBASE_MEASUREMENT_PROTOCOL_API_SECRET__;
    const endpoint = debugMode
        ? (__TH__FIREBASE_MEASUREMENT_PROTOCOL_DEBUG_ENDPOINT__ || "https://www.google-analytics.com/debug/mp/collect")
        : (__TH__FIREBASE_MEASUREMENT_PROTOCOL_ENDPOINT__ || "https://www.google-analytics.com/mp/collect");
    // const endpoint = (__TH__FIREBASE_MEASUREMENT_PROTOCOL_ENDPOINT__ || "https://www.google-analytics.com/mp/collect");

    debug("Measurement Protocol config", {
        debugMode,
        endpoint,
        measurementId: __TH__FIREBASE_MEASUREMENT_ID__,
        hasApiSecret: !!apiSecret,
        hasClientId: !!clientId,
    });

    if (!__TH__FIREBASE_MEASUREMENT_ID__ || !apiSecret || !clientId) {
        debug("Measurement Protocol missing config", {
            hasMeasurementId: !!__TH__FIREBASE_MEASUREMENT_ID__,
            hasApiSecret: !!apiSecret,
            hasClientId: !!clientId,
        });
        return {
            sent: false,
            isSuccess: false,
            reason: "missing-config",
        };
    }

    let href: string;
    let hrefDebug = "";
    try {
        const url = new URL(endpoint);

        // Reference: https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag
        // Web Measurement Protocol sends api_secret and measurement_id as query parameters.
        // Keep api_secret in the main runtime only; do not expose it through renderer bundles.
        url.searchParams.set("measurement_id", __TH__FIREBASE_MEASUREMENT_ID__);
        url.searchParams.set("api_secret", apiSecret);

        href = url.toString();
        url.searchParams.set("api_secret", "***");
        hrefDebug = url.toString();
        debug("Measurement Protocol URL", hrefDebug);
    } catch (err) {
        debug("Measurement Protocol invalid endpoint", err);
        return {
            sent: false,
            isSuccess: false,
            reason: "invalid-url",
        };
    }

    if (!href || !isURL(href)) {
        debug("Measurement Protocol isURL() NOK", hrefDebug || href);
        return {
            sent: false,
            isSuccess: false,
            reason: "invalid-url",
        };
    }

    const eventParams: TAnalyticsEventParams = {};
    for (const [key, value] of Object.entries(params || {})) {
        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            eventParams[key] = value;
        }
    }

    debug("Measurement Protocol event params", eventParams);

    // Common event parameters reference:
    // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#common_params
    // - session_id: user session identifier. Google accepts a positive timestamp as number/string,
    //   a GTM Analytics Session ID string, or the full session cookie value.
    // - engagement_time_msec: engagement duration since the preceding event, in milliseconds.
    // - timestamp_micros: event-level Unix timestamp in microseconds; request-level timestamp_micros
    //   remains on the JSON body below.
    eventParams.session_id = options.sessionId || sessionId;
    if (typeof options.engagementTimeMsec === "number") {
        eventParams.engagement_time_msec = options.engagementTimeMsec;
    }

    let screenResolution: string | undefined;
    try {
        const primaryDisplaySize = screen.getPrimaryDisplay()?.size;
        if (primaryDisplaySize?.width && primaryDisplaySize?.height) {
            screenResolution = `${primaryDisplaySize.width}x${primaryDisplaySize.height}`;
        }
    } catch (err) {
        debug("Measurement Protocol device screen resolution unavailable", err);
    }

    const userLanguage = options.locale || undefined;
    const deviceLanguage = getDeviceLanguage();

    const osName =
        process.platform === "darwin" ? "macOS" :
        process.platform === "win32" ? "Windows" :
        process.platform === "linux" ? "Linux" :
        process.platform;
    const osVersion = os.release();
    const deviceOperatingSystem = osName === "macOS" ? "MacOS" : osName;

    // JSON POST body reference:
    // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#payload_post_body
    // Root fields accepted by GA4 Measurement Protocol:
    // - client_id: required web client identifier; generated once and persisted in the main Redux store.
    // - user_id: optional cross-platform user identifier.
    // - timestamp_micros: optional request timestamp, in Unix microseconds.
    // - user_properties: optional user-scoped properties; each property can define value and timestamp_micros.
    // - user_data: optional user-provided data; sensitive sha256_* fields must be SHA-256 hashed and hex encoded.
    // - consent: optional consent flags, currently ad_user_data and ad_personalization.
    // - non_personalized_ads: deprecated; use consent.ad_personalization instead.
    // - user_location or ip_override: optional geographic override; user_location takes precedence.
    // - device or user_agent: optional device override; device takes precedence over user_agent.
    // - validation_behavior: optional validation mode, RELAXED or ENFORCE_RECOMMENDATIONS.
    // - events: required array of event items, up to 25 per request.
    const body: {
        client_id: string;
        user_id?: string;
        timestamp_micros?: number;
        user_properties?: Record<string, {
            value: string | number | boolean;
            timestamp_micros?: number;
        }>;
        user_data?: {
            sha256_email_address?: string | string[];
            sha256_phone_number?: string | string[];
            address?: {
                sha256_first_name?: string;
                sha256_last_name?: string;
                sha256_street?: string;
                city?: string;
                region?: string;
                postal_code?: string;
                country?: string;
            } | Array<{
                sha256_first_name?: string;
                sha256_last_name?: string;
                sha256_street?: string;
                city?: string;
                region?: string;
                postal_code?: string;
                country?: string;
            }>;
        };
        consent?: {
            ad_user_data?: "GRANTED" | "DENIED";
            ad_personalization?: "GRANTED" | "DENIED";
        };
        non_personalized_ads?: boolean;
        user_location?: {
            city?: string;
            region_id?: string;
            country_id?: string;
            subcontinent_id?: string;
            continent_id?: string;
        };
        ip_override?: string;
        device?: {
            category?: string;
            language?: string;
            screen_resolution?: string;
            operating_system?: string;
            operating_system_version?: string;
            model?: string;
            brand?: string;
            browser?: string;
            browser_version?: string;
        };
        user_agent?: string;
        validation_behavior?: TAnalyticsValidationBehavior;
        events: Array<{
            // Required. Event name, 40 characters or fewer.
            name: string;
            // Optional. Up to 25 parameters per event.
            // Common parameters reference:
            // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#common_params
            // Documented common parameters: session_id, engagement_time_msec, timestamp_micros.
            // Custom event-scoped parameters are accepted here; item-scoped parameters belong under items[].
            params?: TAnalyticsEventParams;
        }>;
    } = {
        client_id: clientId,
        // User properties are user-scoped dimensions for the measurement.
        // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#payload_post_body
        user_properties: {
            app_version: {
                value: _APP_VERSION,
            },
            os_name: {
                value: osName,
            },
            os_version: {
                value: osVersion,
            },
            ...(userLanguage ? {
                language: {
                    value: userLanguage,
                },
            } : {}),
        },
        // Device information reference:
        // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference?client_type=gtag#device_information
        // Google recommends category at a minimum. The validation endpoint also requires model
        // when device is present. Keep it generic to avoid hardware fingerprinting.
        // When device is present, user_agent is ignored.
        device: {
            category: "desktop",
            model: "Desktop",
            ...(deviceLanguage ? { language: deviceLanguage } : {}),
            ...(screenResolution ? { screen_resolution: screenResolution } : {}),
            operating_system: deviceOperatingSystem,
            operating_system_version: osVersion,
            browser: "Electron",
            ...(process.versions.electron ? { browser_version: process.versions.electron } : {}),
        },
        events: [{
            name,
            ...(Object.keys(eventParams).length ? { params: eventParams } : {}),
        }],
    };

    if (options.userId) {
        body.user_id = options.userId;
    }
    if (typeof options.timestampMicros === "number") {
        body.timestamp_micros = options.timestampMicros;
    }

    // Reference: https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events?client_type=gtag
    // The validation endpoint returns detailed validation messages only when validation_behavior is strict.
    if (debugMode) {
        body.validation_behavior = options.validationBehavior || "ENFORCE_RECOMMENDATIONS";
    } else if (options.validationBehavior) {
        body.validation_behavior = options.validationBehavior;
    }

    const bodyJson = JSON.stringify(body);
    debug("Measurement Protocol body", bodyJson);

    try {
        debug("Measurement Protocol POST", {
            url: hrefDebug,
            headers: {
                "Content-Type": "application/json",
            },
        });

        const response = await httpPost(href, {
            body: bodyJson,
            headers: {
                "Content-Type": "application/json",
            },
        });

        const result: IAnalyticsLogEventResult = {
            sent: response.isSuccess,
            isSuccess: response.isSuccess,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
        };

        debug("Measurement Protocol response", result);

        if (debugMode && response.statusCode !== 204 && response.response?.json) {
            try {
                const json: any = await response.response.json();
                debug("Measurement Protocol debug response body", json);
                if (Array.isArray(json?.validationMessages)) {
                    const validationMessages: NonNullable<IAnalyticsLogEventResult["validationMessages"]> = [];
                    for (const message of json.validationMessages) {
                        validationMessages.push({
                            fieldPath: typeof message?.fieldPath === "string" ? message.fieldPath : undefined,
                            description: typeof message?.description === "string" ? message.description : undefined,
                            validationCode: typeof message?.validationCode === "string" ? message.validationCode : undefined,
                        });
                    }
                    result.validationMessages = validationMessages;
                    debug("Measurement Protocol validation messages", validationMessages);
                }
            } catch (err) {
                debug("Measurement Protocol debug response JSON parse failed", err);
            }
        }

        return result;
    } catch (err) {
        debug("Measurement Protocol network error", err);
        return {
            sent: false,
            isSuccess: false,
            reason: "network-error",
        };
    }
};
