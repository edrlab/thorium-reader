import * as React from "react";

import FocusLock from "react-focus-lock";

import OutsideClickAlerter from "readium-desktop/renderer/components/utils/OutsideClickAlerter";

interface Props {
    className?: any;
    visible: boolean;
    toggleMenu: any;
    dontCloseWhenClickOutside?: boolean;
    focusMenuButton?: () => void;
}

interface State {
    inFocus: boolean;
    triggerElem: any;
}

export default class AccessibleMenu extends React.Component<Props, State> {
    private containerRef: any;

    public constructor(props: Props) {
        super(props);

        this.state = {
            inFocus: false,
            triggerElem: null,
        };

        this.containerRef = React.createRef();
        this.handleFocus = this.handleFocus.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.onClickOutside = this.onClickOutside.bind(this);
    }

    public componentDidMount() {
        if (this.props.visible) {
            document.addEventListener("keydown", this.handleKey);
            document.addEventListener("focusin", this.handleFocus);
        }
    }

    public componentWillUnmount() {
        if (this.props.visible) {
            document.removeEventListener("keydown", this.handleKey);
            document.removeEventListener("focusin", this.handleFocus);
        }
    }

    public componentDidUpdate(oldProps: Props, prevState: State) {
        if (!this.props.visible && oldProps.visible) {
            document.removeEventListener("keydown", this.handleKey);
            document.removeEventListener("focusin", this.handleFocus);

            this.setState({
                inFocus: false,
            });
        } else if (this.props.visible && !oldProps.visible) {
            document.addEventListener("keydown", this.handleKey);
            document.addEventListener("focusin", this.handleFocus);

            this.setState({
                triggerElem: document.activeElement,
            });
        }

        if (prevState.inFocus
            && !this.state.inFocus
            && this.state.triggerElem
        ) {
            if (this.state.triggerElem != null) {
                this.state.triggerElem.focus();
            }
        }
    }

    public render() {
        const disabled = !this.props.visible || !this.state.inFocus;

        return (
            <OutsideClickAlerter disabled={!this.props.visible} onClickOutside={this.onClickOutside}>
                <div
                    {...(this.props.visible)}
                    ref={this.containerRef}
                    className={this.props.className}
                >
                    <FocusLock disabled={disabled} autoFocus={!disabled}>
                        { this.props.children }
                    </FocusLock>
                </div>
            </OutsideClickAlerter>
        );
    }

    private handleKey(event: any) {
        if (event.key === "Escape" || (!this.state.inFocus && (event.shiftKey && event.key === "Tab"))) {
            this.props.toggleMenu();
            this.props.focusMenuButton();
            this.setState({
                inFocus: false,
            });
        }
        if (event.key === "Tab" && !this.state.inFocus) {
            event.preventDefault();
            this.setState({
                inFocus: true,
            });
        }
    }

    private onClickOutside() {
        if (!this.props.dontCloseWhenClickOutside) {
            this.props.toggleMenu();
        }
    }

    private handleFocus(event: any) {
        const focusedNode = event.target;

        if (this.containerRef
            && this.containerRef.current
            && this.containerRef.current.contains(focusedNode)
        ) {
            this.setState({
                inFocus: true,
            });
        }
    }
}
