declare module 'xeue-logs';

export class Logs extends EventEmitter {
	constructor(
		createLogFile: boolean,
        logsFileName: string,
        configLocation: string,
        loggingLevel: string,
		debugLineNum: boolean,
		paused: boolean,
		doneHeader: boolean
	): void;

	printHeader(
        text: string
    ): void;

	setConf(
        conf: Object
    ): void;

	log(
        message: any,
        level: string | Array<string>,
        lineNumInp: string
    ): string;

	object(
        message: string,
        obj: Object,
        level: string | Array<string>,
        lineNumInp: string
    ): void;

	file(
        msg: string,
        sync: boolean
    ): void;

	logSend(
        message: string,
        force: boolean
    ): void;

	force(
        message: string,
        level: string | Array<string>,
        lineNumInp: string
    ): void;

	info(
        message: string,
        object: Object
    ): void;

	debug(
        message: string,
        object: Object
    ): void;

	warn(
        message: string,
        object: Object
    ): void;

	error(
        message: string,
        object: Object
    ): void;

	logSwitch(
        message: string,
        object: Object,
        level: string | Array<string>,
        lineNum: string
    ): void;

	pause(): void;

	resume(): void;

	parseInput(
        input: Object,
        backup: Object
    ): Object;

	select(
        list: Array,
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
    ): Array<promise | string>
	
	silentInput(): Array<promise | string>;

	getLineNumber(): string;
}