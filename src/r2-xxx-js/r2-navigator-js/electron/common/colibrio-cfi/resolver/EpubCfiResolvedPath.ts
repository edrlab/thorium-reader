import {ArrayUtils} from '../common/ArrayUtils';
import {isDocument} from '../common/Utils';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {EpubCfiIntendedTargetType} from './EpubCfiIntendedTargetType';
import {EpubCfiResolvedLocalPath} from './EpubCfiResolvedLocalPath';
import {EpubCfiSideBias} from './EpubCfiSideBias';
import {EpubCfiVirtualTarget} from './EpubCfiVirtualTarget';
import {IEpubCfiResolverError} from './IEpubCfiResolverError';
import {IEpubCfiSpatialOffset} from './offset/IEpubCfiSpatialOffset';
import {IEpubCfiTemporalOffset} from './offset/IEpubCfiTemporalOffset';

export class EpubCfiResolvedPath {

    /**
     * The AST used to resolve this path.
     */
    ast: IEpubCfiPathNode;
    characterOffsetOutOfBounds: boolean = false;
    /**
     * The container node for the "target", where "target" can be a node in the DOM tree or a character offset.
     * The container can be a Element, Text, Document or DocumentFragment node.
     */
    container!: Node;
    /**
     * The file path to the document
     */
    documentUrl!: URL;
    /**
     * Set if intended target type is 'element' and there was a character offset defined.
     * Used for referencing the "alt" text in <img> elements.
     */
    elementCharacterOffset: number | null = null;
    /**
     * If all indirections were resolved successfully.
     */
    indirectionsResolved: boolean = true;
    /**
     * If the epubcfi intended to target a characters or an element.
     * This depends if the terminal step in this path was odd or even.
     */
    intendedTargetType!: EpubCfiIntendedTargetType;
    /**
     * All local paths that were resolved in this path.
     */
    localPaths: EpubCfiResolvedLocalPath[];
    /**
     * The childNode offset into container
     */
    offset!: number;
    /**
     * Will be set if the terminal step of the path contained the assertion parameter 's' with a valid value.
     *
     * See http://www.idpf.org/epub/linking/cfi/epub-cfi.html#sec-path-side-bias
     */
    sideBias: EpubCfiSideBias | null = null;
    /**
     * The spatial offset if any.
     */
    spatialOffset: IEpubCfiSpatialOffset | null = null;
    /**
     * If steps were resolved, i.e. the steps pointed to existing or virtual nodes, or were recovered using assertions.
     * Will be false if any indirection failed to resolve.
     */
    stepsResolved: boolean = true;
    /**
     * The temporal offset if any,
     */
    temporalOffset: IEpubCfiTemporalOffset | null = null;
    /**
     * If this path uses a virtual target, targeting  'firstChild' or the 'lastChild'.
     * This will be set if the epubcfi ends with a step of 0 or N+2 where N is the last valid element step.
     * If a step was larger than N+2, virtualTarget will be set to 'lastChild' and stepsResolved to false.
     */
    virtualTarget!: EpubCfiVirtualTarget | null;

    constructor(ast: IEpubCfiPathNode, localPath: EpubCfiResolvedLocalPath) {
        this.ast = ast;
        this.localPaths = [];
        this.addResolvedLocalPath(localPath);
    }

    addResolvedLocalPath(localPath: EpubCfiResolvedLocalPath): void {
        this.localPaths.push(localPath);

        this.stepsResolved = localPath.stepsResolved;
        this.container = localPath.container;
        this.documentUrl = localPath.documentUrl;
        this.intendedTargetType = localPath.intendedTargetType;
        this.offset = localPath.offset;
        this.virtualTarget = localPath.virtualTarget;
    }

    getDocument(): Document {
        return isDocument(this.container) ? this.container : this.container.ownerDocument!;
    }

    getResolverErrors(): IEpubCfiResolverError[] {
        let errors: IEpubCfiResolverError[] = [];
        for (let i = 0; i < this.localPaths.length; i++) {
            let localPath = this.localPaths[i];
            if (localPath.resolverErrors.length > 0) {
                errors.push(...localPath.resolverErrors);
            }
        }
        return errors;
    }

    /**
     * Get the target Element, if the intended target was en element and it is not the virtual first or virtual last element.
     */
    getTargetElement(): Element | null {
        return ArrayUtils.last(this.localPaths)!.getTargetElement();
    }

    /**
     * Get the target node for this local path, unless the target is a virtual Target in which case the container is returned instead.
     */
    getTargetNode(): Node | null {
        return ArrayUtils.last(this.localPaths)!.getTargetNode();
    }

    getTerminalLocalPath(): EpubCfiResolvedLocalPath {
        return ArrayUtils.last(this.localPaths)!;
    }

    isMissingXmlIdAssertions(): boolean {
        return this.localPaths.some(localPath => localPath.missingXmlIdAssertions);
    }

    isRepairedWithXmlIdAssertions(): boolean {
        return this.localPaths.some(localPath => localPath.repairedWithXmlIdAssertions);
    }

    isTargetingOpfDocument(): boolean {
        return ArrayUtils.last(this.localPaths)!.isOpfDocument;
    }

}
