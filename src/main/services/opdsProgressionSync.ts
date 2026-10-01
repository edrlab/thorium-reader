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
    spine: ReadonlyArray<{ Href?: string }>;
    url: string;
    windowIdentifier: string;
}

export interface IOpdsProgressionLockReader {
    identifier: string;
    publicationIdentifier: string;
}

export const findOpdsProgressionLockCandidate = (
    readers: readonly IOpdsProgressionLockReader[],
    publicationIdentifier: string,
    closingWindowIdentifiers: ReadonlySet<string>,
): string | undefined => readers.find((reader) =>
    reader.publicationIdentifier === publicationIdentifier
    && !closingWindowIdentifiers.has(reader.identifier))?.identifier;

interface IPendingUpload {
    document: TOpdsProgressionPutDocument;
    retryCount: number;
    authenticationUrl?: string;
}

interface ISession extends IOpdsProgressionSyncRegistration {
    closing: boolean;
    disabled: boolean;
    getCompleted: boolean;
    inFlight?: Promise<void>;
    lastObservedProgression?: number;
    lastUploadedProgression?: number;
    pending?: IPendingUpload;
    reconciliation?: {
        appliedProgression?: number;
    };
    readyWaiters: Set<() => void>;
    suppressedProgression?: number;
    timer?: ReturnType<typeof setTimeout>;
}

export interface IOpdsProgressionSyncDependencies {
    clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
    closeWaitMs?: number;
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
// The progression GET has a six-second timeout. Give it one extra second to
// release the close path, while still bounding an unanswered reconciliation.
const DEFAULT_CLOSE_WAIT_MS = 7000;

/**
 * Coordinates progression uploads independently for every reader window.
 * Without a persisted locator, the first valid position establishes the
 * hydration baseline. Uploads remain gated until initial reconciliation ends.
 */
export class OpdsProgressionSyncCoordinator {
    private readonly clearTimer: (timer: ReturnType<typeof setTimeout>) => void;
    private readonly closeWaitMs: number;
    private readonly debounceMs: number;
    private readonly now: () => number;
    private readonly retryMs: number;
    private readonly confirmedModifiedTimeByUrl = new Map<string, number>();
    private readonly modifiedTimeByUrl = new Map<string, number>();
    private readonly sessions = new Map<string, ISession>();
    private readonly setTimer: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
    private readonly upload: IOpdsProgressionSyncDependencies["upload"];
    private readonly uploadTailByUrl = new Map<string, Promise<void>>();

    public constructor(dependencies: IOpdsProgressionSyncDependencies) {
        this.clearTimer = dependencies.clearTimer || clearTimeout;
        this.closeWaitMs = dependencies.closeWaitMs ?? DEFAULT_CLOSE_WAIT_MS;
        this.debounceMs = dependencies.debounceMs ?? DEFAULT_DEBOUNCE_MS;
        this.now = dependencies.now || Date.now;
        this.retryMs = dependencies.retryMs ?? DEFAULT_RETRY_MS;
        this.setTimer = dependencies.setTimer || setTimeout;
        this.upload = dependencies.upload;
    }

    public register(registration: IOpdsProgressionSyncRegistration): void {
        this.discard(registration.windowIdentifier);
        const initialProgression = locatorToOpdsProgression(
            registration.initialLocator,
            registration.spine,
        );
        this.sessions.set(registration.windowIdentifier, {
            ...registration,
            closing: false,
            disabled: false,
            getCompleted: false,
            lastObservedProgression: initialProgression,
            lastUploadedProgression: initialProgression,
            readyWaiters: new Set(),
        });
    }

    public observeLocator(
        windowIdentifier: string,
        locator: MiniLocatorExtended["locator"] | undefined,
        canUpload: boolean,
    ): void {
        const session = this.sessions.get(windowIdentifier);
        if (!session) {
            return;
        }

        const progression = locatorToOpdsProgression(locator, session.spine);
        if (typeof progression !== "number") {
            return;
        }

        const previousProgression = session.lastObservedProgression;
        session.lastObservedProgression = progression;

        if (progressionsEqual(session.suppressedProgression, progression)) {
            session.suppressedProgression = undefined;
            session.lastUploadedProgression = progression;
            session.pending = undefined;
            this.clearScheduledUpload(session);
            return;
        }

        // With no persisted position, the navigator's first valid report is
        // hydration. A registered persisted position lets the very first
        // differing report count as genuine movement.
        if (typeof previousProgression !== "number") {
            session.lastUploadedProgression = progression;
            return;
        }

        if (progressionsEqual(previousProgression, progression) || !canUpload || session.disabled) {
            return;
        }

        this.queue(session, progression);
    }

