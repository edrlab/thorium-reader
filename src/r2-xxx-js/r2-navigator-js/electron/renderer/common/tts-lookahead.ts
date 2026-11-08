import type {
    ITtsLookAheadBlock,
    ITtsLookAheadPosition,
    ITtsLookAheadSnapshot,
    ITtsLookAheadSource,
    ITtsLookAheadUnit,
    TtsLookAheadBlockKind,
    TtsLookAheadBoundary,
    TtsLookAheadDirection,
} from "../../common/tts-lookahead";
import {
    getTtsQueueItemRefText,
    type ITtsQueueItem,
    type ITtsQueueItemReference,
} from "./dom-text-utils";

export type {
    ITtsLookAheadBlock,
    ITtsLookAheadPosition,
    ITtsLookAheadSnapshot,
    ITtsLookAheadSource,
    ITtsLookAheadUnit,
    TtsLookAheadBlockKind,
    TtsLookAheadBoundary,
    TtsLookAheadDirection,
};

export interface ITtsLookAheadBuildState {
    generation: number;
    revision: number;
}

export type ITtsLookAheadEmissionToken = ITtsLookAheadBuildState;

export type TtsLookAheadNavigationKind = "automatic" | "jump" | "next" | "previous" | "slider";

export interface ITtsLookAheadNavigationOptions {
    escape?: boolean;
    skipSentences?: boolean;
}

export function startTtsWithLookAhead(
    markPlaying: () => void,
    emitSnapshot: () => void,
    scheduleSpeech: () => void,
): void {
    try {
        markPlaying();
        emitSnapshot();
    } finally {
        scheduleSpeech();
    }
}

export function resumeTtsWithLookAhead<T>(
    utterance: T,
    emitSnapshot: (utterance: T) => void,
    speak: (utterance: T) => void,
) {
    emitSnapshot(utterance);
    speak(utterance);
}

export class TtsLookAheadLifecycle {
    private _generation = -1;
    private _revision = 0;
    private _sourceFingerprint: string | undefined;

    public get state(): ITtsLookAheadBuildState {
        return {
            generation: this._generation,
            revision: this._revision,
        };
    }

    public rebuildQueue(): ITtsLookAheadBuildState {
        return this.invalidate();
    }

    public invalidate(): ITtsLookAheadBuildState {
        this._generation++;
        this._revision = 0;
        return this.state;
    }

    public createEmissionToken(source: ITtsLookAheadSource): ITtsLookAheadEmissionToken {
        const sourceFingerprint = JSON.stringify([source.rate, source.voiceName, source.voiceURI, source.lang]);
        if (this._generation < 0) {
            this.rebuildQueue();
        }
        if (this._sourceFingerprint === undefined) {
            this._sourceFingerprint = sourceFingerprint;
        } else if (this._sourceFingerprint !== sourceFingerprint) {
            this._sourceFingerprint = sourceFingerprint;
            this.rebuildQueue();
        }
        return this.state;
    }

    public acceptEmission(token: ITtsLookAheadEmissionToken): boolean {
        if (token.generation !== this._generation || token.revision !== this._revision) {
            return false;
        }
        this._revision++;
        return true;
    }
}

export function scheduleTtsLookAheadNavigation(
    lifecycle: TtsLookAheadLifecycle,
    kind: TtsLookAheadNavigationKind,
    options: ITtsLookAheadNavigationOptions,
    schedule: () => void,
): void {
    if (kind === "previous" || kind === "slider" || kind === "jump" ||
        (kind === "next" && (!!options.escape || !!options.skipSentences))) {
        lifecycle.invalidate();
    }
    schedule();
}

interface ITtsLookAheadUnitReference {
    blockElement: Element;
    unit: ITtsLookAheadUnit;
    element: Element;
    reference: ITtsQueueItemReference;
}

interface ITtsLookAheadMappedReference {
    position: ITtsLookAheadPosition;
    reference: ITtsQueueItemReference;
    sequence: number;
}

