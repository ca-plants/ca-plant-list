import { RarePlants } from "../rareplants.js";
import { BasePageRenderer } from "../basepagerenderer.js";
import { Files } from "../files.js";
import { HTML } from "../html.js";
import { TAXA_LIST_COLS } from "../htmltaxon.js";
import { PageTaxonList } from "./pageTaxonList.js";
import { HTMLFragments } from "../utils/htmlFragments.js";
import { PageTaxon } from "./pageTaxon.js";

const ENDANGERED_COLS = [
    TAXA_LIST_COLS.SPECIES,
    TAXA_LIST_COLS.COMMON_NAME,
    TAXA_LIST_COLS.CESA,
    TAXA_LIST_COLS.FESA,
];
const RPI_COLUMNS = [
    TAXA_LIST_COLS.SPECIES_BARE,
    TAXA_LIST_COLS.COMMON_NAME,
    TAXA_LIST_COLS.CNPS_RANK,
];

export class PageRenderer extends BasePageRenderer {
    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {import('../config.js').Config} config
     * @param {import("../types.js").Taxa} taxa
     */
    static renderAll(siteGenerator, config, taxa) {
        super.renderBasePages(siteGenerator, taxa);

        this.renderLists(siteGenerator, config, taxa);

        const taxonList = taxa.getTaxonList();
        for (const taxon of taxonList) {
            new PageTaxon(siteGenerator, config, taxon).render();
        }
    }

    /**
     * @param {import("../types.js").SiteGenerator} siteGenerator
     * @param {import('../config.js').Config} config
     * @param {import("../types.js").Taxa} taxa
     */
    static renderLists(siteGenerator, config, taxa) {
        /**
         * @param {ListInfo[]} listInfo
         * @param {Object<string,string>} attributes
         * @param {import("../types.js").TaxaColDef[]} [columns]
         * @returns {string}
         */
        function getListArray(listInfo, attributes = {}, columns) {
            const listArray = [];
            for (const list of listInfo) {
                const listTaxa = [];
                const calfloraTaxa = [];
                const iNatTaxa = [];
                for (const taxon of taxa.getTaxonList()) {
                    if (list.include(taxon)) {
                        listTaxa.push(taxon);
                        calfloraTaxa.push(taxon.getCalfloraName());
                        iNatTaxa.push(taxon.getINatName());
                    }
                }

                if (listTaxa.length === 0) {
                    continue;
                }

                Files.write(
                    outputDir + "/calflora_" + list.filename + ".txt",
                    calfloraTaxa.join("\n"),
                );
                Files.write(
                    outputDir + "/inat_" + list.filename + ".txt",
                    iNatTaxa.join("\n"),
                );

                const cols = columns ? columns : list.columns;
                new PageTaxonList(
                    siteGenerator,
                    list.name,
                    list.filename,
                ).render(listTaxa, cols);

                // Check for sublists.
                const subListHTML = list.listInfo
                    ? getListArray(list.listInfo, { class: "indent" }, cols)
                    : "";

                listArray.push(
                    HTML.getLink("./" + list.filename + ".html", list.name) +
                        " (" +
                        listTaxa.length +
                        ")" +
                        subListHTML,
                );
            }

            return renderList(listArray, attributes);
        }

        /**
         * @param {string[]} listsHTML
         * @param {Object<string,string>} attributes
         */
        function renderList(listsHTML, attributes = {}) {
            return HTML.wrap("ul", HTML.arrayToLI(listsHTML), attributes);
        }

        /**
         * @param {string} title
         * @param {string} listsHTML
         */
        function renderSection(title, listsHTML) {
            let html = '<div class="section nobullet">';
            html += HTML.textElement("h2", title);
            html += listsHTML;
            html += "</div>";
            return html;
        }

        const outputDir = siteGenerator.getBaseDir();

        /** @typedef {{name:string,filename:string,include:function(import("../types.js").Taxon):boolean,columns?:import("../types.js").TaxaColDef[],listInfo?:ListInfo[]}} ListInfo */
        /** @type {{title:string,listInfo:ListInfo[]}[]} */
        const sections = [
            {
                title: "All Species",
                listInfo: [
                    {
                        name: config.getLabel("native", "Native"),
                        filename: "list_native",
                        include: (t) => t.isNative(),
                    },
                    {
                        name: config.getLabel("introduced", "Introduced"),
                        filename: "list_introduced",
                        include: (t) => !t.isNative(),
                    },
                    {
                        name: "All Plants",
                        filename: "list_all",
                        include: () => true,
                    },
                ],
            },
            {
                title: "Rare Plants",
                listInfo: [
                    {
                        name: "CNPS Ranked Plants",
                        filename: "list_rpi",
                        include: (t) => t.getRPIRank() !== undefined,
                        columns: RPI_COLUMNS,
                        listInfo: [
                            {
                                name: RarePlants.getRPIRankDescription("1A"),
                                filename: "list_rpi_1a",
                                include: (t) => t.getRPIRank() === "1A",
                            },
                            {
                                name: RarePlants.getRPIRankDescription("1B"),
                                filename: "list_rpi_1b",
                                include: (t) => t.getRPIRank() === "1B",
                            },
                            {
                                name: RarePlants.getRPIRankDescription("2A"),
                                filename: "list_rpi_2a",
                                include: (t) => t.getRPIRank() === "2A",
                            },
                            {
                                name: RarePlants.getRPIRankDescription("2B"),
                                filename: "list_rpi_2b",
                                include: (t) => t.getRPIRank() === "2B",
                            },
                            {
                                name: RarePlants.getRPIRankDescription("3"),
                                filename: "list_rpi_3",
                                include: (t) => t.getRPIRank() === "3",
                            },
                            {
                                name: RarePlants.getRPIRankDescription("4"),
                                filename: "list_rpi_4",
                                include: (t) => t.getRPIRank() === "4",
                            },
                        ],
                    },
                    {
                        name: "Endangered Species",
                        filename: "list_endangered",
                        include: (t) => !!t.getCESA() || !!t.getFESA(),
                        columns: ENDANGERED_COLS,
                    },
                ],
            },
        ];

        let html =
            HTMLFragments.getMarkdownSection("./data/intros/index_lists.md") +
            '<div class="wrapper">';

        for (const section of sections) {
            const listHTML = getListArray(section.listInfo);

            if (listHTML.length > 0) {
                html += renderSection(section.title, listHTML);
            }
        }
        html += renderSection(
            "Taxonomy",
            renderList([
                HTML.getLink("./list_families.html", "Plant Families"),
            ]),
        );

        html += "</div>";

        siteGenerator.writeTemplate(
            html,
            { title: "Plant lists" },
            "index_lists.html",
        );
    }
}
