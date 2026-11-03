import "reflect-metadata";
import { describe, expect, it } from "@jest/globals";
import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";
import { initGlobalConverters_GENERIC, initGlobalConverters_SHARED } from "@r2-shared-js/init-globals";
import { Metadata } from "@r2-shared-js/models/metadata";
import { Publication } from "@r2-shared-js/models/publication";
import { addOtherMetadata, getOpf_ } from "@r2-shared-js/parser/epub-daisy-common";

initGlobalConverters_GENERIC();
initGlobalConverters_SHARED();

describe("accessibility exemptions", () => {
    it.each(["eaa-microenterprise", "eaa-disproportionate-burden", "eaa-fundamental-alteration"])(
        "parses and preserves EPUB exemption %s through JSON storage", exemption => {
            const opf = getOpf_(`<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
                <metadata><meta property="a11y:exemption">  ${exemption}  </meta></metadata>
                <manifest/><spine/></package>`, "book.opf");
            const publication = new Publication();
            publication.Metadata = new Metadata();
            addOtherMetadata(publication, undefined, opf);
            expect(publication.Metadata.Accessibility.Exemption).toEqual([exemption]);
            const stored = TaJsonSerialize(publication);
            expect(TaJsonDeserialize(stored, Publication).Metadata.Accessibility.Exemption).toEqual([exemption]);
        },
    );
    it("accepts the singular OPDS exemption string", () => {
        const metadata = TaJsonDeserialize({ accessibility: { exemption: "eaa-microenterprise" } }, Metadata);
        expect(metadata.Accessibility.Exemption).toEqual(["eaa-microenterprise"]);
    });
});
