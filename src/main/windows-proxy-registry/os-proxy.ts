// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/httptoolkit/os-proxy-config/blob/main/src/index.ts

import { getWindowsSystemProxy } from './proxy';
import { getMacSystemProxy } from './mac-proxy';

export interface ProxyConfig {
    /**
     * The proxy server URL, in a format ready to be used with
     * https://www.npmjs.com/package/proxy-agent.
     *
     * For example: http://..., socks5://..., pac+http://...
     */
    proxyUrl: string;

    /**
     * A list of no-proxy values, naming the hosts whose traffic should *not* be proxied.
     *
     * There are many possible formats for the values here, including plain hostnames,
     * IPv4 addresses, CIDR ranges, IPv6 addresses, and probably more.
     */
    noProxy: string[];
}

export async function getSystemProxy(): Promise<ProxyConfig | undefined> {
    if (process.platform === 'win32') {
        console.log("*********** getSystemProxy WIN...");
        return getWindowsSystemProxy();
    } else if (process.platform === 'darwin') {
        console.log("*********** getSystemProxy MAC...");
        const proxySettings = await getMacSystemProxy();

        const noProxy = proxySettings?.ExceptionsList || [];

        if (proxySettings.HTTPEnable && proxySettings.HTTPProxy && proxySettings.HTTPPort) {
            return {
                proxyUrl: `http://${proxySettings.HTTPProxy}:${proxySettings.HTTPPort}`,
                noProxy
            };
        } else if (proxySettings.SOCKSEnable && proxySettings.SOCKSProxy && proxySettings.SOCKSPort) {
            return {
                proxyUrl: `socks://${proxySettings.SOCKSProxy}:${proxySettings.SOCKSPort}`,
                noProxy
            };
        } else if (proxySettings.HTTPSEnable && proxySettings.HTTPSProxy && proxySettings.HTTPSPort) {
            return {
                proxyUrl: `http://${proxySettings.HTTPSProxy}:${proxySettings.HTTPSPort}`,
                noProxy
            };
        } else {
            return undefined;
        }
    } else {
        console.log("*********** getSystemProxy LINUX...");
        const {
            HTTPS_PROXY,
            https_proxy,
            HTTP_PROXY,
            http_proxy,
            NO_PROXY,
            no_proxy
        } = process.env;

        const proxyUrl = HTTPS_PROXY || HTTP_PROXY || https_proxy || http_proxy;

        if (!proxyUrl) return undefined;

        const noProxy = !!(NO_PROXY || no_proxy)
            ? (NO_PROXY || no_proxy)!.split(',')
            : [];

        return {
            proxyUrl,
            noProxy
        };
    }
}
