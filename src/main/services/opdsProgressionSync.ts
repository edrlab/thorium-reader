// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import {
    IOpdsProgressionDevice,
    locatorToOpdsProgression,
    opdsProgressionToLocator,
} from "readium-desktop/common/models/opdsProgression";
import type { availableLanguages } from "readium-desktop/common/services/translator";
import type { TOpdsProgressionPutDocument } from "readium-desktop/main/services/opdsProgression";

import type { IReadiumPositionList } from "readium-desktop/common/readium/positions";

export type TOpdsProgressionUploadOutcome =
    | { kind: "success"; modified: string; progression: number }
    | "retry"
    | "drop"
    | "disable"
    | { kind: "hold"; authenticationUrl: string };

export interface IOpdsProgressionSyncRegistration {
    device: IOpdsProgressionDevice;
    initialLocator?: MiniLocatorExtended["locator"];
    locale?: keyof typeof availableLanguages;
    publicationIdentifier: string;
    positionList?: IReadiumPositionList;
    spine: ReadonlyArray<{ Href?: string }>;
    url: string;
    windowIdentifier: string;
}

interface IPendingUpload {
    document: TOpdsProgressionPutDocument;
    retryCount: number;
    authenticationUrl?: string;
}

interface IReaderProgression {
    progression?: number;
    ready: boolean;
    reconciliation?: { appliedProgression?: number };
    suppressedProgression?: number;
}

interface ISession extends Omit<IOpdsProgressionSyncRegistration, "windowIdentifier" | "initialLocator"> {
    readers: Map<string, IReaderProgression>;
    owner?: string;
    disabled: boolean;
    inFlight?: Promise<void>;
    lastUploadedProgression?: number;
    pending?: IPendingUpload;
    timer?: ReturnType<typeof setTimeout>;
}

interface IEndpoint {
    modified: number;
    confirmed: number;
    tail?: Promise<void>;
}

export interface IOpdsProgressionSyncDependencies {
    canUpload?: (windowIdentifier: string, publicationIdentifier: string) => boolean;
    clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
    debounceMs?: number;
    now?: () => number;
    retryMs?: number;
    setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
    upload: (
        url: string,
        document: TOpdsProgressionPutDocument,
        locale?: keyof typeof availableLanguages,
    ) => Promise<TOpdsProgressionUploadOutcome>;
}

const DEFAULT_DEBOUNCE_MS = 5000;
const DEFAULT_RETRY_MS = 1000;
const PROGRESSION_EPSILON = 1e-9;

/** One upload state per publication, sent only by its locked reader. */
export class OpdsProgressionSyncCoordinator {
    private readonly sessions = new Map<string, ISession>();
    private readonly endpoints = new Map<string, IEndpoint>();
    private readonly clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
    private readonly setTimer: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
    private readonly canUpload: NonNullable<IOpdsProgressionSyncDependencies["canUpload"]>;
    private readonly now: () => number;
    private readonly upload: IOpdsProgressionSyncDependencies["upload"];
    private readonly debounceMs: number;
    private readonly retryMs: number;

    public constructor(dependencies: IOpdsProgressionSyncDependencies) {
        this.clearTimer = dependencies.clearTimer || clearTimeout;
        this.setTimer = dependencies.setTimer || setTimeout;
        this.canUpload = dependencies.canUpload ?? (() => true);
        this.now = dependencies.now || Date.now;
        this.upload = dependencies.upload;
        this.debounceMs = dependencies.debounceMs ?? DEFAULT_DEBOUNCE_MS;
        this.retryMs = dependencies.retryMs ?? DEFAULT_RETRY_MS;
    }

    public register(registration: IOpdsProgressionSyncRegistration): void {
        this.discard(registration.windowIdentifier);
        let session = this.sessions.get(registration.publicationIdentifier);
        const progression = locatorToOpdsProgression(
            registration.initialLocator, registration.spine, registration.positionList,
        );
        if (!session) {
            session = {
                ...registration,
                readers: new Map(),
                disabled: false,
                lastUploadedProgression: progression,
            };
            this.sessions.set(registration.publicationIdentifier, session);
        }
        session.readers.set(registration.windowIdentifier, { progression, ready: false });
        if (!session.owner && this.canUpload(registration.windowIdentifier, registration.publicationIdentifier)) {
            session.owner = registration.windowIdentifier;
        }
    }

