// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import Grid from "@material-ui/core/Grid";
import {Theme} from "@material-ui/core/styles/createMuiTheme";

import * as style from "readium-desktop/renderer/assets/styles/myBooks.css";

import Paper from "@material-ui/core/Paper";

import { createStyles, WithStyles, withStyles} from "@material-ui/core/styles";

// import { withApi } from "../utils/api";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

// import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

const styles = (theme: Theme) => createStyles ({
      root: {
        flexGrow: 1,
        marginTop: 40,
      },
      paper: {
        padding: theme.spacing.unit * 2,
        textAlign: "center",
        color: theme.palette.text.secondary,
        borderRadius: 20,
      },
    });

export interface TagProps extends WithStyles {
      entries: CatalogEntryView[];
}

export class GridTagLayout extends React.Component<TagProps> {

      public render(): React.ReactElement<{}> {
            const { classes } = this.props;
            return (
                  /*<div className={classes.root}>
                        <Grid container spacing={24}>
                              <Grid item xs>
                                    <Paper className={classes.paper}>tag</Paper>
                              </Grid>
                              <Grid item xs>
                                    <Paper className={classes.paper}>tag</Paper>
                              </Grid>
                              <Grid item xs>
                                    <Paper className={classes.paper}>tag</Paper>
                              </Grid>
                        </Grid>
                        <Grid container spacing={24}>
                              <Grid item xs>
                                    <Paper className={classes.paper}>tag</Paper>
                              </Grid>
                              <Grid item xs={8}>
                                    <Paper className={classes.paper}>tag</Paper>
                              </Grid>
                              <Grid item xs>
                                    <Paper className={classes.paper}>tag</Paper>
                              </Grid>
                        </Grid>
                  </div>*/ /*
                  <section id={style.content}>
                        <div>Tag</div>
                        <div>Tag</div>
                        <div>Tag</div>
                        <div>Tag</div>
                        <div>Tag</div>
                  </section>*/
                  <section id={style.content}>
                        {this.props.entries.map((entry, i: number) => {
                              return (
                                    /*<div key= {i}>
                                          <div>
                                                {entry.title}
                                          </div>
                                    </div>*/
                              this.checkEntryTotalCount(entry, i)
                              );
                        })}
                  </section>
            );
      }

      private checkEntryTotalCount(entry: CatalogEntryView, i: number) {
            if (entry.totalCount < 2) {
                  return (
                        <>
                        </>
                  );
            }
            return (
                  <div>
                        {entry.title}
                        <p id={style.count}>
                              {entry.totalCount}
                        </p>
                  </div>
            );
      }
}

export default withStyles(styles)(GridTagLayout);
