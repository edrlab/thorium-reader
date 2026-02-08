import {EpubCfiTokenType} from '../EpubCfiTokenType.js';
import {IEpubCfiToken} from './IEpubCfiToken.js';

export interface IEpubCfiValueToken extends IEpubCfiToken {
    hasSpaces: boolean
    type: EpubCfiTokenType.VALUE;
    value: string;
}
