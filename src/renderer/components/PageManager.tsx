import * as React from "react";
import { StaticRouter as Router } from "react-router";
import { Route, Switch } from "react-router-dom";

import { Translator } from "readium-desktop/common/services/translator";
import { lazyInject } from "readium-desktop/renderer/di";

import { routes } from "readium-desktop/renderer/routing";

interface States {
    activePage: number;
}

export default class PageManager extends React.Component<{}, States> {

    @lazyInject("translator")
    private translator: Translator;

    public constructor(props: any) {
        super(props);

        this.state = {
            activePage: 0,
        };

        this.handlePageClick = this.handlePageClick.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);
        const activePage = this.state.activePage;
        return (
            <Switch>
                {Object.keys(routes).map((path: string) => {
                    const route = (routes as any)[path];
                    return (
                        <Route
                            key={path}
                            exact={route.exact}
                            path={route.path}
                            component={route.component} />
                    );
                })}
            </Switch>
        );
    }

    private handlePageClick(id: number) {
        this.setState({activePage: id});
    }
}
