import { EpubCfiBuilder } from './builder/EpubCfiBuilder';
import {IEpubCfiAssertionNode} from './model/assertion/IEpubCfiAssertionNode';
import {IEpubCfiAssertionParameterNode} from './model/assertion/IEpubCfiAssertionParameterNode';
import {IEpubCfiLocalPathNode} from './model/IEpubCfiLocalPathNode';
import {IEpubCfiPathNode} from './model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from './model/IEpubCfiRootNode';
import {IEpubCfiStepNode} from './model/IEpubCfiStepNode';
import {EpubCfiOffsetNode} from './model/offset/EpubCfiOffsetNode';
import {EpubCfiOffsetType} from './model/offset/EpubCfiOffsetType';
import {IEpubCfiCharacterOffsetNode} from './model/offset/IEpubCfiCharacterOffsetNode';
import {IEpubCfiSpatialOffsetNode} from './model/offset/IEpubCfiSpatialOffsetNode';
import {IEpubCfiTemporalOffsetNode} from './model/offset/IEpubCfiTemporalOffsetNode';

/**
 * Various utility methods for working with EPUB CFIs.
 */
export class EpubCfiUtils {
    static collapseToEnd(rootNode: IEpubCfiRootNode): IEpubCfiRootNode {
        const builder = new EpubCfiBuilder(EpubCfiUtils.copyRootNode(rootNode));
        builder.collapseToEnd();

        return builder.getEpubCfiRootNode();
    }

    static collapseToStart(rootNode: IEpubCfiRootNode): IEpubCfiRootNode {
        const builder = new EpubCfiBuilder(EpubCfiUtils.copyRootNode(rootNode));
        builder.collapseToStart();

        return builder.getEpubCfiRootNode();
    }

    static copyAssertionNode(assertionNode: IEpubCfiAssertionNode): IEpubCfiAssertionNode {
        return {
            parameters: assertionNode.parameters.map(parameter => EpubCfiUtils.copyAssertionParameterNode(parameter)),
            srcOffset: assertionNode.srcOffset,
            values: assertionNode.values.slice(),
        };
    }

    static copyLocalPathNode(localPathNode: IEpubCfiLocalPathNode): IEpubCfiLocalPathNode {
        return {
            indirection: localPathNode.indirection,
            srcOffset: localPathNode.srcOffset,
            steps: localPathNode.steps.map(step => EpubCfiUtils.copyStepNode(step)),
        };
    }

    static copyOffsetNode(offsetNode: EpubCfiOffsetNode): EpubCfiOffsetNode {
        switch (offsetNode.type) {
            case EpubCfiOffsetType.CHARACTER:
                return EpubCfiUtils.copyCharacterOffsetNode(offsetNode);

            case EpubCfiOffsetType.SPATIAL:
                return EpubCfiUtils.copySpatialOffsetNode(offsetNode);

            case EpubCfiOffsetType.TEMPORAL:
                return EpubCfiUtils.copyTemporalOffsetNode(offsetNode);
        }
    }

    static copyPathNode(pathNode: IEpubCfiPathNode): IEpubCfiPathNode {
        return {
            complete: pathNode.complete,
            localPaths: pathNode.localPaths.map(localPath => EpubCfiUtils.copyLocalPathNode(localPath)),
            offset: pathNode.offset ? EpubCfiUtils.copyOffsetNode(pathNode.offset) : null,
            srcOffset: pathNode.srcOffset,
        };
    }

    static copyRootNode(rootNode: IEpubCfiRootNode): IEpubCfiRootNode {
        return {
            errors: [],
            parentPath: rootNode.parentPath ? EpubCfiUtils.copyPathNode(rootNode.parentPath) : null,
            rangeEndPath: rootNode.rangeEndPath ? EpubCfiUtils.copyPathNode(rootNode.rangeEndPath) : null,
            rangeStartPath: rootNode.rangeStartPath ? EpubCfiUtils.copyPathNode(rootNode.rangeStartPath) : null,
            src: rootNode.src,
            srcModified: rootNode.srcModified,
            srcOffset: rootNode.srcOffset,
        };
    }

    static copyStepNode(stepNode: IEpubCfiStepNode): IEpubCfiStepNode {
        return {
            assertion: stepNode.assertion ? EpubCfiUtils.copyAssertionNode(stepNode.assertion) : null,
            srcOffset: stepNode.srcOffset,
            stepValue: stepNode.stepValue,
        };
    }

    static createEmptyLocalPathNode(): IEpubCfiLocalPathNode {
        return {
            indirection: false,
            steps: [],
        };
    }

    static createEmptyPathNode(): IEpubCfiPathNode {
        return {
            complete: false,
            localPaths: [],
            offset: null,
        };
    }

    static createEmptyRootNode(): IEpubCfiRootNode {
        return {
            errors: [],
            parentPath: null,
            rangeEndPath: null,
            rangeStartPath: null,
            src: '',
            srcModified: false,
        };
    }

