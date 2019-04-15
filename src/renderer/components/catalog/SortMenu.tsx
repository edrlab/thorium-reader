// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";
import * as styles from "readium-desktop/renderer/assets/styles/publication.css";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

interface SortMenuProps {
      onClickAlphaSort?: () => void;
      onClickCountSort?: () => void;
}

interface SortMenuState {
      menuOpen: boolean;
      value: string;
}

export default class SortMenu extends React.Component<SortMenuProps, SortMenuState> {
      public constructor(props: any) {
            super(props);

            this.state = {
                  menuOpen: false,
                  value: "",
            };
      }

      public render(): React.ReactElement<{}> {
            return (
                  <div id={style.sortType}>
                        <button
                        onClick={this.props.onClickAlphaSort}> A-Z </button>
                        <button
                        onClick={this.props.onClickCountSort}> tag count</button>
                  </div>
            );
      }
}
