import {EpubCfiTokenType} from './EpubCfiTokenType';
import {IEpubCfiNumberToken} from './tokens/IEpubCfiNumberToken';
import {IEpubCfiStringToken} from './tokens/IEpubCfiStringToken';
import {IEpubCfiValueToken} from './tokens/IEpubCfiValueToken';

export interface IEpubCfiTokenTypeMapping {
    [EpubCfiTokenType.NUMBER]: IEpubCfiNumberToken;
    [EpubCfiTokenType.VALUE]: IEpubCfiValueToken;
    [EpubCfiTokenType.EQUAL_SIGN]: IEpubCfiStringToken;
    [EpubCfiTokenType.COLON]: IEpubCfiStringToken;
    [EpubCfiTokenType.COMMA]: IEpubCfiStringToken;
    [EpubCfiTokenType.EPUBCFI_START]: IEpubCfiStringToken;
    [EpubCfiTokenType.EPUBCFI_END]: IEpubCfiStringToken;
}
