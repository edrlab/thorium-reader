import { getSearchUrlFromOpdsLinks } from "./search";

test("search atom url", async () => {
    expect(await getSearchUrlFromOpdsLinks([{
        TypeLink: "application/atom+xml",
        Href: "http://manybooks.net/opds/search.php?q={searchTerms}",
    }])).toBe("http://manybooks.net/opds/search.php?q={searchTerms}");
});

test("search opds2 url", async () => {
    expect(await getSearchUrlFromOpdsLinks([{
        TypeLink: "application/opds+json",
        Href: "https://catalog.feedbooks.com/search.json{?query}",
    }])).toBe("https://catalog.feedbooks.com/search.json?query={searchTerms}");
});

test("search atom url multi search", async () => {
    expect(await getSearchUrlFromOpdsLinks([{
        TypeLink: "application/atom+xml",
        Href: "http://manybooks.net/opds/search.php?test=123&q={searchTerms}&filter=null",
    }])).toBe("http://manybooks.net/opds/search.php?test=123&q={searchTerms}&filter=null");
});

test("search opds2 url multi search", async () => {
    expect(await getSearchUrlFromOpdsLinks([{
        TypeLink: "application/opds+json",
        Href: "https://catalog.feedbooks.com/search.json{?author,query}",
    }])).toBe("https://catalog.feedbooks.com/search.json?query={searchTerms}");
});

test("opensearch", async () => {
    expect(await getSearchUrlFromOpdsLinks([{
        TypeLink: "application/opensearchdescription+xml",
        Href: "http://static.wolnelektury.pl/opensearch.xml",
    }])).toBe("http://static.wolnelektury.pl/opensearch.xml");
});

test("search opds2 url multi search", async () => {
    expect(await getSearchUrlFromOpdsLinks([{
        TypeLink: "application/opds+json",
        Href: "http://static.wolnelektury.pl/opensearch.xml",
    }])).toBe(undefined);
});
