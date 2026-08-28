// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/TooTallNate/proxy-agents/blob/4813885d3f4e2ff837878ceffdba656a71dc31f0/packages/proxy-agent/package.json#L2-L3
// https://github.com/TooTallNate/proxy-agents/blob/4813885d3f4e2ff837878ceffdba656a71dc31f0/packages/proxy-agent/src/index.ts

// DIFFERENCE: removed pac-proxy-agent as this introduces QuickJS WASM bloat
// also see:
// ---- LAZY vs. NOT LAZY

// TODO: NODE_USE_ENV_PROXY=1 ?
// https://github.com/Rob--W/proxy-from-env#built-in-proxy-support
// https://github.com/nodejs/node/issues/57872
// https://github.com/nodejs/node/issues/43187
// https://gist.github.com/Aditi-1400/09a915398a90e23691784b6810263781

import { getSystemProxy, type ProxyConfig } from "readium-desktop/main/network/proxy-discovery/os-proxy";

import * as http from "node:http";
import * as https from "node:https";
import { URL } from "node:url";
import { LRUCache } from "lru-cache";
import { Agent, AgentConnectOpts } from "agent-base";
import createDebug from "debug";
import { getProxyForUrl as envGetProxyForUrl } from "proxy-from-env";

import type { PacProxyAgent, PacProxyAgentOptions } from "pac-proxy-agent";
import type {
    // HttpProxyAgent, // ---- LAZY vs. NOT LAZY
    HttpProxyAgentOptions,
} from "http-proxy-agent";
import type {
    // HttpsProxyAgent, // ---- LAZY vs. NOT LAZY
    HttpsProxyAgentOptions,
} from "https-proxy-agent";
import type {
    // SocksProxyAgent, // ---- LAZY vs. NOT LAZY
    SocksProxyAgentOptions,
} from "socks-proxy-agent";

import { HttpProxyAgent } from "http-proxy-agent"; // ---- LAZY vs. NOT LAZY
import { HttpsProxyAgent } from "https-proxy-agent"; // ---- LAZY vs. NOT LAZY
import { SocksProxyAgent } from "socks-proxy-agent"; // ---- LAZY vs. NOT LAZY

const debug = createDebug("proxy-agent");

type ValidProtocol =
    | (typeof HttpProxyAgent.protocols)[number]
    // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
    | (typeof HttpsProxyAgent.protocols)[number]
    | (typeof SocksProxyAgent.protocols)[number]
    | (typeof PacProxyAgent.protocols)[number]
    ;

type AgentConstructor = new (
    proxy: string,
    proxyAgentOptions?: ProxyAgentOptions
) => Agent;

type GetProxyForUrlCallback = (
    url: string,
    req: http.ClientRequest
) => Promise<string>;

// ---- LAZY vs. NOT LAZY
// /**
//  * Shorthands for built-in supported types.
//  * Lazily loaded since some of these imports can be quite expensive
//  * (in particular, pac-proxy-agent).
//  */
// const wellKnownAgents = {
//     http: async () => (await import("http-proxy-agent")).HttpProxyAgent,
//     https: async () => (await import("https-proxy-agent")).HttpsProxyAgent,
//     socks: async () => (await import("socks-proxy-agent")).SocksProxyAgent,
//     // pac: async () => (await import("pac-proxy-agent")).PacProxyAgent,
// } as const;
const wellKnownAgents = {
    http: HttpProxyAgent,
    https: HttpsProxyAgent,
    socks: SocksProxyAgent,
    pac: async () => (await import("pac-proxy-agent")).PacProxyAgent,
} as const;

// ---- LAZY vs. NOT LAZY
/**
 * Supported proxy types.
 */
export const proxies: {
    [P in ValidProtocol]: [
        // () => Promise<AgentConstructor>, // ---- LAZY vs. NOT LAZY
        // () => Promise<AgentConstructor> // ---- LAZY vs. NOT LAZY
        AgentConstructor | (() => Promise<AgentConstructor>), // ---- LAZY vs. NOT LAZY
        AgentConstructor | (() => Promise<AgentConstructor>) // ---- LAZY vs. NOT LAZY
    ];
} = {
    http: [wellKnownAgents.http, wellKnownAgents.https],
    https: [wellKnownAgents.http, wellKnownAgents.https],
    socks: [wellKnownAgents.socks, wellKnownAgents.socks],
    socks4: [wellKnownAgents.socks, wellKnownAgents.socks],
    socks4a: [wellKnownAgents.socks, wellKnownAgents.socks],
    socks5: [wellKnownAgents.socks, wellKnownAgents.socks],
    socks5h: [wellKnownAgents.socks, wellKnownAgents.socks],
    "pac+data": [wellKnownAgents.pac, wellKnownAgents.pac],
    "pac+file": [wellKnownAgents.pac, wellKnownAgents.pac],
    "pac+ftp": [wellKnownAgents.pac, wellKnownAgents.pac],
    "pac+http": [wellKnownAgents.pac, wellKnownAgents.pac],
    "pac+https": [wellKnownAgents.pac, wellKnownAgents.pac],
};

