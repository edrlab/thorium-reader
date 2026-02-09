import {IEpubCfiAssertionToken} from './IEpubCfiAssertionToken';
import {IEpubCfiNumberToken} from './IEpubCfiNumberToken';
import {IEpubCfiStringToken} from './IEpubCfiStringToken';
import {IEpubCfiValueToken} from './IEpubCfiValueToken';

export type EpubCfiToken = IEpubCfiAssertionToken | IEpubCfiNumberToken | IEpubCfiStringToken | IEpubCfiValueToken;
