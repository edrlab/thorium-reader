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

import { withApi } from "../utils/api";
import { AddEntryForm } from "./AddEntryForm";

interface SearchContainerProps {
    tagTabs?: string[];
    onChange?: (value: string) => void;
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
                renderInputComponent={this.renderInputComponent}
                />
            );
    }
    /**
     * Define the rendering of the input
     * @param inputProps is a variable that contains input attribute
     */
    private renderInputComponent(inputProps: any): any {

        const str = "src/renderer/assets/icons/baseline-search-24px-grey.svg";
        return (
            <span id={styles.tag_input}>
                <input {...inputProps}/>
                <img src={str}
                    alt="Search tag" aria-hidden="true" />

            </span>);
        }

    /**
     * Filter input value in case of multiple error
     * @returns a match of suggestions with tag string table
     */
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

    /*
    **Implement it to teach Autosuggest what should be the input value
    **when suggestion is clicked. @param suggestion is value in suggestion table
    */
    private getSuggestionValue(suggestion: any): any {
        console.log("suggestion value: " + suggestion);
        console.log(this.props);
        this.setState({
            value: suggestion,
        });
        console.log("getvaluesuggestion state: " + this.state.value);
        this.props.onChange(suggestion);
         // put addEntry() here in order to add new tag into the home screen layout
        return (suggestion);
    }

    /**
     * Define how suggestions are rendered
     * @param suggestion is value of each cell of suggestion table
     */
    private renderSuggestions(suggestion: any): any {
        return (<span id={styles.value_input}>{suggestion}</span>);
    }

    /**
     * Call every time suggestion is selected by mouse
     */

    private onSuggestionSelected(e: React.ChangeEvent<HTMLInputElement>, {suggestion}: any) {
        console.log("input value: " + e.target.value);
        console.log("state value: " + this.state.value);
        console.log("selected suggestion: " + suggestion);
        //e.target.value = suggestion;

        this.setState({
            value: suggestion,
        });
    }

    /**
     * Copy props tab into suggestion tab in order to be able to modify it.
     * @returns string tab
     */
    private getTags(): string[] {

        const tab: string[] = [];
        this.props.tagTabs.map((tag: string) =>
        tab.push(tag));
        // tab = this.props.tagTabs.map((tag: string) => return (tag));
        this.setState({
            suggestions: tab,
        });
        return (tab);
    }

    /**
     * Get sugestion tab. It's called every time it need.
     */
    private onSuggestionFetchRequested() {
        this.setState({
            suggestions: this.getSuggestions(),
        });
    }

    /**
     * It will be called every time we need to erase
     */
    private onSuggestionClearRequested() {
        this.setState({
            suggestions: [],
        });
    }

    /**
     * Get user search value
     * @param e is an event
     */
    private updateTagValue(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
              value: e.target.value,
          });
    }
}

export default withApi(
    AddEntryForm,
    {
        operations: [
            {
                moduleId: "catalog",
                methodId: "addEntry",
                callProp: "addEntry",
            },
        ],
    },
);