function isValidProtocol(v: string): v is ValidProtocol {
    return Object.keys(proxies).includes(v);
}

export type ProxyAgentOptions = HttpProxyAgentOptions<""> &
    HttpsProxyAgentOptions<""> &
    SocksProxyAgentOptions &
    PacProxyAgentOptions<""> &
    {
        /**
         * Default `http.Agent` instance to use when no proxy is
         * configured for a request. Defaults to a new `http.Agent()`
         * instance with the proxy agent options passed in.
         */
        httpAgent?: http.Agent;
        /**
         * Default `http.Agent` instance to use when no proxy is
         * configured for a request. Defaults to a new `https.Agent()`
         * instance with the proxy agent options passed in.
         */
        httpsAgent?: http.Agent;
        /**
         * A callback for dynamic provision of proxy for url.
         * Defaults to standard proxy environment variables,
         * see https://www.npmjs.com/package/proxy-from-env for details
         */
        getProxyForUrl?: GetProxyForUrlCallback;
    };

// https://github.com/Rob--W/proxy-from-env/blob/570ce3a4279d83af3ff13e7600a347d01c453394/index.js#L3-L18
const DEFAULT_PORTS: {
  [key: string]: number | undefined
} = {
    ftp: 21,
    gopher: 70,
    http: 80,
    https: 443,
    ws: 80,
    wss: 443,
};
function parseUrl(urlString: string): URL | null {
    try {
        return new URL(urlString);
    } catch {
        return null;
    }
}
// https://github.com/Rob--W/proxy-from-env/blob/570ce3a4279d83af3ff13e7600a347d01c453394/index.js#L26-L50
function getProxyForUrl_(proxyUrl: string | undefined, noProxy: string[] | undefined, url: string): string {

    const parsedUrl = parseUrl(url);

    let proto = parsedUrl.protocol;
    let hostname = parsedUrl.host;

    if (typeof hostname !== "string" || !hostname || typeof proto !== "string") {
        return "";
    }

    proto = proto.split(":", 1)[0];
    hostname = hostname.replace(/:\d*$/, "");
    const port = parseInt(parsedUrl.port, 10) || DEFAULT_PORTS[proto] || 0;

    if (noProxy?.length) {
        for (const n of noProxy) {
            if (!shouldProxy(n, hostname, port)) {
                return "";
            }
        }
    }

    if (proxyUrl && proxyUrl.indexOf("://") === -1) {
        proxyUrl = proto + "://" + proxyUrl;
    }

    return proxyUrl;
}
// https://github.com/Rob--W/proxy-from-env/blob/570ce3a4279d83af3ff13e7600a347d01c453394/index.js#L60-L92
function shouldProxy(noProxy: string, hostname: string, port: number): boolean {

    if (!noProxy) {
        return true;
    }
    noProxy = noProxy.toLowerCase();

    if (noProxy === "*") {
        return false;
    }

    return noProxy.split(/[,\s]/).every(function(proxy) {
        if (!proxy) {
            return true;
        }
        const parsedProxy = proxy.match(/^(.+):(\d+)$/);
        let parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
        const parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
        if (parsedProxyPort && parsedProxyPort !== port) {
            return true;
        }

        if (!/^[.*]/.test(parsedProxyHostname)) {
            return hostname !== parsedProxyHostname;
        }

        if (parsedProxyHostname.charAt(0) === "*") {
            parsedProxyHostname = parsedProxyHostname.slice(1);
        }

        return !hostname.endsWith(parsedProxyHostname);
    });
}

