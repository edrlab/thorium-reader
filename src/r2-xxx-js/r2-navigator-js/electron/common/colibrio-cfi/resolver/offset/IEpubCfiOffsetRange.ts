import {IEpubCfiCharacterOffset} from './IEpubCfiCharacterOffset.js';
import {IEpubCfiSpatialOffset} from './IEpubCfiSpatialOffset.js';
import {IEpubCfiTemporalOffset} from './IEpubCfiTemporalOffset.js';

/**
 * Generic type to describe a range between two EPUB CFI Offsets.
 *
 **/
export declare interface IEpubCfiOffsetRange<T extends EpubCfiOffsetRangeType> {
    /**
     * The exclusive end position.
     */
    end: T | null

    /**
     * The inclusive start position.
     */
    start: T,
}

/**
 *
 */
export declare type EpubCfiOffsetRangeType = IEpubCfiSpatialOffset | IEpubCfiTemporalOffset | IEpubCfiCharacterOffset;
