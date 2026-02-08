import {EpubCfiTokenType} from '../EpubCfiTokenType';
import {IEpubCfiToken} from './IEpubCfiToken';

export interface IEpubCfiStringToken extends IEpubCfiToken {
    type: EpubCfiStringTokenType;
    value: string;
}

export type EpubCfiStringTokenType =
    EpubCfiTokenType.BAD_TOKEN |
    EpubCfiTokenType.INVALID_END |
    EpubCfiTokenType.EPUBCFI_START |
    EpubCfiTokenType.EPUBCFI_END |
    EpubCfiTokenType.EXCLAMATION_MARK |
    EpubCfiTokenType.COMMA |
    EpubCfiTokenType.COLON |
    EpubCfiTokenType.SEMICOLON |
    EpubCfiTokenType.EQUAL_SIGN |
    EpubCfiTokenType.COMMERCIAL_AT |
    EpubCfiTokenType.TILDE;