let _dataProxyConfig: ProxyConfig | undefined | null = undefined;
async function myGetProxyForUrl(
    url: string,
    _req: http.ClientRequest,
): Promise<string> {

    // linux passthrough to env vars
    if (process.platform === "darwin" || process.platform === "win32") {

        if (typeof _dataProxyConfig === "undefined") {
            try {
                console.log("*********** SYSTEM PROXY CHECK...");
                _dataProxyConfig = await getSystemProxy();
                if (!_dataProxyConfig) {
                    _dataProxyConfig = null;
                }
                debug("*********** SYSTEM PROXY CHECK result: ", JSON.stringify(_dataProxyConfig, null, 4));
            } catch (err) {
                console.log("*********** SYSTEM PROXY CHECK error1: ", err);
                _dataProxyConfig = null;
            }
        }

        if (_dataProxyConfig && (_dataProxyConfig.proxyUrl || _dataProxyConfig.noProxy?.length)) {
            try {
                debug("*********** SYSTEM PROXY CHECK pass? ", _dataProxyConfig.proxyUrl, _dataProxyConfig.noProxy, url);
                const proxyUrl = getProxyForUrl_(_dataProxyConfig.proxyUrl, _dataProxyConfig.noProxy, url);
                if (proxyUrl) {
                    debug("*********** SYSTEM PROXY CHECK pass: ", proxyUrl);

                    // TODO? early bailout for isValidProtocol()
                    // if (!proxyUrl.startsWith("file://")) {
                    //     return proxyUrl;
                    // }

                    return proxyUrl;
                }
            } catch (err) {
                debug("*********** SYSTEM PROXY CHECK error2: ", err);
            }
        }
    }

    let proxyUrl: string | undefined;
    try {
        proxyUrl = envGetProxyForUrl(url);
        if (!proxyUrl) {
            proxyUrl = "";
        }
    } catch (err) {
        debug("*********** SYSTEM PROXY CHECK error3: ", url, err);
        proxyUrl = "";
    }
    debug("*********** SYSTEM PROXY CHECK fallback: ", url, proxyUrl);

    // TODO? early bailout for isValidProtocol()
    // if (!proxyUrl.startsWith("file://")) {
    //     return proxyUrl;
    // }
    // return "";

    return proxyUrl;
}

/**
 * Uses the appropriate `Agent` subclass based off of the "proxy"
 * environment variables that are currently set.
 *
 * An LRU cache is used, to prevent unnecessary creation of proxy
 * `http.Agent` instances.
 */
export class ProxyAgent extends Agent {
    /**
     * Cache for `Agent` instances.
     */
    cache = new LRUCache<string, Agent>({
        max: 20,
        dispose: (agent) => agent.destroy(),
    });

    connectOpts?: ProxyAgentOptions;
    httpAgent: http.Agent;
    httpsAgent: http.Agent;
    getProxyForUrl: GetProxyForUrlCallback;

    constructor(opts?: ProxyAgentOptions) {
        super(opts);
        debug("Creating new ProxyAgent instance: %o", opts);
        this.connectOpts = opts;
        this.httpAgent = opts?.httpAgent || new http.Agent(opts);
        this.httpsAgent =
            opts?.httpsAgent || new https.Agent(opts as https.AgentOptions);
        this.getProxyForUrl = opts?.getProxyForUrl || myGetProxyForUrl;
    }

    async connect(
        req: http.ClientRequest,
        opts: AgentConnectOpts,
    ): Promise<http.Agent> {
        const { secureEndpoint } = opts;
        const isWebSocket = req.getHeader("upgrade") === "websocket";
        const protocol = secureEndpoint
            ? isWebSocket
                ? "wss:"
                : "https:"
            : isWebSocket
            ? "ws:"
            : "http:";
        const host = req.getHeader("host");
        const url = new URL(req.path, `${protocol}//${host}`).href;
        const proxy = await this.getProxyForUrl(url, req);

        if (!proxy) {
            debug("Proxy not enabled for URL: %o", url);
            return secureEndpoint ? this.httpsAgent : this.httpAgent;
        }

        debug("Request URL: %o", url);
        debug("Proxy URL: %o", proxy);

        // attempt to get a cached `http.Agent` instance first
        const cacheKey = `${protocol}+${proxy}`;
        let agent = this.cache.get(cacheKey);
        if (!agent) {
            const proxyUrl = new URL(proxy);
            const proxyProto = proxyUrl.protocol.replace(":", "");
            if (!isValidProtocol(proxyProto)) {
                // throw new Error(...);
                debug(`Unsupported protocol for proxy URL: ${proxy}`);
                return secureEndpoint ? this.httpsAgent : this.httpAgent;
            }

            // ---- LAZY vs. NOT LAZY
            // const ctor = await proxies[proxyProto][
            //     secureEndpoint || isWebSocket ? 1 : 0
            // ]();
            let ctor = proxies[proxyProto][
                secureEndpoint || isWebSocket ? 1 : 0
            ] as unknown as AgentConstructor;
            if (proxyProto.startsWith("pac+")) {
                ctor = await (ctor as unknown as (() => Promise<AgentConstructor>))();
            }

            agent = new ctor(proxy, this.connectOpts);
            this.cache.set(cacheKey, agent);
        } else {
            debug("Cache hit for proxy URL: %o", proxy);
        }

        return agent;
    }

    destroy(): void {
        for (const agent of this.cache.values()) {
            agent.destroy();
        }
        super.destroy();
    }
}
