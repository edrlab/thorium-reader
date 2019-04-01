// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import "../../../../node_modules/bootstrap/dist/css/bootstrap.min.css";

import * as styles from "readium-desktop//renderer/assets/styles/slider.css";

interface TagContainerProps {
      tag?: string;
      totalCount?: number;
}

export default class TagContainer extends React.Component<TagContainerProps> {
      public constructor(props: any) {
            super(props);
      }

      public render(): React.ReactElement<{}> {
            return (
                  <span className={styles.badge}>
                        <a href="#">
                              {this.props.tag}
                              <div>{this.props.totalCount}</div>
                        </a>
                  </span>
            );
      }
}