    static createRangeSelector(
        startRootNode: IEpubCfiRootNode,
        endRootNode: IEpubCfiRootNode,
    ): IEpubCfiRootNode | null {
        let startPath = startRootNode.parentPath;
        if (startRootNode.rangeStartPath) {
            const builder = new EpubCfiBuilder(EpubCfiUtils.copyRootNode(startRootNode));
            builder.collapseToStart();
            startPath = builder.getEpubCfiRootNode().parentPath;
        }

        let endPath = endRootNode.parentPath;
        if (endRootNode.rangeEndPath) {
            const builder = new EpubCfiBuilder(EpubCfiUtils.copyRootNode(endRootNode));
            builder.collapseToEnd();
            endPath = builder.getEpubCfiRootNode().parentPath;
        }

        if (!endPath || !startPath) {
            return null;
        }

        const rangeRootNode = EpubCfiUtils.createEmptyRootNode();
        const rangeParentPath = EpubCfiUtils.createEmptyPathNode();
        const rangeStartPath = EpubCfiUtils.createEmptyPathNode();
        const rangeEndPath = EpubCfiUtils.createEmptyPathNode();

        // Iterate over local paths, find first local path where steps differ
        const minLocalPathLength = Math.min(startPath.localPaths.length, endPath.localPaths.length);
        let diffFound = false;
        let pathIndex = 0;
        while (!diffFound && pathIndex < minLocalPathLength) {
            const localPathStart = startPath.localPaths[pathIndex];
            const localPathEnd = endPath.localPaths[pathIndex];

            if (localPathStart.indirection !== localPathEnd.indirection) {
                diffFound = true;
            } else {

                const stepsStart = localPathStart.steps;
                const stepsEnd = localPathEnd.steps;
                const minStepLength = Math.min(stepsStart.length, stepsEnd.length);

                let stepIndex = 0;
                while (!diffFound && stepIndex < minStepLength) {
                    if (EpubCfiUtils.areStepsEqual(stepsStart[stepIndex], stepsEnd[stepIndex])) {
                        stepIndex++;
                    } else {
                        diffFound = true;
                    }
                }

                // stepIndex now points to the first step index that differs.
                if (stepsStart.length !== stepsEnd.length) {
                    diffFound = true;
                }

                if (diffFound) {
                    if (stepIndex > 0) {
                        // Local paths have some steps in common
                        const rangeParentLocalPath = EpubCfiUtils.createEmptyLocalPathNode();
                        rangeParentLocalPath.indirection = localPathStart.indirection;
                        for (let i = 0; i < stepIndex; i++) {
                            rangeParentLocalPath.steps.push(EpubCfiUtils.copyStepNode(stepsStart[i]));
                        }
                        rangeParentPath.localPaths.push(rangeParentLocalPath);

                        // Now handle rangeStart and rangeEnd. These can never have indirection when splitting.
                        if (stepIndex < stepsStart.length) {
                            const rangeStartLocalPath = EpubCfiUtils.createEmptyLocalPathNode();
                            for (let i = stepIndex; i < stepsStart.length; i++) {
                                rangeStartLocalPath.steps.push(EpubCfiUtils.copyStepNode(stepsStart[i]));
                            }
                            rangeStartPath.localPaths.push(rangeStartLocalPath);
                        }
                        if (stepIndex < stepsEnd.length) {
                            const rangeEndLocalPath = EpubCfiUtils.createEmptyLocalPathNode();
                            for (let i = stepIndex; i < stepsEnd.length; i++) {
                                rangeEndLocalPath.steps.push(EpubCfiUtils.copyStepNode(stepsEnd[i]));
                            }
                            rangeEndPath.localPaths.push(rangeEndLocalPath);
                        }

                        // As we now split the local path between parent and range components we need to increment pathIndex
                        pathIndex++;
                    }

                } else {
                    // local paths are exactly equal so we can copy it to rangeParent!
                    rangeParentPath.localPaths.push(EpubCfiUtils.copyLocalPathNode(localPathStart));
                    pathIndex++;
                }
            }
        }

        // Path index is now the first localPath index from where they completely differ and should go into their respective range component
        // We also have all common local paths already in rangeParentPath.
        if (startPath.localPaths.length !== endPath.localPaths.length) {
            diffFound = true;
        }

        if (diffFound) {
            for (let i = pathIndex; i < startPath.localPaths.length; i++) {
                rangeStartPath.localPaths.push(EpubCfiUtils.copyLocalPathNode(startPath.localPaths[i]));
            }
            for (let i = pathIndex; i < endPath.localPaths.length; i++) {
                rangeEndPath.localPaths.push(EpubCfiUtils.copyLocalPathNode(endPath.localPaths[i]));
            }
            if (startPath.offset) {
                rangeStartPath.offset = EpubCfiUtils.copyOffsetNode(startPath.offset);
            }
            if (endPath.offset) {
                rangeEndPath.offset = EpubCfiUtils.copyOffsetNode(endPath.offset);
            }
        } else {
            // If no diff is found we need to see if we should at least split up the offset node.
            const offsetStart = startPath.offset;
            const offsetEnd = endPath.offset;

            if ((offsetStart && !offsetEnd) || (!offsetStart && offsetEnd) || (offsetStart && offsetEnd && !EpubCfiUtils.areOffsetsEqual(offsetStart, offsetEnd))) {
                rangeStartPath.offset = offsetStart ? EpubCfiUtils.copyOffsetNode(offsetStart) : null;
                rangeEndPath.offset = offsetEnd ? EpubCfiUtils.copyOffsetNode(offsetEnd) : null;
                diffFound = true;
            } else {
                rangeParentPath.offset = offsetStart ? EpubCfiUtils.copyOffsetNode(offsetStart) : null;
            }
        }

        rangeRootNode.parentPath = rangeParentPath;
        if (diffFound) {
            rangeRootNode.rangeStartPath = rangeStartPath;
            rangeRootNode.rangeEndPath = rangeEndPath;
        }

        return rangeRootNode;
    }

