// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    normalizePublicationAnnotation,
    type PublicationAnnotation,
    type PublicationAnnotationChange,
    type PublicationAnnotationDeleteChange,
    type PublicationAnnotationDraft,
    type PublicationAnnotationsSnapshot,
    type PublicationAnnotationsViewState,
} from "./model";
import type {
    PublicationAnnotationRepository,
    PublicationAnnotationsClock,
    PublicationAnnotationsIdProvider,
    PublicationAnnotationsLogger,
} from "./ports";
import { serializePublicationAnnotationsViewState } from "./view";

export interface PublicationAnnotationsControllerDependencies<TAnnotation extends PublicationAnnotation> {
    repository: PublicationAnnotationRepository<TAnnotation>;
    clock?: PublicationAnnotationsClock | undefined;
    idProvider?: PublicationAnnotationsIdProvider | undefined;
    logger?: PublicationAnnotationsLogger | undefined;
}

export class PublicationAnnotationsController<TAnnotation extends PublicationAnnotation> {

    private readonly repository: PublicationAnnotationRepository<TAnnotation>;
    private readonly clock: PublicationAnnotationsClock;
    private readonly idProvider?: PublicationAnnotationsIdProvider | undefined;
    private readonly logger?: PublicationAnnotationsLogger | undefined;

    public constructor(dependencies: PublicationAnnotationsControllerDependencies<TAnnotation>) {
        this.repository = dependencies.repository;
        this.clock = dependencies.clock || {
            now: () => Date.now(),
        };
        this.idProvider = dependencies.idProvider;
        this.logger = dependencies.logger;
    }

    public async list(publicationIdentifier: string): Promise<PublicationAnnotationsViewState<TAnnotation>> {
        const snapshot = await this.snapshot(publicationIdentifier);
        return serializePublicationAnnotationsViewState(snapshot);
    }

    public async get(publicationIdentifier: string, annotationIdentifier: string): Promise<TAnnotation | undefined> {
        const annotation = await this.repository.get(publicationIdentifier, annotationIdentifier);
        return annotation ? this.prepareExistingAnnotation(annotation) : undefined;
    }

    public async create(publicationIdentifier: string, annotation: PublicationAnnotationDraft<TAnnotation>): Promise<PublicationAnnotationChange<TAnnotation>> {
        const annotationWithDefaults = this.prepareNewAnnotation(annotation);
        const existingAnnotation = await this.repository.get(publicationIdentifier, annotationWithDefaults.uuid);
        if (existingAnnotation) {
            throw new Error(`Cannot create publication annotation ${annotationWithDefaults.uuid} because it already exists`);
        }

        await this.repository.create(publicationIdentifier, annotationWithDefaults);

        return {
            publicationIdentifier,
            annotation: annotationWithDefaults,
            revision: this.clock.now(),
        };
    }

    public async replace(publicationIdentifier: string, annotation: TAnnotation): Promise<PublicationAnnotationChange<TAnnotation>> {
        const previousAnnotationFromRepository = await this.repository.get(publicationIdentifier, annotation.uuid);
        const previousAnnotation = previousAnnotationFromRepository
            ? this.prepareExistingAnnotation(previousAnnotationFromRepository)
            : undefined;
        const nextAnnotation = this.prepareExistingAnnotation(annotation);
        await this.repository.replace(publicationIdentifier, nextAnnotation);

        return {
            publicationIdentifier,
            previousAnnotation,
            annotation: nextAnnotation,
            revision: this.clock.now(),
        };
    }

    public async update(publicationIdentifier: string, annotation: TAnnotation): Promise<PublicationAnnotationChange<TAnnotation>> {
        const previousAnnotationFromRepository = await this.repository.get(publicationIdentifier, annotation.uuid);
        const previousAnnotation = previousAnnotationFromRepository
            ? this.prepareExistingAnnotation(previousAnnotationFromRepository)
            : undefined;
        if (!previousAnnotation) {
            throw new Error(`Cannot update publication annotation ${annotation.uuid} because it does not exist`);
        }

        const nextAnnotation = this.prepareExistingAnnotation(annotation);
        await this.repository.update(publicationIdentifier, nextAnnotation);

        return {
            publicationIdentifier,
            previousAnnotation,
            annotation: nextAnnotation,
            revision: this.clock.now(),
        };
    }

    public async delete(publicationIdentifier: string, annotationIdentifier: string): Promise<PublicationAnnotationDeleteChange> {
        const previousAnnotation = await this.repository.get(publicationIdentifier, annotationIdentifier);
        if (!previousAnnotation) {
            throw new Error(`Cannot delete publication annotation ${annotationIdentifier} because it does not exist`);
        }

        await this.repository.delete(publicationIdentifier, annotationIdentifier);

        return {
            publicationIdentifier,
            annotationIdentifier,
            revision: this.clock.now(),
        };
    }

    public async deleteByPublication(publicationIdentifier: string): Promise<PublicationAnnotationsSnapshot<TAnnotation>> {
        await this.repository.deleteByPublication(publicationIdentifier);

        return {
            publicationIdentifier,
            annotations: [],
            revision: this.clock.now(),
        };
    }

    private async snapshot(publicationIdentifier: string): Promise<PublicationAnnotationsSnapshot<TAnnotation>> {
        const annotations = (await this.repository.list(publicationIdentifier))
            .map((annotation) => this.prepareExistingAnnotation(annotation));

        return {
            publicationIdentifier,
            annotations,
            revision: this.clock.now(),
        };
    }

    private prepareNewAnnotation(annotation: PublicationAnnotationDraft<TAnnotation>): TAnnotation {
        let uuid = annotation.uuid;
        if (!uuid && this.idProvider) {
            uuid = this.idProvider.next();
        }

        if (!uuid) {
            throw new Error("Cannot create a publication annotation without an identifier");
        }

        const created = annotation.created || this.clock.now();
        const annotationWithDefaults = {
            ...annotation,
            uuid,
            created,
        } as TAnnotation;

        this.logger?.debug("Create publication annotation", uuid);

        return normalizePublicationAnnotation(annotationWithDefaults);
    }

    private prepareExistingAnnotation(annotation: TAnnotation): TAnnotation {
        if (annotation.created) {
            return normalizePublicationAnnotation(annotation);
        }

        return normalizePublicationAnnotation({
            ...annotation,
            created: annotation.modified || this.clock.now(),
        });
    }
}
