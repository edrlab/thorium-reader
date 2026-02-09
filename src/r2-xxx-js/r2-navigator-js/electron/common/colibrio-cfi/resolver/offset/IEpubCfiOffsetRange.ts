import {IEpubCfiCharacterOffset} from './IEpubCfiCharacterOffset';
import {IEpubCfiSpatialOffset} from './IEpubCfiSpatialOffset';
import {IEpubCfiTemporalOffset} from './IEpubCfiTemporalOffset';

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
