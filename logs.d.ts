declare module 'xeue-logs';
import type EventEmitter from "events";

export class Logs extends EventEmitter {
	constructor(
		createLogFile: boolean,
        logsFileName: string,
        configLocation: string,
        loggingLevel: string,
		debugLineNum: boolean,
		paused?: boolean,
		doneHeader?: boolean
	);

	printHeader(
        text: string
    ): void;

	setConf(
        conf: {
            'createLogFile': boolean,
            'logsFileName': string,
            'configLocation': string,
            'loggingLevel': string,
            'debugLineNum': boolean
        }
    ): void;

	log(
        message: any,
        level?: string | [
            Level: string,
            Catagory: string,
            Colour: string
        ],
        lineNumInp?: string
    ): {
        'timeString': string,
        'colour': string,
        'level': string,
        'levelColour': string,
        'textColour': string,
        'catagory': string,
        'seperator': string,
        'message': string,
        'lineNumString': string
    };

	object(
        message: string,
        obj: Object,
        level?: string | [
            Level: string,
            Catagory: string,
            Colour: string
        ],
        lineNumInp?: string
    ): void;

	file(
        msg: string,
        sync: boolean
    ): void;

	logSend(
        msgObj: {
            'timeString': string,
            'colour': string,
            'textColour': string,
            'catagory': string,
            'seperator': string,
            'message': string,
            'lineNumString': string
        },
        force: boolean
    ): void;

	force(
        message: string,
        level: string | [
            Level: string,
            Catagory: string,
            Colour: string
        ],
        lineNumInp?: string
    ): void;

	info(
        message: string,
        object?: Object
    ): void;

	debug(
        message: string,
        object?: Object
    ): void;

	warn(
        message: string,
        object?: Object
    ): void;

	error(
        message: string,
        object?: Object
    ): void;

	logSwitch(
        message: string,
        object: Object,
        level?: string | [
            Level: string,
            Catagory: string,
            Colour: string
        ],
        lineNum?: string
    ): void;

	pause(): void;

	resume(): void;

	parseInput(
        input: Object,
        backup: Object
    ): Object;

	select(
        list: Array<any>,
        current: string,
        seperatorColour: string,
        textColour: string
    ): Promise<any>;
	
    printSelected(
        moveCursor: boolean
    ): void;
	
	input(
        placeholder: string,
        seperatorColour: string,
        textColour: string
    ): Array<Promise<any> | string>
	
	silentInput(): Array<Promise<any> | string>;

	getLineNumber(): string;


    createLogFile: boolean;
    logsFileName: string;
    configLocation: string;
    loggingLevel: string;
    debugLineNum: boolean;
    paused: boolean;
    doneHeader: boolean;
    template: string;
    r: string;
    g: string;
    y: string;
    b: string;
    p: string;
    c: string;
    w: string;
    black: string;
    reset: string;
    dim: string;
    bright: string;
    underline: string;
    FgBlack: string;
    FgRed: string;
    FgGreen: string;
    FgYellow: string;
    FgBlue: string;
    FgMagenta: string;
    FgCyan: string;
    FgWhite: string;
    BgBlack: string;
    BgRed: string;
    BgGreen: string;
    BgYellow: string;
    BgBlue: string;
    BgMagenta: string;
    BgCyan: string;
    BgWhite: string;
}