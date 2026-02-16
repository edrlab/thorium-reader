import {ArrayUtils} from '../common/ArrayUtils';
import {EpubCfiUtils} from '../EpubCfiUtils';
import {IEpubCfiPathNode} from '../model/IEpubCfiPathNode';
import {IEpubCfiRootNode} from '../model/IEpubCfiRootNode';
import {IEpubCfiStepNode} from '../model/IEpubCfiStepNode';
import {EpubCfiOffsetType} from '../model/offset/EpubCfiOffsetType';
import {EpubCfiParserErrorHelper} from '../parser/EpubCfiParserErrorHelper';
import {EpubCfiParserErrorType} from '../parser/EpubCfiParserErrorType';

/**
 * Contains various validation and correction methods to repair broken EPUB CFIs.
 */
export class EpubCfiValidator {

    /**
     * Adds explicit character offsets to paths that end with a TextStep
     *
     * @return true if AST was modified, false otherwise
     */
    static addExplicitCharacterOffsets(rootNode: IEpubCfiRootNode): boolean {
        let astModified = false;
        if (rootNode.parentPath) {
            addCharacterOffset(rootNode.parentPath);
        }
        if (rootNode.rangeStartPath) {
            addCharacterOffset(rootNode.rangeStartPath);
        }
        if (rootNode.rangeEndPath) {
            addCharacterOffset(rootNode.rangeEndPath);
        }

        function addCharacterOffset(path: IEpubCfiPathNode): void {
            const lastLocalPath = ArrayUtils.last(path.localPaths);
            if (lastLocalPath) {
                const lastStep = ArrayUtils.last(lastLocalPath.steps);
                if (lastStep && EpubCfiUtils.isTextStepNode(lastStep) && !path.offset) {
                    path.offset = {
                        type: EpubCfiOffsetType.CHARACTER,
                        characterOffset: 0,
                        assertion: null,
                    };
                    astModified = true;
                }
            }
        }

        return astModified;
    }

