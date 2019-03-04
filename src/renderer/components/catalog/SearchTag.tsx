// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as styles from "readium-desktop/renderer/assets/styles/settings.css";

import * as Autosuggest from "react-autosuggest";
import SVG from "../utils/SVG";

interface SearchContainerProps {
    tagTabs?: string[];
}

interface SearchContainerState {
    value: string;
    suggestions: string[];
}

export class SearchContainer extends React.Component<SearchContainerProps, SearchContainerState> {
    public constructor(props: any) {
        super(props);
        this.state = {
            value: "",
            suggestions: [],
        };
        this.updateTagValue = this.updateTagValue.bind(this);
        this.onSuggestionFetchRequested = this.onSuggestionFetchRequested.bind(this);
        this.onSuggestionClearRequested =  this.onSuggestionClearRequested.bind(this);
        this.getSuggestionValue = this.getSuggestionValue.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.renderSuggestions = this.renderSuggestions.bind(this);
        this.renderInputComponent = this.renderInputComponent.bind(this);
    }

    public render(): React.ReactElement<{}> {
        if (!this.props.tagTabs) {
            return (
                <></>
            );
        }
        const inputProps = {
            placeholder: "Indiquez votre #tag",
            value: this.state.value,
            onChange: this.updateTagValue,
        };
        return (
                <Autosuggest
                suggestions={this.state.suggestions}
                onSuggestionsFetchRequested={this.onSuggestionFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionClearRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestions}
                onSuggestionSelected={this.onSuggestionSelected}
                inputProps={inputProps}
                renderInputComponent={this.renderInputComponent}/>
            );
    }

    private renderInputComponent(inputProps: any): any {
            return (<div style={{position: "relative"}}>
                {/*<SVG svg={SearchIcon}/>*/}
                <img className="icon" src="readium-desktop/src/renderer/assets/icons/baseline-search-24px-grey.svg"/>
                <input {...inputProps}/>
            </div>);
        }

    private getSuggestions(): any[] {
        let escapedValue: string;
        console.log("value props: " + this.props.tagTabs);
        escapedValue = this.state.value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (escapedValue === "") {
            return [];
        }
        const regex = new RegExp("^" + escapedValue, "i");
        this.setState({suggestions: this.getTags()});
        return (this.props.tagTabs.filter(
            (suggestion) => regex.test(suggestion)));
    }

    private getSuggestionValue(suggestion: any): any {
        return (suggestion);
    }

    private renderSuggestions(suggestion: any): any {
        return (<span>{suggestion}</span>);
    }

    
    private onSuggestionSelected() {
        this.setState({
            value: "",
        });
    }

    private getTags(): string[] {

        const tab: string[] = [];
        this.props.tagTabs.map((tag: string, index: number) =>
        tab.push(tag));
        //tab = this.props.tagTabs.map((tag: string) => return (tag));
        this.setState({
            suggestions: tab,
        });
        return (tab);
    }
    private onSuggestionFetchRequested() {
        this.setState({
            suggestions: this.getSuggestions(),
        });
    }
    private onSuggestionClearRequested() {
        this.setState({
            suggestions: [],
        });
    }
    private updateTagValue(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
              value: e.target.value,
          });
    }
}