    /**
     * Returns true if the value in the step node is an even number, i.e. targets an Element.
     */
    static isElementStepNode(node: IEpubCfiStepNode): boolean {
        return node.stepValue % 2 === 0;
    }

    static isTextStepNode(node: IEpubCfiStepNode): boolean {
        return node.stepValue % 2 === 1;
    }

    private static areAssertionsEqual(assertion1: IEpubCfiAssertionNode, assertion2: IEpubCfiAssertionNode): boolean {
        if (assertion1.values.length !== assertion2.values.length) {
            return false;
        }
        if (assertion1.parameters.length !== assertion2.parameters.length) {
            return false;
        }

        if (assertion1.values.some((value, index) => assertion2.values[index] !== value)) {
            return false;
        }

        return assertion1.parameters.every((param1, index) => {
            const param2 = assertion2.parameters[index];
            return param1.name === param2.name && param1.values.length === param2.values.length && param1.values.every((
                value,
                valIndex,
            ) => {
                return value === param2.values[valIndex];
            });
        });
    }

    private static areOffsetsEqual(o1: EpubCfiOffsetNode, o2: EpubCfiOffsetNode): boolean {
        if (o1.type === EpubCfiOffsetType.CHARACTER && o2.type === EpubCfiOffsetType.CHARACTER) {
            if (o1.characterOffset !== o2.characterOffset) {
                return false;
            }
        } else if (o1.type === EpubCfiOffsetType.SPATIAL && o2.type === EpubCfiOffsetType.SPATIAL) {
            if (o1.x !== o2.x || o1.y !== o2.y) {
                return false;
            }
        } else if (o1.type === EpubCfiOffsetType.TEMPORAL && o2.type === EpubCfiOffsetType.TEMPORAL) {
            if (o1.seconds !== o2.seconds || o1.x !== o2.x || o1.y !== o2.y) {
                return false;
            }
        } else {
            return false;
        }

        const assertion1 = o1.assertion;
        const assertion2 = o2.assertion;
        return assertion1 && assertion2 ?
            EpubCfiUtils.areAssertionsEqual(assertion1, assertion2) :
            assertion1 === assertion2;
    }

    private static areStepsEqual(step1: IEpubCfiStepNode, step2: IEpubCfiStepNode): boolean {
        if (step1.stepValue !== step2.stepValue) {
            return false;
        }
        const assertion1 = step1.assertion;
        const assertion2 = step2.assertion;

        return assertion1 && assertion2 ?
            EpubCfiUtils.areAssertionsEqual(assertion1, assertion2) :
            assertion1 === assertion2;
    }

    private static copyAssertionParameterNode(parameterNode: IEpubCfiAssertionParameterNode): IEpubCfiAssertionParameterNode {
        return {
            name: parameterNode.name,
            srcOffset: parameterNode.srcOffset,
            values: parameterNode.values.slice(),
        };
    }

    private static copyCharacterOffsetNode(offsetNode: IEpubCfiCharacterOffsetNode): IEpubCfiCharacterOffsetNode {
        return {
            assertion: offsetNode.assertion ? EpubCfiUtils.copyAssertionNode(offsetNode.assertion) : null,
            characterOffset: offsetNode.characterOffset,
            srcOffset: offsetNode.srcOffset,
            type: offsetNode.type,
        };
    }

    private static copySpatialOffsetNode(offsetNode: IEpubCfiSpatialOffsetNode): IEpubCfiSpatialOffsetNode {
        return {
            assertion: offsetNode.assertion ? EpubCfiUtils.copyAssertionNode(offsetNode.assertion) : null,
            srcOffset: offsetNode.srcOffset,
            type: offsetNode.type,
            x: offsetNode.x,
            y: offsetNode.y,
        };
    }

    private static copyTemporalOffsetNode(offsetNode: IEpubCfiTemporalOffsetNode): IEpubCfiTemporalOffsetNode {
        return {
            assertion: offsetNode.assertion ? EpubCfiUtils.copyAssertionNode(offsetNode.assertion) : null,
            seconds: offsetNode.seconds,
            srcOffset: offsetNode.srcOffset,
            type: offsetNode.type,
            x: offsetNode.x,
            y: offsetNode.y,
        };
    }

}
