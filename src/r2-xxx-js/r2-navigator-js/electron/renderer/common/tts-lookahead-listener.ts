import type { ITtsLookAheadSnapshot, ITtsLookAheadUnit } from "../../common/tts-lookahead";

export type TtsLookAheadListener = (snapshot: ITtsLookAheadSnapshot) => void;

const boundaries = new Set([
    "none",
    "sentence",
    "paragraph",
    "list-item",
    "heading-to-body",
    "section",
    "document",
]);
const blockKinds = new Set([
    "heading",
    "paragraph",
    "list-item",
    "blockquote",
    "caption",
    "table-cell",
    "code",
    "math",
    "image-description",
    "page-break",
    "other",
]);
const directions = new Set(["ltr", "rtl", "auto"]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isOptionalString(value: unknown): boolean {
    return typeof value === "undefined" || typeof value === "string";
}

function isOneOf(value: unknown, allowed: Set<string>): boolean {
    return typeof value === "string" && allowed.has(value);
}

function isTtsLookAheadUnit(value: unknown): value is ITtsLookAheadUnit {
    if (!isRecord(value) ||
        !isNonNegativeSafeInteger(value.sequence) ||
        typeof value.text !== "string" || !value.text.trim() ||
        !isOptionalString(value.lang) ||
        (typeof value.direction !== "undefined" && !isOneOf(value.direction, directions)) ||
        !isRecord(value.block) ||
        typeof value.block.id !== "string" ||
        !isOneOf(value.block.kind, blockKinds) ||
        !isOptionalString(value.block.htmlTag) ||
        (typeof value.block.headingLevel !== "undefined" && !isNumber(value.block.headingLevel)) ||
        (typeof value.block.epubTypes !== "undefined" &&
            (!Array.isArray(value.block.epubTypes) || value.block.epubTypes.some((type) => typeof type !== "string"))) ||
        !isOptionalString(value.block.ariaRole) ||
        !isRecord(value.position) ||
        !isNonNegativeSafeInteger(value.position.indexInBlock) ||
        typeof value.position.firstInBlock !== "boolean" ||
        value.position.firstInBlock !== (value.position.indexInBlock === 0) ||
        typeof value.position.lastInBlock !== "boolean" ||
        !isOneOf(value.boundaryBefore, boundaries) ||
        !isOneOf(value.boundaryAfter, boundaries)) {
        return false;
    }
    return true;
}

export function isTtsLookAheadSnapshot(value: unknown): value is ITtsLookAheadSnapshot {
    if (!isRecord(value) ||
        !isNonNegativeSafeInteger(value.generation) ||
        !isNonNegativeSafeInteger(value.revision) ||
        !isNonNegativeSafeInteger(value.currentSequence) ||
        !isRecord(value.source) ||
        !isNumber(value.source.rate) ||
        !isOptionalString(value.source.voiceName) ||
        !isOptionalString(value.source.voiceURI) ||
        !isOptionalString(value.source.lang) ||
        !Array.isArray(value.units) ||
        value.units.length < 1 || value.units.length > 12) {
        return false;
    }

    const units = value.units;
    if (!units.every(isTtsLookAheadUnit) || units[0].sequence !== value.currentSequence) {
        return false;
    }

    for (let index = 1; index < units.length; index++) {
        const previous = units[index - 1];
        const unit = units[index];
        if (unit.sequence !== previous.sequence + 1 ||
            previous.boundaryAfter !== unit.boundaryBefore) {
            return false;
        }

        if (previous.block.id === unit.block.id) {
            if (previous.position.lastInBlock || unit.position.firstInBlock ||
                unit.position.indexInBlock !== previous.position.indexInBlock + 1) {
                return false;
            }
        } else if (!previous.position.lastInBlock || !unit.position.firstInBlock) {
            return false;
        }
    }

    return true;
}

export class TtsLookAheadListenerRegistry {
    private _listener: TtsLookAheadListener | undefined;

    public listen(listener: TtsLookAheadListener | undefined): void {
        this._listener = listener;
    }

    public handle(payload: unknown): void {
        if (!this._listener || !isTtsLookAheadSnapshot(payload)) {
            return;
        }

        try {
            this._listener(payload);
        } catch (_error) {
            // A consumer error must not interrupt renderer IPC handling.
        }
    }
}

export class TtsLookAheadRendererCoordinator<TOrigin> {
    private _localGeneration: number | undefined;
    private _origin: TOrigin | undefined;
    private _rendererGeneration = -1;
    private _rendererRevision = 0;

    public constructor(private readonly _registry: TtsLookAheadListenerRegistry) {
    }

    public handle(
        currentOrigin: TOrigin | undefined,
        eventOrigin: TOrigin,
        payload: unknown,
    ): boolean {
        if (!currentOrigin || currentOrigin !== eventOrigin || !isTtsLookAheadSnapshot(payload)) {
            return false;
        }

        const localGeneration = payload.generation;
        if (this._origin !== eventOrigin || this._localGeneration !== localGeneration) {
            this._origin = eventOrigin;
            this._localGeneration = localGeneration;
            this._rendererGeneration++;
            this._rendererRevision = 0;
        }

        const localBlockPrefix = `${localGeneration}:`;
        const rendererBlockPrefix = `${this._rendererGeneration}:`;
        payload.units.forEach((unit) => {
            const localBlockId = unit.block.id;
            const blockIndex = localBlockId.indexOf(localBlockPrefix) === 0
                ? localBlockId.slice(localBlockPrefix.length)
                : localBlockId;
            unit.block.id = `${rendererBlockPrefix}${blockIndex}`;
        });
        payload.generation = this._rendererGeneration;
        payload.revision = this._rendererRevision++;
        this._registry.handle(payload);
        return true;
    }
}