function getEpubTypes(element: Element): string[] | undefined {
    const epubType = element.getAttribute("epub:type");
    if (!epubType) {
        return undefined;
    }

    const epubTypes = epubType.trim().split(/\s+/).filter((value) => value.length > 0);
    return epubTypes.length ? epubTypes : undefined;
}

function getBlockKind(htmlTag: string, epubTypes: string[] | undefined): TtsLookAheadBlockKind | undefined {
    if (epubTypes && epubTypes.indexOf("pagebreak") >= 0) {
        return "page-break";
    }

    if (/^h[1-6]$/.test(htmlTag)) {
        return "heading";
    }
    if (htmlTag === "li") {
        return "list-item";
    }
    if (htmlTag === "p") {
        return "paragraph";
    }
    if (htmlTag === "blockquote") {
        return "blockquote";
    }
    if (htmlTag === "figcaption" || htmlTag === "caption") {
        return "caption";
    }
    if (htmlTag === "td" || htmlTag === "th") {
        return "table-cell";
    }
    if (htmlTag === "pre" || htmlTag === "code") {
        return "code";
    }
    if (htmlTag === "math" || htmlTag.indexOf("mjx-") === 0) {
        return "math";
    }
    if (htmlTag === "img" || htmlTag === "svg") {
        return "image-description";
    }

    return undefined;
}

function parentElement(element: Element): Element | undefined {
    const parent = element.parentElement || element.parentNode;
    return parent && parent.nodeType === 1 ? parent as Element : undefined;
}

function findSemanticBlock(element: Element): { element: Element; kind: TtsLookAheadBlockKind } {
    let currentElement: Element | undefined = element;
    while (currentElement) {
        const htmlTag = currentElement.tagName.toLowerCase();
        const kind = getBlockKind(htmlTag, getEpubTypes(currentElement));
        if (kind) {
            return { element: currentElement, kind };
        }
        currentElement = parentElement(currentElement);
    }
    return { element, kind: "other" };
}

export function classifyTtsLookAheadBlock(
    element: Element,
    generation: number,
    blockIndex: number,
): ITtsLookAheadBlock {
    const { element: semanticElement, kind } = findSemanticBlock(element);

    const htmlTag = semanticElement.tagName.toLowerCase();
    const epubTypes = getEpubTypes(semanticElement);
    const ariaRole = semanticElement.getAttribute("role");
    const block: ITtsLookAheadBlock = {
        id: `${generation}:${blockIndex}`,
        kind,
        htmlTag,
    };

    if (kind === "heading") {
        block.headingLevel = Number(htmlTag.charAt(1));
    }
    if (epubTypes) {
        block.epubTypes = epubTypes;
    }
    if (ariaRole) {
        block.ariaRole = ariaRole;
    }

    return block;
}

function nearestAncestor(element: Element, tagName: string): Element | undefined {
    let currentElement: Element | undefined = element;
    while (currentElement) {
        if (currentElement.tagName.toLowerCase() === tagName) {
            return currentElement;
        }
        currentElement = parentElement(currentElement);
    }
    return undefined;
}

function direction(value: string | undefined): TtsLookAheadDirection | undefined {
    return value === "ltr" || value === "rtl" || value === "auto" ? value : undefined;
}

function boundaryBetween(
    previous: ITtsLookAheadUnitReference | undefined,
    next: ITtsLookAheadUnitReference | undefined,
): TtsLookAheadBoundary {
    if (!previous || !next) {
        return "document";
    }

    if (nearestAncestor(previous.element, "section") !== nearestAncestor(next.element, "section")) {
        return "section";
    }
    if (previous.unit.block.kind === "heading" && next.unit.block.kind !== "heading") {
        return "heading-to-body";
    }
    if (nearestAncestor(previous.element, "li") !== nearestAncestor(next.element, "li")) {
        return "list-item";
    }
    if (previous.blockElement !== next.blockElement) {
        return "paragraph";
    }
    if (previous.reference.iArray === next.reference.iArray) {
        return "sentence";
    }
    return "none";
}