    public observeLocator(
        windowIdentifier: string,
        locator: MiniLocatorExtended["locator"] | undefined,
        canUpload: boolean,
    ): void {
        const session = this.getSession(windowIdentifier);
        const reader = session?.readers.get(windowIdentifier);
        if (!session || !reader) {
            return;
        }
        const progression = locatorToOpdsProgression(locator, session.spine, session.positionList);
        if (typeof progression !== "number") {
            return;
        }
        const previous = reader.progression;
        reader.progression = progression;
        if (progressionsEqual(reader.suppressedProgression, progression)) {
            if (session.owner === windowIdentifier) {
                reader.suppressedProgression = undefined;
                session.lastUploadedProgression = progression;
                session.pending = undefined;
                this.clearScheduledUpload(session);
            }
            return;
        }
        // The first navigator report without a saved locator is hydration.
        if (typeof previous !== "number") {
            if (session.owner === windowIdentifier) {
                session.lastUploadedProgression = progression;
            }
            return;
        }
        if (canUpload && session.owner === windowIdentifier && !session.disabled &&
            !progressionsEqual(previous, progression)) {
            this.queue(session, progression);
        }
    }

    public acquireUploadLock(windowIdentifier: string): void {
        const session = this.getSession(windowIdentifier);
        const reader = session?.readers.get(windowIdentifier);
        if (!session || !reader || !this.canUpload(windowIdentifier, session.publicationIdentifier)) {
            return;
        }
        if (session.owner !== windowIdentifier) {
            this.clearScheduledUpload(session);
            session.pending = undefined;
            session.owner = windowIdentifier;
        }
        if (progressionsEqual(reader.progression, reader.suppressedProgression)) {
            session.lastUploadedProgression = reader.progression;
            return;
        }
        if (!session.disabled && typeof reader.progression === "number" &&
            !progressionsEqual(reader.progression, session.lastUploadedProgression)) {
            this.queue(session, reader.progression);
        }
    }

    public beginRemoteReconciliation(windowIdentifier: string, remoteProgression: number): void {
        const session = this.getSession(windowIdentifier);
        const reader = session?.readers.get(windowIdentifier);
        if (!session || !reader) {
            return;
        }
        reader.reconciliation = {
            appliedProgression: locatorToOpdsProgression(
                opdsProgressionToLocator(remoteProgression, session.spine, session.positionList),
                session.spine, session.positionList,
            ),
        };
        reader.ready = false;
        if (session.owner === windowIdentifier) {
            this.clearScheduledUpload(session);
        }
    }

    public resolveRemoteReconciliation(windowIdentifier: string, accepted: boolean): void {
        const session = this.getSession(windowIdentifier);
        const reader = session?.readers.get(windowIdentifier);
        if (!session || !reader?.reconciliation) {
            return;
        }
        if (accepted) {
            reader.progression = reader.reconciliation.appliedProgression;
            reader.suppressedProgression = reader.progression;
            if (session.owner === windowIdentifier) {
                session.pending = undefined;
                session.lastUploadedProgression = reader.progression;
                this.clearScheduledUpload(session);
            }
        }
        reader.reconciliation = undefined;
        this.completeInitialGet(windowIdentifier);
    }

    public completeInitialGet(windowIdentifier: string): void {
        const session = this.getSession(windowIdentifier);
        const reader = session?.readers.get(windowIdentifier);
        if (!session || !reader || reader.reconciliation) {
            return;
        }
        reader.ready = true;
        if (session.owner === windowIdentifier && session.pending) {
            this.schedule(session, this.debounceMs);
        }
    }

    public recordRemoteModified(windowIdentifier: string, modified: string): void {
        const session = this.getSession(windowIdentifier);
        if (session) {
            this.recordModified(session.url, modified);
        }
    }

    public async flush(windowIdentifier: string): Promise<void> {
        const session = this.getSession(windowIdentifier);
        if (!session || session.owner !== windowIdentifier || !this.isReady(session)) {
            return;
        }
        this.clearScheduledUpload(session);
        if (session.inFlight !== undefined) {
            await session.inFlight;
            if (session.pending) {
                await this.flush(windowIdentifier);
            }
            return;
        }
        const pending = session.pending;
        if (!pending || pending.authenticationUrl) {
            return;
        }
        session.pending = undefined;
        session.inFlight = this.send(session, windowIdentifier, pending);
        try {
            await session.inFlight;
        } finally {
            session.inFlight = undefined;
        }
    }

    public discard(windowIdentifier: string): void {
        const session = this.getSession(windowIdentifier);
        if (!session) {
            return;
        }
        session.readers.delete(windowIdentifier);
        if (session.owner === windowIdentifier) {
            this.clearScheduledUpload(session);
            session.pending = undefined;
            session.owner = undefined;
        }
        if (!session.readers.size) {
            this.sessions.delete(session.publicationIdentifier);
        }
    }

    public hasPending(windowIdentifier: string): boolean {
        return Boolean(this.getSession(windowIdentifier)?.pending);
    }

