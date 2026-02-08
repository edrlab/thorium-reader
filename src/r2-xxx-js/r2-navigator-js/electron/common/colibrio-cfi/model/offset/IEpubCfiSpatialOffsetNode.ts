import {EpubCfiOffsetType} from './EpubCfiOffsetType.js';
import {IEpubCfiOffsetNode} from './IEpubCfiOffsetNode.js';

/**
 * Describes a spatial offset within a media element.
 *
 **/
export declare interface IEpubCfiSpatialOffsetNode extends IEpubCfiOffsetNode {
    type: EpubCfiOffsetType.SPATIAL,

    /**
     * The x-coordinate as a value between 0 and 100.
     */
    x: number;

    /**
     * The y-coordinate as a value between 0 and 100.
     */
    y: number;
}
