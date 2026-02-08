import {EpubCfiTokenType} from './EpubCfiTokenType.js';
import {IEpubCfiNumberToken} from './tokens/IEpubCfiNumberToken.js';
import {IEpubCfiStringToken} from './tokens/IEpubCfiStringToken.js';
import {IEpubCfiValueToken} from './tokens/IEpubCfiValueToken.js';

export interface IEpubCfiTokenTypeMapping {
    [EpubCfiTokenType.NUMBER]: IEpubCfiNumberToken;
    [EpubCfiTokenType.VALUE]: IEpubCfiValueToken;
    [EpubCfiTokenType.EQUAL_SIGN]: IEpubCfiStringToken;
    [EpubCfiTokenType.COLON]: IEpubCfiStringToken;
    [EpubCfiTokenType.COMMA]: IEpubCfiStringToken;
    [EpubCfiTokenType.EPUBCFI_START]: IEpubCfiStringToken;
    [EpubCfiTokenType.EPUBCFI_END]: IEpubCfiStringToken;
}