    /**
     * Check that parentPath is not missing or empty.
     * Checks that rangeEnd is set if rangeStart is set.
     *
     * @return true if AST was modified, false otherwise
     */
    static checkEmptyParentPathAndRangeEnd(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;
        if (!rootNode.parentPath || rootNode.parentPath.localPaths.length === 0 || rootNode.parentPath.localPaths[0].steps.length === 0) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.PATH_EMPTY, rootNode.srcOffset));
            }
            astModified = true;
            rootNode.parentPath = null;
            rootNode.rangeStartPath = null;
            rootNode.rangeEndPath = null;
        } else if (rootNode.rangeStartPath && !rootNode.rangeEndPath) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.MISSING_END_RANGE));
            }
            astModified = true;
            rootNode.rangeStartPath = null;
        } else if (rootNode.rangeEndPath && (rootNode.rangeEndPath.localPaths.length === 0 || (rootNode.rangeEndPath.localPaths[0].steps.length === 0 && rootNode.rangeEndPath.offset === null))) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.PATH_EMPTY, rootNode.rangeEndPath.srcOffset));
            }
            astModified = true;
            rootNode.rangeStartPath = null;
            rootNode.rangeEndPath = null;
        }

        return astModified;
    }

    /**
     * EpubCFI spec does not allow paths ending with !, like: epubcfi(/6/4!) and epubcfi(/6/4!/4/2!,/0,/6)
     * Fix those by converting it to: epubcfi(/6/4!/0) and epubcfi(/6/4!/4/2,!/0,!/6)
     *
     * This method does not touch indirections that is immediately followed by an offset.
     * @return true if AST was modified, false otherwise
     */
    static expandEmptyIndirectionLocalPaths(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;
        if (rootNode.parentPath && !rootNode.parentPath.offset) {
            const lastLocalPath = ArrayUtils.last(rootNode.parentPath.localPaths);
            if (lastLocalPath && lastLocalPath.indirection && lastLocalPath.steps.length === 0) {

                if (!skipErrorReporting) {
                    rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.PATH_ENDS_WITH_INDIRECTION, lastLocalPath.srcOffset));
                }
                astModified = true;
                if (rootNode.rangeStartPath && rootNode.rangeEndPath) {
                    addIndirectionToPathStart(rootNode.rangeStartPath);
                    addIndirectionToPathStart(rootNode.rangeEndPath);
                    rootNode.parentPath.localPaths.length--;
                } else {
                    lastLocalPath.steps.push({
                        stepValue: 0,
                        assertion: null,
                    });
                    rootNode.rangeStartPath = null;
                    rootNode.rangeEndPath = null;
                }
            }
        }

        function checkRangePath(rangePath: IEpubCfiPathNode): void {
            if (!rangePath.offset) {
                const lastLocalPath = ArrayUtils.last(rangePath.localPaths);
                if (lastLocalPath && lastLocalPath.indirection && lastLocalPath.steps.length === 0) {
                    if (!skipErrorReporting) {
                        rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.PATH_ENDS_WITH_INDIRECTION, lastLocalPath.srcOffset));
                    }
                    astModified = true;
                    lastLocalPath.steps.push({
                        stepValue: 0,
                        assertion: null,
                    });
                }
            }
        }

        if (rootNode.rangeStartPath) {
            checkRangePath(rootNode.rangeStartPath);
        }
        if (rootNode.rangeEndPath) {
            checkRangePath(rootNode.rangeEndPath);
        }

        return astModified;
    }

    /**
     * EpubCFI grammar allows for indirections before offsets but does not really specify what it should be used for.
     * Remove indirections from those offsets
     *
     * @return true if AST was modified, false otherwise
     */
    static removeEmptyIndirectionBeforeOffsets(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {

        let astModified = false;
        if (rootNode.parentPath) {
            astModified = removeEmptyIndirectionBeforeOffsets(rootNode, rootNode.parentPath, skipErrorReporting);
        }
        if (rootNode.rangeStartPath) {
            astModified = removeEmptyIndirectionBeforeOffsets(rootNode, rootNode.rangeStartPath, skipErrorReporting) || astModified;
        }
        if (rootNode.rangeEndPath) {
            astModified = removeEmptyIndirectionBeforeOffsets(rootNode, rootNode.rangeEndPath, skipErrorReporting) || astModified;
        }

        return astModified;
    }

    /**
     * Removes rangeStart and rangeEnd offsets if their type is incompatible
     *
     * @return true if AST was modified, false otherwise
     */
    static removeIncompatibleRangeOffsets(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;

        let startOffset = rootNode.rangeStartPath ? rootNode.rangeStartPath.offset : null;
        let endOffset = rootNode.rangeEndPath ? rootNode.rangeEndPath.offset : null;
        let removeOffsets = false;

        if (startOffset && endOffset) {
            if (startOffset.type !== endOffset.type) {
                removeOffsets = true;
            } else if (startOffset.type === EpubCfiOffsetType.TEMPORAL && endOffset.type === EpubCfiOffsetType.TEMPORAL) {
                if ((startOffset.x !== null && endOffset.x === null) || (startOffset.x === null && endOffset.x !== null)) {
                    startOffset.x = null;
                    startOffset.y = null;
                    endOffset.x = null;
                    endOffset.y = null;
                    astModified = true;
                }
            }
        } else if ((!startOffset && endOffset && endOffset.type !== EpubCfiOffsetType.CHARACTER) || (startOffset && !endOffset)) {
            removeOffsets = true;
        }
        if (removeOffsets) {
            if (rootNode.rangeStartPath) {
                rootNode.rangeStartPath.offset = null;
            }
            if (rootNode.rangeEndPath) {
                rootNode.rangeEndPath.offset = null;
            }
            astModified = true;
        }

        if (astModified && !skipErrorReporting) {
            rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.INCOMPATIBLE_OFFSET_TYPE));
        }

        return astModified;
    }

    /**
     * Removes any initial indirection from parent path if set, like epubcfi(!/6/4....)
     *
     * @return true if AST was modified, false otherwise
     */
    static removeInitialIndirectionFromParentPath(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;
        if (rootNode.parentPath) {
            let firstLocalPath = rootNode.parentPath.localPaths[0];
            if (firstLocalPath && firstLocalPath.indirection) {
                firstLocalPath.indirection = false;
                astModified = true;
                if (!skipErrorReporting) {
                    rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.INVALID_INDIRECTION, firstLocalPath.srcOffset));
                }
            }
        }
        return astModified;
    }

    /**
     * Remove local paths and offsets from rangeStart and rangeEnd if it is incompatible with parentPath offset.
     *
     * @return true if AST was modified, false otherwise
     */
    static removeInvalidRangeAfterParentPathOffset(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;
        if (rootNode.parentPath && rootNode.parentPath.offset) {
            let parentOffset = rootNode.parentPath.offset;
            let pureTemporalOffset = parentOffset.type === EpubCfiOffsetType.TEMPORAL && parentOffset.x === null;

            if (rootNode.rangeStartPath && removeInvalidRangeAfterParentPathOffset(rootNode, rootNode.rangeStartPath, pureTemporalOffset, skipErrorReporting)) {
                rootNode.rangeStartPath = null;
                astModified = true;
            }
            if (rootNode.rangeEndPath && removeInvalidRangeAfterParentPathOffset(rootNode, rootNode.rangeEndPath, pureTemporalOffset, skipErrorReporting)) {
                rootNode.rangeEndPath = null;
                astModified = true;
            }
        }
        return astModified;
    }

    /**
     * Cut away all nodes that occur after text steps.
     * If the parentPath is modified by this action, rangeStart and rangeEnd will be set to null.
     *
     * @return true if AST was modified, false otherwise
     */
    static removeStepsAfterTextSteps(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;
        let result;
        if (rootNode.parentPath) {
            result = removeAllAfterTextStepsInPath(rootNode, rootNode.parentPath, skipErrorReporting);

            if (result.removed) {
                astModified = true;
                rootNode.rangeStartPath = null;
                rootNode.rangeEndPath = null;
            } else if (result.textStepFound) {
                if (rootNode.rangeStartPath && rootNode.rangeStartPath.localPaths.length > 0) {
                    astModified = true;
                    rootNode.rangeStartPath = null;
                }
                if (rootNode.rangeEndPath && rootNode.rangeEndPath.localPaths.length > 0) {
                    astModified = true;
                    rootNode.rangeEndPath = null;
                }
            }

        }
        if (rootNode.rangeStartPath) {
            result = removeAllAfterTextStepsInPath(rootNode, rootNode.rangeStartPath, skipErrorReporting);
            astModified = astModified || result.removed;
        }
        if (rootNode.rangeEndPath) {
            result = removeAllAfterTextStepsInPath(rootNode, rootNode.rangeEndPath, skipErrorReporting);
            astModified = astModified || result.removed;
        }
        return astModified;
    }

    /**
     * Run all epubcfi validations
     *
     * @return true if AST was modified, false otherwise
     */
    static runAllValidations(rootNode: IEpubCfiRootNode, skipErrorReporting?: boolean): boolean {
        let astModified = false;
        astModified = EpubCfiValidator.removeStepsAfterTextSteps(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeInitialIndirectionFromParentPath(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeInvalidRangeAfterParentPathOffset(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeIncompatibleRangeOffsets(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.checkEmptyParentPathAndRangeEnd(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.addExplicitCharacterOffsets(rootNode) || astModified;
        astModified = EpubCfiValidator.expandEmptyIndirectionLocalPaths(rootNode, skipErrorReporting) || astModified;
        astModified = EpubCfiValidator.removeEmptyIndirectionBeforeOffsets(rootNode, skipErrorReporting) || astModified;
        return astModified;
    }

}

function addIndirectionToPathStart(path: IEpubCfiPathNode): void {
    if (path.localPaths[0]) {
        path.localPaths[0].indirection = true;
    } else {
        let virtualStep: IEpubCfiStepNode = {
            stepValue: 0,
            assertion: null,
        };

        path.localPaths.push({
            steps: path.offset ? [] : [virtualStep],
            indirection: true,
        });
    }
}

function removeAllAfterTextStepsInPath(
    rootNode: IEpubCfiRootNode,
    path: IEpubCfiPathNode,
    skipErrorReporting?: boolean,
): { removed: boolean, textStepFound: boolean } {
    let removed = false;
    let textStepFound = false;

    let localPathIndex = path.localPaths.findIndex(localPath => {
        let textStepIndex = localPath.steps.findIndex(EpubCfiUtils.isTextStepNode);
        if (textStepIndex !== -1) {
            textStepFound = true;
            if (textStepIndex < localPath.steps.length - 1) {
                if (!skipErrorReporting) {
                    rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.INVALID_STEP, localPath.steps[textStepIndex].srcOffset));
                }
                localPath.steps = localPath.steps.slice(0, textStepIndex + 1);
                path.offset = null;
                removed = true;
            }
            return true;
        }
        return false;
    });

    if (localPathIndex !== -1 && localPathIndex < path.localPaths.length - 1) {
        path.localPaths = path.localPaths.slice(0, localPathIndex + 1);
        removed = true;
    }
    return {removed, textStepFound};
}

function removeEmptyIndirectionBeforeOffsets(
    rootNode: IEpubCfiRootNode,
    path: IEpubCfiPathNode,
    skipErrorReporting?: boolean,
): boolean {
    let astModified = false;
    if (path.offset) {
        const lastLocalPath = ArrayUtils.last(path.localPaths);
        if (lastLocalPath && lastLocalPath.indirection && lastLocalPath.steps.length === 0) {
            if (!skipErrorReporting) {
                rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.PATH_ENDS_WITH_INDIRECTION, lastLocalPath.srcOffset));
            }
            path.localPaths.length--;
            astModified = true;
        }
    }
    return astModified;
}

function removeInvalidRangeAfterParentPathOffset(
    rootNode: IEpubCfiRootNode,
    path: IEpubCfiPathNode,
    pureTemporalOffset: boolean,
    skipErrorReporting?: boolean,
): boolean {
    let astModified = false;
    if (path.localPaths.length > 0) {
        if (!skipErrorReporting) {
            rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.INVALID_RANGE_PATH, path.srcOffset));
        }
        astModified = true;
    } else if (path.offset && (!pureTemporalOffset || path.offset.type !== EpubCfiOffsetType.SPATIAL)) {
        if (!skipErrorReporting) {
            rootNode.errors.push(EpubCfiParserErrorHelper.createError(EpubCfiParserErrorType.INCOMPATIBLE_OFFSET_TYPE, path.offset.srcOffset));
        }
        astModified = true;
    }
    return astModified;
}
