import {SearchProvider,SearchBox,Results,WithSearch,Paging,ErrorBoundary,Sorting,Facet,ResultsPerPage,PagingInfo} from "@elastic/react-search-ui";
import { Layout, SingleSelectFacet,BooleanFacet,SingleLinksFacet } from "@elastic/react-search-ui-views";
import React, {Component} from "react";
import axios from 'axios';
import "@elastic/react-search-ui-views/lib/styles/styles.css";
import buildStateFacets from "./buildFacets";

const transformSearchUIStateToQuery = state => {
    return {keystroke:state.searchTerm,labels:""}
}

const callSomeOtherService = async query =>{
    const resp = await axios.post(`http://localhost:5000/search/query`,query)
    console.log(resp.data)
    return resp.data
}

const transformOtherServiceResponseToSearchUIState = response =>{
    console.log("setting state: ")
    console.log(response.searchResults)
    let results = response.searchResults.hits.hits.map((x,i)=>{return {paragraph:{snippet:x.highlight.paragraph[0]}, id:{raw: x._id}, labels:{snippet:x._source.labels.join()}}});
    console.log(results)
    const facets = buildStateFacets(response.searchResults.aggregations);
    return {results: results, autocompletedResults: results,...(facets && { facets })}
};

class SearchService extends Component{

    render() {
        return (
            <div><SearchProvider
                config={{
                    onSearch: async state => {
                        const queryForOtherService = transformSearchUIStateToQuery(state);
                        const otherServiceResponse = await callSomeOtherService(
                            queryForOtherService
                        );
                        console.log("AWAIT")
                        console.log(otherServiceResponse)
                        return transformOtherServiceResponseToSearchUIState(otherServiceResponse);
                    },
                    onAutocomplete: async state => {
                        const queryForOtherService = transformSearchUIStateToQuery(state);
                        const otherServiceResponse = await callSomeOtherService(
                            queryForOtherService
                        );
                        return transformOtherServiceResponseToSearchUIState(otherServiceResponse);
                    }
                }}
            >

                <WithSearch mapContextToProps={({ wasSearched }) => ({ wasSearched })}>
                    {({ wasSearched }) => (
                        <div className="App">
                            <ErrorBoundary>
                                <Layout
                                    header={
                                        <SearchBox searchAsYouType={true}/>
                                    }
                                    sideContent={
                                        <div>
                                            {wasSearched && (
                                                <div><Sorting
                                                    label={"Sort by"}
                                                    sortOptions={[
                                                        {
                                                            name: "Relevance",
                                                            value: "",
                                                            direction: ""
                                                        },
                                                        {
                                                            name: "Title",
                                                            value: "title",
                                                            direction: "asc"
                                                        }
                                                    ]}
                                                />
                                                </div>
                                            )}
                                            <Facet
                                                field="facets"
                                                label="Labels"
                                                filterType="any"
                                            />
                                        </div>
                                    }
                                    bodyContent={
                                        <Results
                                            titleField="title"
                                            urlField="nps_link"
                                            shouldTrackClickThrough={true}
                                        />
                                    }
                                    bodyHeader={
                                        <React.Fragment>
                                            {wasSearched && <PagingInfo />}
                                            {wasSearched && <ResultsPerPage />}
                                        </React.Fragment>
                                    }
                                    bodyFooter={<Paging />}
                                />
                            </ErrorBoundary>
                        </div>
                    )}
                </WithSearch>
            </SearchProvider>
        </div>
        );
    }
}

export default SearchService;
