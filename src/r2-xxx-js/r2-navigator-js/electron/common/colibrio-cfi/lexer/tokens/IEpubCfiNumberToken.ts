import {EpubCfiTokenType} from '../EpubCfiTokenType';
import {IEpubCfiToken} from './IEpubCfiToken';

export interface IEpubCfiNumberToken extends IEpubCfiToken {
    type: EpubCfiNumberTokenType,
    value: number
}

export type EpubCfiNumberTokenType = EpubCfiTokenType.NUMBER | EpubCfiTokenType.STEP;
