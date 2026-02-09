import {EpubCfiOffsetType} from './EpubCfiOffsetType';
import {IEpubCfiOffsetNode} from './IEpubCfiOffsetNode';

/**
 * Describes a temporal offset within a media element, and optionally spatial coordinates.
 *
 *
 */
export declare interface IEpubCfiTemporalOffsetNode extends IEpubCfiOffsetNode {
    /**
     * The time offset in seconds from the start of the media.
     */
    seconds: number;

    type: EpubCfiOffsetType.TEMPORAL;

    /**
     * The x-coordinate as a value between 0 and 100.
     * If specified, the y-coordinate must also be specified.
     */
    x: number | null;

    /**
     * The y-coordinate as a value between 0 and 100.
     * If specified, the x-coordinate must also be specified.
     */
    y: number | null;
}
