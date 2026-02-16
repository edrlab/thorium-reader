import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {IEpubCfiParserError} from '../parser/IEpubCfiParserError';
import {EpubCfiResolvedPath} from './EpubCfiResolvedPath';
import {EpubCfiSideBias} from './EpubCfiSideBias';
import {IEpubCfiResolverError} from './IEpubCfiResolverError';
import {IEpubCfiIndirection} from './indirection/IEpubCfiIndirection';
import {IEpubCfiCharacterOffset} from './offset/IEpubCfiCharacterOffset';
import {EpubCfiOffsetRangeType, IEpubCfiOffsetRange} from './offset/IEpubCfiOffsetRange';
import {IEpubCfiSpatialOffset} from './offset/IEpubCfiSpatialOffset';
import {IEpubCfiTemporalOffset} from './offset/IEpubCfiTemporalOffset';

/**
 * The result of running the EpubCfiResolver against an EPUB CFI.
 */
export class EpubCfiResolvedTarget {

    /**
     * The EpubCFI AST that was used to resolve this instance
     */
    ast: IEpubCfiRootNode;
    /**
     * List of indirection errors that occured
     */
    indirectionErrors: IEpubCfiIndirection[] = [];
    /**
     * The parent path to the target.
     * If rangeStartPath and rangeEndPath are null, this path is the full path to the intended target if no range components were defined for the epubcfi.
     *
     * If the range components are non-null, this path is a common path for both rangeStartPath and rangeEndPath.
     * Note that it may not be the "deepest" common path for the range.
     */
    parentPath: EpubCfiResolvedPath | null = null;
    /**
     * If not null, it defines the end of a target range.
     */
    rangeEndPath: EpubCfiResolvedPath | null = null;
    /**
     * If not null, it defines the start of a target range.
     */
    rangeStartPath: EpubCfiResolvedPath | null = null;

    constructor(ast: IEpubCfiRootNode) {
        this.ast = ast;
    }

    /**
     * Creates a DOM Range from this instance.
     * The created Range will be collapsed if this instance does not have any range path components.
     *
     * If this instance has a range that start and end in different Documents, the range will be collapsed to range start.
     */
    createDomRange(): Range | null {
        if (this.isTargetingOpfDocument()) {
            return null;
        }

        let range: Range | null = null;

        // TODO: Note that this code only works when parsing down to first content document. It will fail if we add support for indirection into iframes

        if (this.rangeStartPath && this.rangeEndPath) {
            let startDocument = this.rangeStartPath.getDocument();
            range = startDocument.createRange();
            range.setStart(this.rangeStartPath.container, this.rangeStartPath.offset);

            if (this.rangeEndPath.getDocument() === startDocument) {
                range.setEnd(this.rangeEndPath.container, this.rangeEndPath.offset);
            }
        } else if (this.parentPath) {
            range = this.parentPath.getDocument().createRange();
            range.setStart(this.parentPath.container, this.parentPath.offset);
        }

        return range;
    }

    /**
     * Get the element character offsets if any exists.
     * The returned object will always have 'start' defined, indicating the start offset.
     */
    getElementCharacterOffsets(): IEpubCfiOffsetRange<IEpubCfiCharacterOffset> | null {
        return this.getOffsetRange<IEpubCfiCharacterOffset>('elementCharacterOffset', {characterOffset: 0});
    }

    /**
     * Get a list of all parser errors that were encountered.
     */
    getParserErrors(): IEpubCfiParserError[] {
        return this.ast.errors;
    }

    /**
     * Get a list of all resolver errors that were encountered.
     */
    getResolverErrors(): IEpubCfiResolverError[] {
        let errors: IEpubCfiResolverError[] = [];

        let allPaths = [this.parentPath, this.rangeStartPath, this.rangeEndPath];
        for (let i = 0; i < allPaths.length; i++) {
            let path = allPaths[i];
            if (path) {
                errors.push(...path.getResolverErrors());
            }
        }

        return errors;
    }

