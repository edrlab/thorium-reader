import {IEpubCfiAssertionToken} from './IEpubCfiAssertionToken.js';
import {IEpubCfiNumberToken} from './IEpubCfiNumberToken.js';
import {IEpubCfiStringToken} from './IEpubCfiStringToken.js';
import {IEpubCfiValueToken} from './IEpubCfiValueToken.js';

export type EpubCfiToken = IEpubCfiAssertionToken | IEpubCfiNumberToken | IEpubCfiStringToken | IEpubCfiValueToken;