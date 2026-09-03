// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { PublicationAnnotation } from "./model";

export interface PublicationAnnotationRepository<TAnnotation extends PublicationAnnotation> {
    list(publicationIdentifier: string): Promise<TAnnotation[]>;
    get(publicationIdentifier: string, annotationIdentifier: string): Promise<TAnnotation | undefined>;
    create(publicationIdentifier: string, annotation: TAnnotation): Promise<void>;
    replace(publicationIdentifier: string, annotation: TAnnotation): Promise<void>;
    update(publicationIdentifier: string, annotation: TAnnotation): Promise<void>;
    delete(publicationIdentifier: string, annotationIdentifier: string): Promise<void>;
    deleteByPublication(publicationIdentifier: string): Promise<void>;
}

export interface PublicationAnnotationsClock {
    now(): number;
}

export interface PublicationAnnotationsIdProvider {
    next(): string;
}

export interface PublicationAnnotationsLogger {
    debug(message: string, ...values: unknown[]): void;
}
