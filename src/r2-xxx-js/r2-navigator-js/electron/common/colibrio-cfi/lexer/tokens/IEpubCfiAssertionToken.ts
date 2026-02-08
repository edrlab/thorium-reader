import {EpubCfiTokenType} from '../EpubCfiTokenType.js';
import {IEpubCfiStringToken} from './IEpubCfiStringToken.js';
import {IEpubCfiToken} from './IEpubCfiToken.js';
import {IEpubCfiValueToken} from './IEpubCfiValueToken.js';

export interface IEpubCfiAssertionToken extends IEpubCfiToken {
    type: EpubCfiTokenType.ASSERTION;

    value: (IEpubCfiStringToken | IEpubCfiValueToken)[];
}
