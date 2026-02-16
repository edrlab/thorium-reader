import {DomUtils} from '../common/DomUtils';
import {isElement, isTextNode} from '../common/Utils';
import {EpubCfiError} from '../EpubCfiError';
import {EpubCfiErrorType} from '../EpubCfiErrorType';
import {EpubCfiUtils} from '../EpubCfiUtils';
import {IEpubCfiAssertionNode} from '../model/assertion/IEpubCfiAssertionNode';
import {IEpubCfiLocalPathNode} from '../model/IEpubCfiLocalPathNode';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {IEpubCfiStepNode} from '../model/IEpubCfiStepNode';
import {EpubCfiOffsetType} from '../model/offset/EpubCfiOffsetType';
import {IEpubCfiCharacterOffsetNode} from '../model/offset/IEpubCfiCharacterOffsetNode';

/**
 * This is a helper class intended to be used internally.
 */
export class EpubCfiBuilderHelper {

    static appendTerminalDomRange(range: Range, rootNode?: IEpubCfiRootNode): IEpubCfiRootNode {
        if (!rootNode) {
            rootNode = EpubCfiUtils.createEmptyRootNode();
        }

        if (range.collapsed) {
            if (!rootNode.parentPath) {
                rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
            }
            EpubCfiBuilderHelper.appendTerminalLocalPath(range.startContainer, range.startOffset, rootNode.parentPath);
            return rootNode;
        }

        if (!rootNode.parentPath) {
            rootNode.parentPath = EpubCfiUtils.createEmptyPathNode();
        }
        if (rootNode.rangeStartPath || rootNode.rangeEndPath) {
            throw new EpubCfiError(EpubCfiErrorType.RANGE_PATHS_ALREADY_SET);
        }
        rootNode.rangeStartPath = EpubCfiUtils.createEmptyPathNode();
        rootNode.rangeEndPath = EpubCfiUtils.createEmptyPathNode();

        EpubCfiBuilderHelper.appendTerminalLocalPath(range.startContainer, range.startOffset, rootNode.rangeStartPath, range.commonAncestorContainer);
        EpubCfiBuilderHelper.appendTerminalLocalPath(range.endContainer, range.endOffset, rootNode.rangeEndPath, range.commonAncestorContainer);

        let hasLocalPaths = rootNode.parentPath.localPaths.length > 0;
        if (isElement(range.commonAncestorContainer)) {
            rootNode.parentPath.localPaths.push(EpubCfiBuilderHelper.buildLocalPathToElement(range.commonAncestorContainer, hasLocalPaths));
        } else if (isElement(range.commonAncestorContainer.parentNode)) {
            let localPath = EpubCfiBuilderHelper.buildLocalPathToElement(range.commonAncestorContainer.parentNode, hasLocalPaths);
            localPath.steps.push(EpubCfiBuilderHelper.buildTextStep(range.commonAncestorContainer));
            rootNode.parentPath.localPaths.push(localPath);
        } else {
            throw new EpubCfiError(EpubCfiErrorType.CONTAINER_NOT_ATTACHED_TO_DOCUMENT);
        }

        return rootNode;
    }

    static appendTerminalLocalPath(
        container: Node,
        offset: number,
        pathNode?: IEpubCfiPathNode,
        stopNode?: Node,
    ): IEpubCfiPathNode {
        let steps: IEpubCfiStepNode[] | null = null;
        let offsetNode: IEpubCfiCharacterOffsetNode | null = null;
        if (isElement(container)) {
            let targetNode: Node | null = offset < container.childNodes.length ? container.childNodes[offset] : null;
            if (isElement(targetNode)) {
                steps = EpubCfiBuilderHelper.buildStepsToElement(targetNode, stopNode);
            } else if (!targetNode) {
                steps = EpubCfiBuilderHelper.buildStepsToElement(container, stopNode);
                // It's a virtual target!
                steps.push({
                    assertion: null,
                    stepValue: offset === 0 ? 0 : container.childElementCount * 2 + 2,
                });
            } else {
                steps = EpubCfiBuilderHelper.buildStepsToElement(container, stopNode);
                steps.push(EpubCfiBuilderHelper.buildTextStep(targetNode));
                offsetNode = EpubCfiBuilderHelper.buildCharacterOffsetToNode(targetNode);
            }
        } else if (isElement(container.parentNode)) {
            if (container === stopNode) {
                steps = null;
            } else {
                steps = EpubCfiBuilderHelper.buildStepsToElement(container.parentNode, stopNode);
                steps.push(EpubCfiBuilderHelper.buildTextStep(container));
            }
            offsetNode = EpubCfiBuilderHelper.buildCharacterOffsetToNode(container);
            if (offsetNode && isTextNode(container)) {
                offsetNode.characterOffset += offset;
            }
        } else {
            throw new EpubCfiError(EpubCfiErrorType.CONTAINER_NOT_ATTACHED_TO_DOCUMENT);
        }

        if (!pathNode) {
            pathNode = EpubCfiUtils.createEmptyPathNode();
        }

        if (steps) {

            let hasLocalPathNodes = pathNode.localPaths.length > 0;
            let localPath: IEpubCfiLocalPathNode = {
                indirection: hasLocalPathNodes,
                steps: steps,
            };
            pathNode.localPaths.push(localPath);
        }

        pathNode.offset = offsetNode;

        return pathNode;
    }

    static buildCharacterOffsetToNode(node: Node): IEpubCfiCharacterOffsetNode | null {
        if (isElement(node)) {
            return null;
        }
        let currentNode: Node | null = node.previousSibling;
        let offset = 0;

        while (currentNode && !isElement(currentNode)) {
            if (isTextNode(currentNode)) {
                offset += currentNode.data.length;
            }
            currentNode = currentNode.previousSibling;
        }

        // TODO: Build text location assertion

        return {
            type: EpubCfiOffsetType.CHARACTER,
            assertion: null,
            characterOffset: offset,
        };
    }

    static buildLocalPathToElement(element: Element, indirection: boolean): IEpubCfiLocalPathNode {
        return {
            indirection: indirection,
            steps: EpubCfiBuilderHelper.buildStepsToElement(element),
        };
    }

    static buildStepsToElement(element: Element, rootNode?: Node): IEpubCfiStepNode[] {
        let elements: Element[] = [];
        let stepNodes: IEpubCfiStepNode[] = [];
        while (element.parentNode && isElement(element.parentNode) && element !== rootNode) {
            elements.push(element);
            element = element.parentNode;
        }

        for (let i = elements.length - 1; i >= 0; i--) {
            let element = elements[i];
            let xmlIdAssertion: IEpubCfiAssertionNode | null = null;
            if (element.id) {
                xmlIdAssertion = {
                    values: [element.id],
                    parameters: [],
                };
            }

            stepNodes.push({
                stepValue: (DomUtils.getElementIndex(element) + 1) * 2,
                assertion: xmlIdAssertion,
            });
        }
        return stepNodes;
    }

    static buildTextStep(node: Node): IEpubCfiStepNode {
        let previousSibling = node.previousSibling;
        while (previousSibling && !isElement(previousSibling)) {
            previousSibling = previousSibling.previousSibling;
        }

        let index: number;
        if (previousSibling) {
            index = DomUtils.getElementIndex(previousSibling as Element) * 2 + 3;
        } else {
            index = 1;
        }
        return {
            stepValue: index,
            assertion: null,
        };
    }

}