    getSideBias(): EpubCfiSideBias | null {
        if (this.parentPath && !this.rangeStartPath && !this.rangeEndPath) {
            return this.parentPath.sideBias;
        }
        return null;
    }

    /**
     * Get the spatial range if any is defined.
     */
    getSpatialOffsets(): IEpubCfiOffsetRange<IEpubCfiSpatialOffset> | null {
        return this.getOffsetRange<IEpubCfiSpatialOffset>('spatialOffset', {x: 0, y: 0});
    }

    /**
     * Returns the target element, if this instance is targeting a single element.
     * If this instance targets several elements in a range, null is returned.
     * If this instance is targeting a virtual element, null is returned.
     */
    getTargetElement(): Element | null {
        if (this.rangeStartPath && this.rangeEndPath) {
            let startElement = this.rangeStartPath.getTargetElement();
            return startElement !== null && startElement === this.rangeEndPath.getTargetElement() ? startElement : null;
        } else {
            return this.parentPath ? this.parentPath.getTargetElement() : null;
        }
    }

    /**
     * Get the temporal range if any is defined.
     */
    getTemporalOffsets(): IEpubCfiOffsetRange<IEpubCfiTemporalOffset> | null {
        return this.getOffsetRange<IEpubCfiTemporalOffset>('temporalOffset', {seconds: 0});
    }

    /**
     * If this instaIEpubCfiOffsetRangence has spatial, temporal or element character offsets.
     */
    hasElementOffsets(): boolean {
        return this.getSpatialOffsets() !== null || this.getTemporalOffsets() !== null || this.getElementCharacterOffsets() !== null;
    }

    /**
     * Returns true if any parse errors or resolver errors were encountered.
     * To detect all parse errors, ensure to run EpubCfiValidator on the AST.
     *
     * Resolver errors include:
     * - Targeting OPF element
     * - Parent path is null
     * - Exactly one of rangeStart or rangeEnd is null
     * - There were parser errors
     * - All steps and offsets were not parsed.
     * - All steps were not resolved.
     * - character offsets were out of bounds
     */
    hasErrors(): boolean {
        return !this.hasParentPathOrRangePaths() ||
            this.isTargetingOpfDocument() ||
            !this.isEveryIndirectionResolved() ||
            this.ast.errors.length > 0 ||
            !this.isEveryStepAndOffsetParsed() ||
            !this.isEveryStepResolved() ||
            this.isSomeCharacterOffsetOutOfBounds();
    }

    hasParentPathOrRangePaths(): boolean {
        return this.parentPath !== null &&
            (
                (this.rangeStartPath === null && this.rangeStartPath === null) ||
                (this.rangeStartPath !== null && this.rangeEndPath !== null)
            );

    }

    /**
     * If this instance has both rangeStart and rangeEnd defined.
     */
    hasRangePaths(): boolean {
        return this.rangeStartPath !== null && this.rangeEndPath !== null;
    }

    /**
     * Returns true if:
     * - an element with an ID did not have an XML ID assertion in the corresponding step.
     * - A step had the wrong step value and was "repaired" using an XML ID assertion.
     */
    hasWarnings(): boolean {
        return this.isMissingXmlIdAssertions() || this.isRepairedWithXmlIdAssertions();
    }

    /**
     * If this instance represents a DOM Range.
     * If this method returns false, createDomRange() will returned a collapsed Range instance.
     */
    isDomRange(): boolean {
        let rangeStartPath = this.rangeStartPath;
        let rangeEndPath = this.rangeEndPath;

        return !!rangeStartPath &&
            !!rangeEndPath &&
            !this.isTargetingOpfDocument() &&
            rangeStartPath.getDocument() === rangeEndPath.getDocument() &&
            (
                rangeStartPath.container !== rangeEndPath.container ||
                rangeStartPath.offset !== rangeEndPath.offset
            );
    }

    /**
     * Returns true if all indirections were resolved
     */
    isEveryIndirectionResolved(): boolean {
        return this.indirectionErrors.length === 0;
    }

