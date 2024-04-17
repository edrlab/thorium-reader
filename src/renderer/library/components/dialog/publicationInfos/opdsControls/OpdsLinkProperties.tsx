// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import * as React from "react";
import { IOPDSPropertiesView } from "readium-desktop/common/views/opds";
import * as stylesBookDetailsDialog from "readium-desktop/renderer/assets/styles/bookDetailsDialog.scss";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";

import { OPDSAvailabilityEnum } from "@r2-opds-js/opds/opds2/opds2-availability";
import { findMimeTypeWithExtension, ADOBE_ADEPT_XML } from "readium-desktop/utils/mimeTypes";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as AvailableIcon from "readium-desktop/renderer/assets/icons/available-icon.svg";
import * as UnvavailableIcon from "readium-desktop/renderer/assets/icons/stop-icon.svg";

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

        const MetadataLineComponent: React.FC<React.PropsWithChildren & {text: string}> = ({text, children}) =>
            <div className={stylesBookDetailsDialog.opds_book_infos}>
                <strong>{`${text}: `}</strong>
                <span className={stylesBookDetailsDialog.allowUserSelect}>
                    {children}
                </span>
                <br />
            </div>

        const stateInfo = (
            () => {
                if (properties.availabilityState) {

                    switch (properties.availabilityState) {
                        case OPDSAvailabilityEnum.Available:
                            return (
                                <div className={stylesBookDetailsDialog.opds_book_state}>
                                    <SVG ariaHidden svg={AvailableIcon} className={stylesBookDetailsDialog.opds_book_available} />
                                    <p>{__("catalog.opds.info.availableState.available")}</p>
                                </div>
                            );
                        case OPDSAvailabilityEnum.Unavailable:
                            return (
                                <div className={stylesBookDetailsDialog.opds_book_state}>
                                    <SVG ariaHidden svg={UnvavailableIcon} className={stylesBookDetailsDialog.opds_book_unavailable} />
                                    <p>{__("catalog.opds.info.availableState.unavailable")}</p>
                                </div>
                            );
                        case OPDSAvailabilityEnum.Ready:
                            return <>{__("catalog.opds.info.availableState.ready")}</>;
                        case OPDSAvailabilityEnum.Reserved:
                            return <>{__("catalog.opds.info.availableState.reserved")}</>;
                        default:
                            return <>{__("catalog.opds.info.availableState.unknown")}</>;
                    }
                }
                return undefined;
            }
        )();

        return (
            <>
                {
                    properties.indirectAcquisitionTypes?.top === findMimeTypeWithExtension(ADOBE_ADEPT_XML) ?
                        <><span title={properties.indirectAcquisitionTypes.top.replace(/application\//, "")} style={{ textDecoration: "line-through" }}>(Adobe Adept)</span><br /><br /></> : <></>
                }
                {properties.numberOfItems ?
                    <MetadataLineComponent text={__("catalog.opds.info.numberOfItems")}>
                        <>{properties.numberOfItems}</>
                    </MetadataLineComponent> : <></>
                }
                {
                    (properties.priceValue && properties.priceCurrency) ?
                        <MetadataLineComponent text={__("catalog.opds.info.priveValue")}>
                            <>{`${properties.priceValue} ${properties.priceCurrency}`}</>
                        </MetadataLineComponent> : <></>
                }
                {
                    properties.copyTotal ?
                        <MetadataLineComponent text={__("catalog.opds.info.copyTotal")}>
                            <>{properties.copyTotal}</>
                        </MetadataLineComponent> : <></>
                }
                {
                    properties.copyAvailable ?
                        <MetadataLineComponent text={__("catalog.opds.info.copyAvalaible")}>
                            <>{properties.copyAvailable}</>
                        </MetadataLineComponent> : <></>
                }
                {
                    properties.holdTotal ?
                        <MetadataLineComponent text={__("catalog.opds.info.holdTotal")}>
                            <>{properties.holdTotal}</>
                        </MetadataLineComponent> : <></>
                }
                {
                    properties.holdPosition ?
                        <MetadataLineComponent text={__("catalog.opds.info.holdPosition")}>
                            <>{properties.holdPosition}</>
                        </MetadataLineComponent> : <></>
                }
                {
                    stateInfo ?
                        <MetadataLineComponent text={__("catalog.opds.info.state")}>
                            {stateInfo}
                        </MetadataLineComponent> : <></>
                }
                {
                    properties.availabilitySince ?
                        <MetadataLineComponent text={__("catalog.opds.info.availableSince")}>
                            <>{moment(properties.availabilitySince).format("LLL")}</>
                        </MetadataLineComponent> : <></>
                }
                {
                    properties.availabilityUntil ?
                        <MetadataLineComponent text={__("catalog.opds.info.availableUntil")}>
                            <>{moment(properties.availabilityUntil).format("LLL")}</>
                        </MetadataLineComponent> : <></>
                }
            </>
        );
    }
}

export default withTranslator(OpdsLinkProperties);
