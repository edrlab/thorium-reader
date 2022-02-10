import * as React from "react";
import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

export function withRouter<P, S>(Component: React.ComponentClass<P, S>) {
    function ComponentWithRouterProp(props: P) {
        const location = useLocation();
        const navigate = useNavigate();
        const params = useParams();
        return (
            <Component
                {...props}
                router={{ location, navigate, params }}
            />
        );
    }
    return ComponentWithRouterProp;
}
