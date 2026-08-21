// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/httptoolkit/windows-system-proxy/blob/main/src/index.ts

import type { RegistryValue } from "./windows-registry";
import * as registry from "./windows-registry";

export interface WindowsProxySettings {
    proxyUrl: string;
    noProxy: string[];
}

export async function getWindowsSystemProxy(): Promise<WindowsProxySettings | undefined> {
    if (process.platform !== "win32") {
        // throw new Error("Can"t detect Windows system proxy on non-Windows platform");
        return undefined;
    }

    // const registry = await import("./windows-registry");

    const proxyValues = registry.enumerateValues(
        registry.HKEY.HKEY_CURRENT_USER,
        "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
    );
    // console.log("***********--------- REGISTRY VALUES:", JSON.stringify(proxyValues, null, 4));

    const proxyEnabled = getValue(proxyValues, "ProxyEnable");
    const proxyServer = getValue(proxyValues, "ProxyServer");

    // No proxy config? We"re done, return undefined.
    if (!proxyEnabled || !proxyEnabled.data || !proxyServer || !proxyServer.data) return undefined;

    // ProxyOverride is a ;-separated list of hosts not to proxy
    const proxyOverride = getValue(proxyValues, "ProxyOverride")?.data;
    const noProxy = (proxyOverride ? (proxyOverride as string).split(";") : [])
        .flatMap((host) => host === "<local>"
            ? ["localhost", "127.0.0.1", "::1"]
            : [host]);

    // ProxyServer specifies the proxy host(s), but in a few different formats...
    const proxyConfigString = proxyServer.data as string;

    if (proxyConfigString.startsWith("http://") || proxyConfigString.startsWith("https://")) {
        // Unclear whether this is used in reality, but it"s an example of a valid config in the microsoft
        // docs: https://docs.microsoft.com/en-us/troubleshoot/windows-client/networking/configure-client-proxy-server-settings-by-registry-file
        return {
            proxyUrl: proxyConfigString,
            noProxy,
        };
    } else if (proxyConfigString.includes("=")) {
        // If you separately configure proxies by protocol (in Internet Settings), it seems to store them as a
        // list of protocol=host;protocol=host key value pairs. We use the best supported host we can find, assuming
        // that all proxies probably support both HTTP & HTTPS traffic in reality, because they do seem to.
        const proxies = Object.fromEntries(
            proxyConfigString
                .split(";")
                .map((proxyPair) => proxyPair.split("=") as [string, string]));

        // Secure HTTPS last in the resolution cascade
        // see https://github.com/httptoolkit/os-proxy-config/issues/2#issuecomment-5367799120
        // see https://github.com/httptoolkit/windows-system-proxy/pull/1
        // see https://github.com/httptoolkit/os-proxy-config/pull/1/changes
        const proxyUrl = proxies["http"]
            ? `http://${proxies["http"]}`
            : proxies["socks"]
                ? `socks://${proxies["socks"]}`
                : proxies["https"]
                    ? `http://${proxies["https"]}` // not HTTPS:// !
                    : undefined;

        if (!proxyUrl) {
            throw new Error(`Could not get usable proxy URL from ${proxyConfigString}`);
        }

        return {
            proxyUrl,
            noProxy,
        };
    } else {
        // Alternatively, it"s often just a bare hostname, so we use that directly:
        return {
            proxyUrl: `http://${proxyConfigString}`,
            noProxy,
        };
    }
}


const getValue = (values: readonly RegistryValue[], name: string) =>
    values.find((value) => value?.name === name);
