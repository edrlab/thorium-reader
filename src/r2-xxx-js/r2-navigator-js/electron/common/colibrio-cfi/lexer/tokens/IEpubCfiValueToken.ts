import {EpubCfiTokenType} from '../EpubCfiTokenType';
import {IEpubCfiToken} from './IEpubCfiToken';

export interface IEpubCfiValueToken extends IEpubCfiToken {
    hasSpaces: boolean
    type: EpubCfiTokenType.VALUE;
    value: string;
}