    /** Reconsiders the latest observed position when this reader becomes owner. */
    public acquireUploadLock(windowIdentifier: string): void {
        const session = this.sessions.get(windowIdentifier);
        if (!session || session.disabled || typeof session.lastObservedProgression !== "number") {
            return;
        }
        if (progressionsEqual(session.lastObservedProgression, session.lastUploadedProgression)) {
            return;
        }

        this.queue(session, session.lastObservedProgression);
    }

    /** Holds uploads while the user decides whether to apply a newer remote position. */
    public beginRemoteReconciliation(windowIdentifier: string, remoteProgression: number): void {
        const session = this.sessions.get(windowIdentifier);
        if (!session || session.disabled) {
            return;
        }

        const appliedLocator = opdsProgressionToLocator(remoteProgression, session.spine);
        session.reconciliation = {
            appliedProgression: locatorToOpdsProgression(appliedLocator, session.spine),
        };
        session.getCompleted = false;
        this.clearScheduledUpload(session);
    }

    /** Releases reconciliation, either adopting the remote position or keeping local state. */
    public resolveRemoteReconciliation(windowIdentifier: string, accepted: boolean): void {
        const session = this.sessions.get(windowIdentifier);
        if (!session || session.disabled || !session.reconciliation) {
            return;
        }

        const { appliedProgression } = session.reconciliation;
        session.reconciliation = undefined;
        if (accepted) {
            session.pending = undefined;
            this.clearScheduledUpload(session);
            session.suppressedProgression = appliedProgression;
            session.lastUploadedProgression = appliedProgression;
            session.lastObservedProgression = appliedProgression;
        }
        this.releaseUploadGate(session);
    }

    public completeInitialGet(windowIdentifier: string): void {
        const session = this.sessions.get(windowIdentifier);
        if (!session || session.disabled) {
            return;
        }
        if (!session.reconciliation) {
            this.releaseUploadGate(session);
        }
    }

    /** Seeds the per-resource timestamp floor from a validated GET document. */
    public recordRemoteModified(windowIdentifier: string, modified: string): void {
        const session = this.sessions.get(windowIdentifier);
        if (!session) {
            return;
        }
        this.recordRemoteModifiedForUrl(session.url, modified);
    }

    private recordRemoteModifiedForUrl(url: string, modified: string): void {
        const modifiedTime = Date.parse(modified);
        if (!Number.isFinite(modifiedTime)) {
            return;
        }
        this.confirmedModifiedTimeByUrl.set(
            url,
            Math.max(this.confirmedModifiedTimeByUrl.get(url) || 0, modifiedTime),
        );
        let floor = Math.max(this.modifiedTimeByUrl.get(url) || 0, modifiedTime);
        this.modifiedTimeByUrl.set(url, floor);

        // A position can be observed while GET is in flight. Rebase any such
        // gated candidate when the server clock is ahead, so choosing local
        // cannot immediately conflict with the document just retrieved.
        this.sessions.forEach((candidateSession) => {
            const pending = candidateSession.pending;
            if (
                candidateSession.url !== url
                || !pending
                || Date.parse(pending.document.modified) > modifiedTime
            ) {
                return;
            }
            floor += 1;
            pending.document = {
                ...pending.document,
                modified: new Date(floor).toISOString(),
            };
            this.modifiedTimeByUrl.set(url, floor);
        });
    }

    public async flush(windowIdentifier: string): Promise<void> {
        const session = this.sessions.get(windowIdentifier);
        if (!session || session.disabled || !session.getCompleted || session.closing) {
            return;
        }

        this.clearScheduledUpload(session);

        if (typeof session.inFlight !== "undefined") {
            await session.inFlight;
            if (session.pending && !session.disabled && this.sessions.get(windowIdentifier) === session) {
                await this.flush(windowIdentifier);
            }
            return;
        }

        const pending = session.pending;
        if (!pending) {
            return;
        }
        session.pending = undefined;

        session.inFlight = this.performUpload(session, pending);
        try {
            await session.inFlight;
        } finally {
            session.inFlight = undefined;
        }
    }

