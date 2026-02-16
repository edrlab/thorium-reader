import {EpubCfiTokenType} from '../EpubCfiTokenType';
import {IEpubCfiStringToken} from './IEpubCfiStringToken';
import {IEpubCfiToken} from './IEpubCfiToken';
import {IEpubCfiValueToken} from './IEpubCfiValueToken';

export interface IEpubCfiAssertionToken extends IEpubCfiToken {
    type: EpubCfiTokenType.ASSERTION;

    value: (IEpubCfiStringToken | IEpubCfiValueToken)[];
}