    /**
     * Returns true if the parser parsed all path steps and offsets.
     */
    isEveryStepAndOffsetParsed(): boolean {
        return this.ast.parentPath !== null && this.ast.parentPath.complete &&
            (!this.ast.rangeStartPath || this.ast.rangeStartPath.complete) &&
            (!this.ast.rangeEndPath || this.ast.rangeEndPath.complete);
    }

    /**
     * Returns true if all steps and indirections were resolved.
     */
    isEveryStepResolved(): boolean {
        return this.parentPath !== null && this.parentPath.stepsResolved &&
            (!this.rangeStartPath || this.rangeStartPath.stepsResolved) &&
            (!this.rangeEndPath || this.rangeEndPath.stepsResolved);
    }

    /**
     * Returns true if an element id was found in a path but the epubcfi was missing the correct XML id assertion.
     */
    isMissingXmlIdAssertions(): boolean {
        return (this.parentPath !== null && this.parentPath.isMissingXmlIdAssertions()) ||
            (this.rangeStartPath !== null && this.rangeStartPath.isMissingXmlIdAssertions()) ||
            (this.rangeEndPath !== null && this.rangeEndPath.isMissingXmlIdAssertions());

    }

    /**
     * Always true for non-range instances. Only true for ranges if both start target node and end target node has the same ownerDocument.
     */
    isOwnedBySingleDocument(): boolean {
        if (this.rangeStartPath && this.rangeEndPath) {
            return this.rangeStartPath.getDocument() === this.rangeEndPath.getDocument();
        }
        return true;
    }

    /**
     * A path was repaired using an XML id assertion
     */
    isRepairedWithXmlIdAssertions(): boolean {
        return (this.parentPath !== null && this.parentPath.isRepairedWithXmlIdAssertions()) ||
            (this.rangeStartPath !== null && this.rangeStartPath.isRepairedWithXmlIdAssertions()) ||
            (this.rangeEndPath !== null && this.rangeEndPath.isRepairedWithXmlIdAssertions());
    }

    isSomeCharacterOffsetOutOfBounds(): boolean {
        return [
            this.parentPath,
            this.rangeStartPath,
            this.rangeEndPath,
        ].some(path => path !== null && path.characterOffsetOutOfBounds);
    }

    /**
     * If this instance is targeting a single element.
     */
    isTargetingElement(): boolean {
        return this.getTargetElement() !== null;
    }

    /**
     * If this instance is targeting the OPF document instead of a content document.
     * Will return true if no indirection took place at all (i.e. still inside the OPF document)
     *
     * If this method returns true, methods such as getTargetElement() and createDomRange() will return null.
     */
    isTargetingOpfDocument(): boolean {
        if (this.rangeStartPath && this.rangeEndPath) {
            return this.rangeStartPath.isTargetingOpfDocument() || this.rangeEndPath.isTargetingOpfDocument();
        } else {
            return this.parentPath !== null && this.parentPath.isTargetingOpfDocument();
        }
    }

    private getOffsetRange<T extends EpubCfiOffsetRangeType>(
        offsetProp: EpubCfiPathOffsetProperty,
        defaultStart: T,
    ): IEpubCfiOffsetRange<T> | null {
        let result: IEpubCfiOffsetRange<T> | null = null;
        let rangeStart = this.rangeStartPath;
        let rangeEnd = this.rangeEndPath;
        if (rangeStart && rangeEnd) {

            if (rangeEnd[offsetProp]) {
                result = {
                    start: rangeStart[offsetProp] as T || defaultStart,
                    end: rangeEnd[offsetProp] as T,
                };
            } else if (rangeStart[offsetProp]) {
                result = {
                    start: rangeStart[offsetProp] as T,
                    end: null,
                };
            }

        } else {
            let parentPath = this.parentPath;
            if (parentPath && parentPath[offsetProp]) {
                result = {
                    start: parentPath[offsetProp] as T,
                    end: null,
                };
            }
        }

        return result;
    }

}

export type EpubCfiPathOffsetProperty = 'spatialOffset' | 'temporalOffset' | 'elementCharacterOffset';
