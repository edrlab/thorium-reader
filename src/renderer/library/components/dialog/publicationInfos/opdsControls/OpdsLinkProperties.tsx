// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import * as React from "react";
import { IOPDSPropertiesView } from "readium-desktop/common/views/opds";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";

import { OPDSAvailabilityEnum } from "@r2-opds-js/opds/opds2/opds2-availability";
import { findMimeTypeWithExtension, MIME_TYPE_ADOBE_OBSOLETE_BORROWING_FORMAT } from "readium-desktop/utils/mimeTypes";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    properties: IOPDSPropertiesView | undefined;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps {
}

class OpdsLinkProperties extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render() {

        const { properties, __ } = this.props;

        if (!properties) {
            return (<></>);
        }

        const metadataLineComponent = (text: string, property: string | number) =>
            property &&
            <>
                <strong>{`${text}: `}</strong>
                <i className={stylesBookDetailsDialog.allowUserSelect}>
                    {property}
                </i>
                <br />
            </>;

        return (
            <>
                {
                    properties.indirectAcquisitionType === findMimeTypeWithExtension(MIME_TYPE_ADOBE_OBSOLETE_BORROWING_FORMAT) &&
                    <><strong>{__("catalog.opds.info.indirectAcquisitionType")}</strong><br /></>
                }
                {
                    metadataLineComponent(__("catalog.opds.info.numberOfItems"), properties.numberOfItems)
                }
                {
                    properties.priceValue && properties.priceCurrency &&
                    metadataLineComponent(
                        __("catalog.opds.info.priveValue"),
                        `${properties.priceValue} ${properties.priceCurrency}`)
                }
                {
                    metadataLineComponent(__("catalog.opds.info.copyTotal"), properties.copyTotal)
                }
                {
                    metadataLineComponent(__("catalog.opds.info.copyAvalaible"), properties.copyAvailable)
                }
                {
                    metadataLineComponent(__("catalog.opds.info.holdTotal"), properties.holdTotal)
                }
                {
                    metadataLineComponent(__("catalog.opds.info.holdPosition"), properties.holdPosition)
                }
                {
                    metadataLineComponent(__("catalog.opds.info.state"), (
                        () => {
                            if (properties.availabilityState) {

                                switch (properties.availabilityState) {
                                    case OPDSAvailabilityEnum.Available:
                                        return __("catalog.opds.info.availableState.available");
                                    case OPDSAvailabilityEnum.Unavailable:
                                        return __("catalog.opds.info.availableState.unavailable");
                                    case OPDSAvailabilityEnum.Ready:
                                        return __("catalog.opds.info.availableState.ready");
                                    case OPDSAvailabilityEnum.Reserved:
                                        return __("catalog.opds.info.availableState.reserved");
                                    default:
                                        return __("catalog.opds.info.availableState.unknown");
                                }
                            }
                            return undefined;
                        }
                    )())
                }
                {
                    properties.availabilitySince &&
                        metadataLineComponent(
                            __("catalog.opds.info.availableSince"),
                            moment(properties.availabilitySince).format("LLL"))
                }
                {
                    properties.availabilityUntil &&
                        metadataLineComponent(
                            __("catalog.opds.info.availableUntil"),
                            moment(properties.availabilityUntil).format("LLL"))
                }
            </>
        );
    }
}

export default withTranslator(OpdsLinkProperties);
