import {EpubCfiTokenType} from '../EpubCfiTokenType.js';
import {IEpubCfiToken} from './IEpubCfiToken.js';

export interface IEpubCfiNumberToken extends IEpubCfiToken {
    type: EpubCfiNumberTokenType,
    value: number
}

export type EpubCfiNumberTokenType = EpubCfiTokenType.NUMBER | EpubCfiTokenType.STEP;
