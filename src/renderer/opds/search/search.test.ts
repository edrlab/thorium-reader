import { getSearchUrlFromOpdsLinks } from "./search";

test("search atom url", () => {
    expect(getSearchUrlFromOpdsLinks([{
        TypeLink: "application/atom+xml",
        Href: "http://manybooks.net/opds/search.php?q={searchTerms}",
    }])).toBe("http://manybooks.net/opds/search.php?q={searchTerms}");
});