    public isDisabled(windowIdentifier: string): boolean {
        return Boolean(this.getSession(windowIdentifier)?.disabled);
    }

    public getPendingAuthenticationUrls(): string[] {
        return [...new Set([...this.sessions.values()].map((session) => session.pending?.authenticationUrl)
            .filter((url): url is string => typeof url === "string"))];
    }

    public resumeAfterAuthentication(authenticationUrl: string): void {
        this.sessions.forEach((session) => {
            if (session.pending?.authenticationUrl === authenticationUrl && !session.disabled) {
                session.pending.authenticationUrl = undefined;
                session.pending.retryCount = 0;
                this.schedule(session, 0);
            }
        });
    }

    private getSession(windowIdentifier: string): ISession | undefined {
        return [...this.sessions.values()].find((session) => session.readers.has(windowIdentifier));
    }

    private endpoint(url: string): IEndpoint {
        let endpoint = this.endpoints.get(url);
        if (!endpoint) {
            endpoint = { modified: 0, confirmed: 0 };
            this.endpoints.set(url, endpoint);
        }
        return endpoint;
    }

    private recordModified(url: string, modified: string): void {
        const time = Date.parse(modified);
        if (!Number.isFinite(time)) {
            return;
        }
        const endpoint = this.endpoint(url);
        endpoint.confirmed = Math.max(endpoint.confirmed, time);
        endpoint.modified = Math.max(endpoint.modified, time);
        this.sessions.forEach((session) => {
            if (session.url === url && session.pending) {
                this.rebase(endpoint, session.pending);
            }
        });
    }

    private rebase(endpoint: IEndpoint, pending: IPendingUpload): void {
        if (Date.parse(pending.document.modified) <= endpoint.confirmed) {
            pending.document.modified = new Date(++endpoint.modified).toISOString();
        }
    }

    private isReady(session: ISession): boolean {
        return this.sessions.get(session.publicationIdentifier) === session && !session.disabled &&
            typeof session.owner === "string" && Boolean(session.readers.get(session.owner)?.ready) &&
            this.canUpload(session.owner, session.publicationIdentifier);
    }

    private schedule(session: ISession, delay: number): void {
        if (!this.isReady(session) || session.pending?.authenticationUrl) {
            return;
        }
        this.clearScheduledUpload(session);
        session.timer = this.setTimer(() => {
            session.timer = undefined;
            if (session.owner) {
                void this.flush(session.owner);
            }
        }, delay);
    }

    private clearScheduledUpload(session: ISession): void {
        if (session.timer !== undefined) {
            this.clearTimer(session.timer);
            session.timer = undefined;
        }
    }

    private queue(session: ISession, progression: number): void {
        const endpoint = this.endpoint(session.url);
        endpoint.modified = Math.max(this.now(), endpoint.modified + 1);
        session.pending = {
            authenticationUrl: session.pending?.authenticationUrl,
            document: { device: session.device, modified: new Date(endpoint.modified).toISOString(), progression },
            retryCount: 0,
        };
        this.schedule(session, this.debounceMs);
    }

    private async send(session: ISession, owner: string, pending: IPendingUpload): Promise<void> {
        const endpoint = this.endpoint(session.url);
        const previous = endpoint.tail;
        let release: () => void = () => undefined;
        endpoint.tail = new Promise<void>((resolve) => { release = resolve; });
        try {
            if (previous !== undefined) {
                await previous;
            }
            if (session.owner !== owner || !this.isReady(session)) {
                return;
            }
            this.rebase(endpoint, pending);
            const outcome = await this.upload(session.url, pending.document, session.locale);
            if (typeof outcome === "object" && outcome.kind === "success") {
                this.recordModified(session.url, outcome.modified);
            }
            if (session.owner !== owner || this.sessions.get(session.publicationIdentifier) !== session) {
                return;
            }
            if (typeof outcome === "object") {
                if (outcome.kind === "success") {
                    session.lastUploadedProgression = outcome.progression;
                } else {
                    session.pending = { ...(session.pending || pending), authenticationUrl: outcome.authenticationUrl, retryCount: 0 };
                    this.clearScheduledUpload(session);
                }
            } else if (outcome === "disable") {
                session.disabled = true;
                session.pending = undefined;
                this.clearScheduledUpload(session);
            } else if (outcome === "drop") {
                session.lastUploadedProgression = pending.document.progression;
            } else if (!session.pending) {
                session.pending = pending;
                if (pending.retryCount++ === 0) {
                    this.schedule(session, this.retryMs);
                }
            }
        } finally {
            release();
        }
    }
}

const progressionsEqual = (left: number | undefined, right: number | undefined): boolean =>
    typeof left === "number" && typeof right === "number" && Math.abs(left - right) <= PROGRESSION_EPSILON;
