import {EpubCfiError} from '../EpubCfiError';
import {EpubCfiErrorType} from '../EpubCfiErrorType';
import {EpubCfiUtils} from '../EpubCfiUtils';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {EpubCfiStringifier} from '../stringifier/EpubCfiStringifier';
import {EpubCfiBuilderHelper} from './EpubCfiBuilderHelper';
import {copy} from "../common/Utils";
import {ArrayUtils} from "../common/ArrayUtils";

/**
 * Used for programmatically building EPUB CFI model objects from XML-based documents.
 */
export class EpubCfiBuilder {

    private _rootNode: IEpubCfiRootNode;

    /**
     * Creates a new EpubCfiBuilder instance.
     * @param rootNode - An existing IEpubCfiRootNode to use. If omitted, a new empty root node is created.
     */
    constructor(rootNode?: IEpubCfiRootNode) {
        if (rootNode) {
            this._rootNode = rootNode;
        } else {
            this._rootNode = EpubCfiUtils.createEmptyRootNode();
        }
    }

    /**
     * Creates a new IEpubCfiLocalPathNode with all steps necessary to select the specified element from its owner document.
     */
    appendLocalPathTo(element: Element): void {
        if (this._rootNode.rangeStartPath || this._rootNode.rangeEndPath) {
            throw new EpubCfiError(EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }

        let steps = EpubCfiBuilderHelper.buildStepsToElement(element);
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
        }

        let hasLocalPath = this._rootNode.parentPath.localPaths.length > 0;
        this._rootNode.parentPath.localPaths.push({
            steps: steps,
            indirection: hasLocalPath,
        });
    }

    /**
     * Appends a terminal local path to the specified container node and offset.
     * If the container node is an Element, the offset specifies the child node within that element.
     * If the container node is a Text node, the offset specified the character offset.
     */
    appendTerminalDomPosition(container: Node, offset: number): void {
        offset = Math.round(offset);
        if (this._rootNode.rangeStartPath || this._rootNode.rangeEndPath) {
            throw new EpubCfiError(EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
        }

        EpubCfiBuilderHelper.appendTerminalLocalPath(container, offset, this._rootNode.parentPath);
    }

    /**
     * Appends a terminal range to the EPUB CFI model.
     */
    appendTerminalDomRange(range: Range): void {
        EpubCfiBuilderHelper.appendTerminalDomRange(range, this._rootNode);
    }

    appendTerminalIndirection(): void {
        if (this._rootNode.rangeStartPath || this._rootNode.rangeEndPath) {
            throw new EpubCfiError(EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
        }

        this._rootNode.parentPath.localPaths.push({
            indirection: true,
            steps: [
                {
                    assertion: null,
                    stepValue: 0,
                },
            ],
        });
    }

    /**
     * Creates a clone of this instance including all state.
     */
    clone(): EpubCfiBuilder {
        return new EpubCfiBuilder(copy(this._rootNode));
    }

    /**
     * Collapses the range epubcfi to its end position.
     * If the epubcfi does not define a range, nothing is done.
     */
    collapseToEnd(): void {
        if (this._rootNode.rangeEndPath) {
            this.collapse(this._rootNode.rangeEndPath);
        }
    }

    /**
     * Collapses the range epubcfi to its start position.
     * If the epubcfi does not define a range, nothing is done.
     */
    collapseToStart(): void {
        if (this._rootNode.rangeStartPath) {
            this.collapse(this._rootNode.rangeStartPath);
        }
    }

    /**
     * Get the IEpubCfiRootNode containing all paths and steps appended with this builder.
     */
    getEpubCfiRootNode(): IEpubCfiRootNode {
        return this._rootNode;
    }

    prependLocalPathTo(element: Element): void {
        let steps = EpubCfiBuilderHelper.buildStepsToElement(element);
        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
        }
        let firstLocalPath = this._rootNode.parentPath.localPaths[0];
        if (firstLocalPath) {
            firstLocalPath.indirection = true;
        }
        this._rootNode.parentPath.localPaths.unshift({
            steps: steps,
            indirection: false,
        });
    }

    /**
     * Serializes the current state of the EPUB CFI model as a selector fragment string.
     */
    toString(): string {
        return EpubCfiStringifier.stringifyRootNode(this._rootNode);
    }

    private collapse(rangePath: IEpubCfiPathNode): void {
        this._rootNode.rangeStartPath = null;
        this._rootNode.rangeEndPath = null;

        if (!this._rootNode.parentPath) {
            this._rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
        }
        const parentPath = this._rootNode.parentPath;

        if (parentPath.localPaths) {
            // Need to merge paths!
            const firstRangeLocalPath = ArrayUtils.first(rangePath.localPaths);
            const lastParentLocalPath = ArrayUtils.last(parentPath.localPaths);
            if (firstRangeLocalPath) {
                if (lastParentLocalPath && !firstRangeLocalPath.indirection) {
                    // Local paths should be merged
                    lastParentLocalPath.steps.push(...firstRangeLocalPath.steps);
                    rangePath.localPaths.shift();
                }

                parentPath.localPaths.push(...rangePath.localPaths);
            }

        } else {
            // No parent local paths
            parentPath.localPaths = rangePath.localPaths;
        }

        parentPath.offset = rangePath.offset;
    }
}