    public async close(windowIdentifier: string): Promise<void> {
        const session = this.sessions.get(windowIdentifier);
        if (!session) {
            return;
        }
        session.closing = true;
        this.clearScheduledUpload(session);

        if (!session.getCompleted) {
            if (!session.pending && typeof session.inFlight === "undefined") {
                this.discard(windowIdentifier);
                return;
            }
            await this.waitForUploadGate(session);
        }
        if (this.sessions.get(windowIdentifier) === session && session.getCompleted && !session.disabled) {
            await this.drainForClose(session);
        }
        if (this.sessions.get(windowIdentifier) === session) {
            this.discard(windowIdentifier);
        }
    }

    public discard(windowIdentifier: string): void {
        const session = this.sessions.get(windowIdentifier);
        if (typeof session?.timer !== "undefined") {
            this.clearTimer(session.timer);
        }
        session?.readyWaiters.forEach((resolve) => resolve());
        session?.readyWaiters.clear();
        this.sessions.delete(windowIdentifier);
    }

    public hasPending(windowIdentifier: string): boolean {
        return Boolean(this.sessions.get(windowIdentifier)?.pending);
    }

    public isDisabled(windowIdentifier: string): boolean {
        return Boolean(this.sessions.get(windowIdentifier)?.disabled);
    }

    public getPendingAuthenticationUrls(): string[] {
        return [...new Set(
            [...this.sessions.values()]
                .map((session) => session.pending?.authenticationUrl)
                .filter((url): url is string => typeof url === "string"),
        )];
    }

    /** Retries candidates for one endpoint after usable credentials are stored. */
    public resumeAfterAuthentication(authenticationUrl: string): void {
        this.sessions.forEach((session) => {
            if (
                session.pending?.authenticationUrl === authenticationUrl
                && session.getCompleted
                && !session.closing
                && !session.disabled
            ) {
                session.pending = {
                    ...session.pending,
                    retryCount: 0,
                    authenticationUrl: undefined,
                };
                this.schedule(session, 0);
            }
        });
    }

    private schedule(session: ISession, delay: number): void {
        if (session.closing || session.disabled || !session.getCompleted) {
            return;
        }
        if (typeof session.timer !== "undefined") {
            this.clearTimer(session.timer);
        }
        session.timer = this.setTimer(() => {
            session.timer = undefined;
            if (this.sessions.get(session.windowIdentifier) === session) {
                void this.flush(session.windowIdentifier);
            }
        }, delay);
    }

    private async performUpload(
        session: ISession,
        pending: IPendingUpload,
        scheduleRetry = true,
        retainExhausted = true,
    ): Promise<void> {
        await this.withUrlUploadLock(session.url, async () => {
            if (this.sessions.get(session.windowIdentifier) !== session) {
                return;
            }
            this.rebaseUploadAgainstConfirmedModified(session.url, pending);
            await this.performLockedUpload(session, pending, scheduleRetry, retainExhausted);
        });
    }

    private async performLockedUpload(
        session: ISession,
        pending: IPendingUpload,
        scheduleRetry: boolean,
        retainExhausted: boolean,
    ): Promise<void> {
        const outcome = await this.upload(session.url, pending.document, session.locale);
        if (typeof outcome === "object" && outcome.kind === "success") {
            this.recordRemoteModifiedForUrl(session.url, outcome.modified);
            session.lastUploadedProgression = outcome.progression;
            return;
        }
        if (outcome === "drop") {
            session.lastUploadedProgression = pending.document.progression;
            return;
        }
        if (typeof outcome === "object" && outcome.kind === "hold") {
            const newest = session.pending || pending;
            session.pending = {
                ...newest,
                authenticationUrl: outcome.authenticationUrl,
                retryCount: 0,
            };
            this.clearScheduledUpload(session);
            return;
        }
        if (outcome === "disable") {
            session.disabled = true;
            session.pending = undefined;
            this.clearScheduledUpload(session);
            return;
        }

        if (pending.retryCount >= 1) {
            // Normal operation keeps the newest exhausted candidate available
            // for replacement or one final close-time attempt, but never arms
            // an automatic third request.
            if (retainExhausted && !session.pending) {
                session.pending = pending;
            }
            return;
        }

        // Do not replace a newer locator that arrived while this request was in flight.
        if (!session.pending) {
            session.pending = {
                ...pending,
                retryCount: pending.retryCount + 1,
            };
        }
        if (scheduleRetry) {
            this.schedule(session, this.retryMs);
        }
    }

