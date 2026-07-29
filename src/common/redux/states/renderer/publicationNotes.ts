// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { PublicationNote, PublicationNotesSnapshot } from "readium-desktop/common/publication-notes";

export type IPublicationNotesSnapshotState = PublicationNotesSnapshot<PublicationNote>;

export const publicationNotesSnapshotInitialState: IPublicationNotesSnapshotState = {
    publicationIdentifier: "",
    notes: [],
    revision: 0,
};
