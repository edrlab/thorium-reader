import {EpubCfiTokenType} from '../EpubCfiTokenType';

export interface IEpubCfiToken {
    srcOffset: number;
    type: EpubCfiTokenType;
    value: number | string | IEpubCfiToken[];
}
