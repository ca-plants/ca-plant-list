import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

const OPTION_DEFS = [
    { name: "help", type: Boolean },
    { name: "show-flower-errors", type: Boolean },
];

const OPTION_HELP = [
    {
        name: "help",
        type: Boolean,
        description: "Print this usage guide."
    },
    {
        name: "show-flower-errors",
        type: Boolean,
        description: "Include flower color and flowering time errors in errors.tsv."
    },
];

class CommandRunner {

    #commandName;
    #commandDesc;
    #optionDefs;
    #optionHelp;
    #additionalHelp;
    #commandFunc;

    constructor( commandName, commandDesc, optionDefs, optionHelp, additionalHelp = [], commandFunc ) {
        this.#commandName = commandName;
        this.#commandDesc = commandDesc;
        this.#optionDefs = optionDefs;
        this.#optionHelp = optionHelp;
        this.#additionalHelp = additionalHelp;
        this.#commandFunc = commandFunc;
    }

    async processCommandLine() {

        const options = commandLineArgs( this.#optionDefs.concat( OPTION_DEFS ) );

        if ( options.help ) {
            this.showHelp();
            return;
        }

        console.log( "Use --help to see all options" );
        await this.#commandFunc( options );

    }

    showHelp() {
        const help = [
            {
                header: this.#commandName,
                content: this.#commandDesc
            },
            {
                header: "Options",
                optionList: OPTION_HELP
            }
        ];
        help[ 1 ].optionList = help[ 1 ].optionList.concat( this.#optionHelp );
        console.log( commandLineUsage( help.concat( this.#additionalHelp ) ) );
    }

}

export { CommandRunner };