function createUnitReference(
    mappedReference: ITtsLookAheadMappedReference,
    state: ITtsLookAheadBuildState,
): ITtsLookAheadUnitReference {
    const { position, reference, sequence } = mappedReference;
    const unit: ITtsLookAheadUnit = {
        sequence,
        text: getTtsQueueItemRefText(reference),
        block: classifyTtsLookAheadBlock(reference.item.parentElement, state.generation, reference.iArray),
        position,
        boundaryBefore: "none",
        boundaryAfter: "none",
    };
    if (reference.item.lang) {
        unit.lang = reference.item.lang;
    }
    const unitDirection = direction(reference.item.dir);
    if (unitDirection) {
        unit.direction = unitDirection;
    }

    return {
        blockElement: findSemanticBlock(reference.item.parentElement).element,
        element: reference.item.parentElement,
        reference,
        unit,
    };
}

function mapSpokenQueue(queue: ITtsQueueItem[]): ITtsLookAheadMappedReference[] {
    const mappedReferences: ITtsLookAheadMappedReference[] = [];
    let globalIndex = 0;

    queue.forEach((item, iArray) => {
        const texts = item.combinedTextSentences || [item.combinedText];
        const spokenReferences: ITtsQueueItemReference[] = [];
        texts.forEach((text, iSentence) => {
            const reference: ITtsQueueItemReference = {
                iArray,
                iGlobal: globalIndex,
                iSentence: item.combinedTextSentences ? iSentence : -1,
                item,
            };
            globalIndex++;
            if (text.trim()) {
                spokenReferences.push(reference);
            }
        });

        spokenReferences.forEach((reference, indexInBlock) => {
            mappedReferences.push({
                position: {
                    firstInBlock: indexInBlock === 0,
                    indexInBlock,
                    lastInBlock: indexInBlock === spokenReferences.length - 1,
                },
                reference,
                sequence: mappedReferences.length,
            });
        });
    });

    return mappedReferences;
}

export function buildTtsLookAheadSnapshot(
    queue: ITtsQueueItem[],
    currentIndex: number,
    state: ITtsLookAheadBuildState,
    source: ITtsLookAheadSource,
    maxUnits = 12,
): ITtsLookAheadSnapshot | undefined {
    if (currentIndex < 0) {
        return undefined;
    }

    const unitLimit = Math.max(0, Math.min(maxUnits, 12));
    const mappedReferences = mapSpokenQueue(queue);
    const currentMappedIndex = mappedReferences.findIndex(({ reference }) => reference.iGlobal >= currentIndex);
    if (unitLimit === 0 || currentMappedIndex < 0) {
        return undefined;
    }
    const references = mappedReferences
        .slice(currentMappedIndex, currentMappedIndex + unitLimit)
        .map((reference) => createUnitReference(reference, state));

    const previousReference = mappedReferences[currentMappedIndex - 1];
    const previousUnit = previousReference
        ? createUnitReference(previousReference, state)
        : undefined;
    references[0].unit.boundaryBefore = boundaryBetween(previousUnit, references[0]);

    for (let index = 1; index < references.length; index++) {
        const boundary = boundaryBetween(references[index - 1], references[index]);
        references[index - 1].unit.boundaryAfter = boundary;
        references[index].unit.boundaryBefore = boundary;
    }

    const nextReference = mappedReferences[currentMappedIndex + references.length];
    const nextUnit = nextReference
        ? createUnitReference(nextReference, state)
        : undefined;
    references[references.length - 1].unit.boundaryAfter = boundaryBetween(references[references.length - 1], nextUnit);

    return {
        generation: state.generation,
        revision: state.revision,
        currentSequence: references[0].unit.sequence,
        source,
        units: references.map((reference) => reference.unit),
    };
}
