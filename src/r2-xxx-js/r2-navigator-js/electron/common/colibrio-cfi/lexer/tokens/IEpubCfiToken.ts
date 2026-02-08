import {EpubCfiTokenType} from '../EpubCfiTokenType.js';

export interface IEpubCfiToken {
    srcOffset: number;
    type: EpubCfiTokenType;
    value: number | string | IEpubCfiToken[];
}