    private rebaseUploadAgainstConfirmedModified(url: string, pending: IPendingUpload): void {
        const pendingModifiedTime = Date.parse(pending.document.modified);
        const confirmedModifiedTime = this.confirmedModifiedTimeByUrl.get(url) || 0;
        if (!Number.isFinite(pendingModifiedTime) || confirmedModifiedTime < pendingModifiedTime) {
            return;
        }
        const modifiedTime = Math.max(
            this.modifiedTimeByUrl.get(url) || 0,
            confirmedModifiedTime,
        ) + 1;
        this.modifiedTimeByUrl.set(url, modifiedTime);
        pending.document = {
            ...pending.document,
            modified: new Date(modifiedTime).toISOString(),
        };
    }

    private async withUrlUploadLock<T>(url: string, operation: () => Promise<T>): Promise<T> {
        const previous = this.uploadTailByUrl.get(url);
        let release: (() => void) | undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const tail = typeof previous !== "undefined" ? previous.then(() => gate) : gate;
        this.uploadTailByUrl.set(url, tail);

        if (typeof previous !== "undefined") {
            await previous;
        }
        try {
            return await operation();
        } finally {
            release?.();
            if (this.uploadTailByUrl.get(url) === tail) {
                this.uploadTailByUrl.delete(url);
            }
        }
    }

    private clearScheduledUpload(session: ISession): void {
        if (typeof session.timer !== "undefined") {
            this.clearTimer(session.timer);
            session.timer = undefined;
        }
    }

    private async drainForClose(session: ISession): Promise<void> {
        while (!session.disabled && this.sessions.get(session.windowIdentifier) === session) {
            this.clearScheduledUpload(session);
            if (typeof session.inFlight !== "undefined") {
                await session.inFlight;
                continue;
            }

            const pending = session.pending;
            if (!pending) {
                return;
            }
            if (pending.authenticationUrl) {
                return;
            }
            session.pending = undefined;
            session.inFlight = this.performUpload(session, pending, false, false);
            try {
                await session.inFlight;
            } finally {
                session.inFlight = undefined;
            }
        }
    }

    private queue(session: ISession, progression: number): void {
        const modifiedTime = Math.max(
            this.now(),
            (this.modifiedTimeByUrl.get(session.url) || 0) + 1,
        );
        this.modifiedTimeByUrl.set(session.url, modifiedTime);
        const authenticationUrl = session.pending?.authenticationUrl;
        session.pending = {
            authenticationUrl,
            document: {
                device: session.device,
                modified: new Date(modifiedTime).toISOString(),
                progression,
            },
            retryCount: 0,
        };

        if (authenticationUrl) {
            this.clearScheduledUpload(session);
        } else {
            this.schedule(session, this.debounceMs);
        }
    }

    private releaseUploadGate(session: ISession): void {
        session.getCompleted = true;
        session.readyWaiters.forEach((resolve) => resolve());
        session.readyWaiters.clear();
        if (session.pending) {
            this.schedule(session, this.debounceMs);
        }
    }

    private async waitForUploadGate(session: ISession): Promise<void> {
        await new Promise<void>((resolve) => {
            let settled = false;
            const waitState: { timer?: ReturnType<typeof setTimeout> } = {};
            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                session.readyWaiters.delete(finish);
                if (typeof waitState.timer !== "undefined") {
                    this.clearTimer(waitState.timer);
                }
                resolve();
            };

            session.readyWaiters.add(finish);
            waitState.timer = this.setTimer(finish, this.closeWaitMs);
        });
    }
}

const progressionsEqual = (
    left: number | undefined,
    right: number | undefined,
): boolean => typeof left === "number"
    && typeof right === "number"
    && Math.abs(left - right) <= PROGRESSION_EPSILON;
