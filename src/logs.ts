import fs from 'fs';
import figlet from 'figlet';
import EventEmitter from 'events';
import readline from 'readline';

export class Logs extends EventEmitter {
    createLogFile: boolean;
    logsFileName: string;
    configLocation: string;
    currentLevel: Level;
    debugLineNum: boolean;
    paused: boolean;
    doneHeader: boolean;
    template: string;
    r: Colour = '\x1b[31m' as Colour; //red
    g: Colour = '\x1b[32m' as Colour; //green
    y: Colour = '\x1b[33m' as Colour; //yellow
    b: Colour = '\x1b[34m' as Colour; //blue
    p: Colour = '\x1b[35m' as Colour; //pruple
    c: Colour = '\x1b[36m' as Colour; //cyan
    w: Colour = '\x1b[37m' as Colour; //white
    black: Colour = '\x1b[30m' as Colour; //black
    reset: Colour = '\x1b[0m' as Colour;
    dim: Colour = '\x1b[2m' as Colour;
    bright: Colour = '\x1b[1m' as Colour;
    underline: Colour = '\x1b[4m' as Colour;
    FgBlack: Colour = '\x1b[30m' as Colour;
    FgRed: Colour = '\x1b[31m' as Colour;
    FgGreen: Colour = '\x1b[32m' as Colour;
    FgYellow: Colour = '\x1b[33m' as Colour;
    FgBlue: Colour = '\x1b[34m' as Colour;
    FgMagenta: Colour = '\x1b[35m' as Colour;
    FgCyan: Colour = '\x1b[36m' as Colour;
    FgWhite: Colour = '\x1b[37m' as Colour;
    BgBlack: Colour = '\x1b[40m' as Colour;
    BgRed: Colour = '\x1b[41m' as Colour;
    BgGreen: Colour = '\x1b[42m' as Colour;
    BgYellow: Colour = '\x1b[43m' as Colour;
    BgBlue: Colour = '\x1b[44m' as Colour;
    BgMagenta: Colour = '\x1b[45m' as Colour;
    BgCyan: Colour = '\x1b[46m' as Colour;
    BgWhite: Colour = '\x1b[47m' as Colour;
    constructor(
        createLogFile = true,
        logsFileName = 'logs',
        configLocation = './',
        currentLevel: Level = 'D',
        options = {
            'debugLineNum': false,
            'paused': false,
            'doneHeader': false,
            'template': '[$TIME][$LEVEL] $CATAGORY$SEPERATOR $MESSAGE $LINENUMBER'
        }
    ) {
        super();
        this.createLogFile = createLogFile;
        this.logsFileName = logsFileName;
        this.configLocation = configLocation;
        this.currentLevel = currentLevel;
        this.debugLineNum = options.debugLineNum || false;
        this.paused = options.paused || false;
        this.doneHeader = options.doneHeader || false;
        this.template = options.template || '[$TIME][$LEVEL] $CATAGORY$SEPERATOR $MESSAGE $LINENUMBER';
        readline.emitKeypressEvents(process.stdin);
    }

    printHeader(text: string) {
        if (this.doneHeader) return;
        const asci = figlet.textSync(text, {
            font: 'Big',
            horizontalLayout: 'fitted',
            verticalLayout: 'fitted'
        });
        console.log(asci);
        this.file(asci, true);
        this.doneHeader = true;
    }

    setConf(conf: Partial<LogsConf>) {
        this.createLogFile = conf.createLogFile ? conf?.createLogFile : this.createLogFile;
        this.logsFileName = conf.logsFileName ? conf?.logsFileName : this.logsFileName;
        this.configLocation = conf.configLocation ? conf?.configLocation : this.configLocation;
        this.currentLevel = conf.loggingLevel ? conf?.loggingLevel : this.currentLevel;
        this.debugLineNum = conf.debugLineNum ? conf?.debugLineNum : this.debugLineNum;
    }

    log(message: any, level: LevelCombo, lineNumInput?: string): logMessage[] {
        const lineNum = typeof lineNumInput !== 'undefined' ? lineNumInput : this.getLineNumber();
        const timeNow = new Date();
        const hours = String(timeNow.getHours()).padStart(2, '0');
        const minutes = String(timeNow.getMinutes()).padStart(2, '0');
        const seconds = String(timeNow.getSeconds()).padStart(2, '0');
        const millis = String(timeNow.getMilliseconds()).padStart(3, '0');

        const timeString = `${hours}:${minutes}:${seconds}.${millis}`;

        if (typeof message === 'undefined') {
            this.error(`Log message from line ${this.p}${lineNum}${this.reset} is not defined`);
            return [];
        } else if (typeof message !== 'string' && typeof message !== 'boolean' && typeof message !== 'number') {
            this.error(`Log message from line ${this.p}${lineNum}${this.reset} is not a string so attemping to stringify`);
            try {
                message = JSON.stringify(message, null, 4);
            } catch (e) {
                this.error(`Log message from line ${this.p}${lineNum}${this.reset} could not be converted to string`);
                this.error('Message', e)
                console.dir(message);
                return [];
            }
        }
        message = message + ',';
        message = message.replace(/=(.*?)([ |,|)|}|\]])/g, `=${this.y}$1${this.w}$2`);
        message = message.slice(0, -1);
        message = message.replace(/true/g, `${this.g}true${this.w}`);
        message = message.replace(/false/g, `${this.r}false${this.w}`);
        message = message.replace(/null/g, `${this.y}null${this.w}`);
        message = message.replace(/undefined/g, `${this.y}undefined${this.w}`);
        message = message.replace(/[\r]/g, '');
        let messageArray = message.split(/[\r\n]/g);
        let levelColourCustom = this.p;
        let levelTextCustom = 'CUSTOM';
        let custom = false;
        if (Array.isArray(level)) {
            if (level.length > 2) {
                levelColourCustom = level[2] || this.p;
            }
            levelTextCustom = level[1];
            level = level[0];
            custom = true;
        }
        let returnArray: logMessage[] = [];
        for (let index = 0; index < messageArray.length; index++) {
            let text = messageArray[index];

            const regexp = / \((.*?):(.[0-9]*):(.[0-9]*)\)"/g;
            const matches = text.matchAll(regexp);
            for (const match of matches) {
                text = text.replace(match[0], `" [${this.y}${match[1]}${this.reset}] ${this.p}(${match[2]}:${match[3]})${this.reset}`);
            }

            let draw = false;
            let levelColour = this.g;
            let levelText = '  CORE';
            let showLineNum = this.debugLineNum;

            switch (level) {
                case 'A':
                case 'I':
                    if (this.currentLevel == 'A') { //White
                        draw = true;
                        levelColour = this.w;
                        levelText = '  INFO';
                    }
                    break;
                case 'D':
                    if (this.currentLevel == 'A' || this.currentLevel == 'D') { //Cyan
                        draw = true;
                        levelColour = this.c;
                        levelText = ' DEBUG';
                    }
                    break;
                case 'S':
                case 'N':
                    if (this.currentLevel == 'A' || this.currentLevel == 'D') { //Blue
                        draw = true;
                        levelColour = this.b;
                        levelText = 'NETWRK';
                    }
                    break;
                case 'W':
                    if (this.currentLevel != 'E') { //Yellow
                        draw = true;
                        levelColour = this.y;
                        levelText = '  WARN';
                    }
                    break;
                case 'E': //Red
                    levelColour = this.r;
                    levelText = ' ERROR';
                    draw = true;
                    break;
                case 'H': //Green
                    levelColour = this.g;
                    levelText = '  HELP';
                    draw = true;
                    showLineNum = false;
                    break;
                case 'C':
                default: //Green
                    draw = true;
                    levelColour = this.g;
                    levelText = '  CORE';
            }

            let lineNumString = `${lineNum}`;
            if (Array.isArray(level)) {
                if (level.length > 3) {
                    if (!level[3]) {
                        showLineNum = false;
                    }
                }
            }
            if (!showLineNum) {
                lineNumString = '';
            }
            let seperator = ':';
            if (custom) {
                levelColour = levelColourCustom;
                levelText = levelTextCustom;
                while (levelText.length < 6) {
                    levelText = ' ' + levelText;
                }
                if (levelText == '' || levelText.trim() == '') seperator = '|';
            }
            if (index !== 0) {
                lineNumString = '';
                let levelTextFiller = '';
                for (let index = 0; index < levelText.length; index++) {
                    levelTextFiller += ' ';
                }
                levelText = levelTextFiller;
                seperator = '|';
            }
            if (draw) {
                const msg: logMessage = {
                    time: timeString,
                    level: level,
                    levelColour: levelColour,
                    levelText: levelText,
                    levelTextColour: levelColour,
                    textColour: this.w,
                    seperator: seperator,
                    text: text,
                    lineNum: lineNumString
                }
                this.logSend(msg);
                returnArray.push(msg);
            }
        }
        return returnArray;
    }

    object(message: any, obj: any, level: LevelCombo, lineNumInp?: string) {
        let errorMessage = true;
        const lineNum = typeof lineNumInp !== 'undefined' ? lineNumInp : this.getLineNumber();

        if (typeof message === 'object') {
            if (typeof obj === 'string') {
                level = obj as Level;
            }
            obj = message;
            message = undefined;
            errorMessage = false;
        }

        let combined: string;
        if (typeof message === 'undefined') {
            message = 'Logged object';
        }
        if (obj instanceof Error) {
            if (errorMessage) {
                this.log(message, level, lineNum);
            }
            this.log(obj.stack, level, lineNum);
        } else {
            try {
                combined = `${message}: ${JSON.stringify(obj, null, 4)}`;
            } catch (error) {
                this.log(message, level, lineNum);
                combined = obj;
            }
            this.log(combined, level, lineNum);
        }
    }

    file(message: string, sync = false) {
        if (this.createLogFile) {
            const dir = `${this.configLocation}/logs`;

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, {
                    recursive: true
                });
            }

            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();

            const fileName = `${dir}/${this.logsFileName}-[${yyyy}-${mm}-${dd}].log`;
            const data = message.replaceAll(this.r, '').replaceAll(this.g, '').replaceAll(this.y, '').replaceAll(this.b, '').replaceAll(this.p, '').replaceAll(this.c, '').replaceAll(this.w, '').replaceAll(this.reset, '').replaceAll(this.dim, '').replaceAll(this.bright, '') + '\n';

            if (sync) {
                try {
                    fs.appendFileSync(fileName, data);
                } catch (error) {
                    this.createLogFile = false;
                    this.error('Could not write to log file, permissions?');
                }
            } else {
                fs.appendFile(fileName, data, err => {
                    if (err) {
                        this.createLogFile = false;
                        this.error('Could not write to log file, permissions?');
                    }
                });
            }
        }
    }

    logSend(message: logMessage, force = false) {
        if (this.paused && !force) return;
        switch (message.level) {
            case 'A':
            case 'I':
                message.level = 'I';
                message.levelColour = this.dim;
                break;
            case 'S':
            case 'N':
            case 'D':
                message.level = 'D';
                message.levelColour = this.c;
                break;
            case 'U':
                message.level = 'U';
                message.levelColour = this.c;
                break;
            case 'W':
                message.level = 'W';
                message.levelColour = this.y;
                break;
            case 'E': //Red
                message.level = 'E';
                message.levelColour = this.r;
                break;
            case 'H': //Green
                message.level = 'H';
                message.levelColour = this.g;
                break;
            default:
                message.level = '•';
                message.levelColour = this.g;
        }

        const output = this.#paternDecompose(message)

        this.file(output);
        readline.moveCursor(process.stdout, -5000, 0);
        console.log(output);
        this.emit('logSend', message);
    }

    force(message: any, level: LevelCombo, lineNumInp?: string) {
        const messages = this.log(message, level, lineNumInp);
        if (!this.paused) return;
        messages.forEach(msg => this.logSend(msg, true));
    }

    info(message: string, object?: any) {
        const lineNum = this.getLineNumber();
        this.logSwitch(message, object, 'I', lineNum);
    }

    debug(message: string, object?: any) {
        const lineNum = this.getLineNumber();
        this.logSwitch(message, object, 'D', lineNum);
    }

    warn(message: string, object?: any) {
        const lineNum = this.getLineNumber();
        this.logSwitch(message, object, 'W', lineNum);
    }

    error(message: string, object?: any) {
        const lineNum = this.getLineNumber();
        this.logSwitch(message, object, 'E', lineNum);
    }

    logSwitch(message: string, object: any, level: Level, lineNum?: string) {
        let text;
        switch (level) {
            case 'E':
                text = 'Error';
                break;
            case 'W':
                text = 'Warning';
                break;
            case 'S':
            case 'N':
            case 'D':
                text = 'Debug';
                break;
            case 'I':
            case 'A':
                text = 'Info';
                break;
            default:
                break;
        }
        if (typeof message !== 'undefined' && typeof object !== 'undefined') {
            this.object(message, object, level, lineNum);
        } else if (typeof message !== 'undefined' && typeof object === 'undefined') {
            this.log(message, level, lineNum);
        } else if (typeof message === 'undefined' && typeof object !== 'undefined') {
            this.object(text, object, level, lineNum);
        } else {
            this.log(`It looks like an unspecified: ${text} has been called`, level, lineNum);
        }
    }

    pause() {
        this.emit('logPause');
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this.emit('logResume');
    }

    parseInput(input: string, backup?: string): string {
        let output;
        try {
            output = JSON.parse(input);
        } catch (error) {
            output = input;
        }
        if ((output === '' || typeof output === 'undefined') && typeof backup !== 'undefined') {
            output = backup;
        }
        return output;
    }

    select(list: Array<string | boolean | number> | { [key: string]: string | boolean | number }, current: string | boolean | number, seperatorColour = this.c, textColour = this.c): Promise<string | boolean | number> {
        let listPretty: { [key: string]: string | number | boolean } = {};

        if (Array.isArray(list)) {
            listPretty = Object.fromEntries(list.map(a => [String(a), a]));
        } else if (typeof list == 'object') {
            [list, listPretty] = [Object.keys(list), list];
        } else {

        }

        let selected = list.indexOf(current);
        if (selected == -1) {
            selected = list.indexOf(String(current));
        }

        const printSelected = (moveCursor = true) => {
            let options: string[] = [];
            list.forEach((option, index) => {
                let colour = '';
                switch (option) {
                    case true:
                    case 'true':
                        colour = this.g;
                        break;
                    case false:
                    case 'false':
                        colour = this.r;
                        break;
                    case undefined:
                    case null:
                        colour = this.y;
                        break;
                }
                const text = listPretty[String(option)];
                if (index == selected) {
                    options.push(`${this.reset}${this.underline}${colour}${text}${this.reset}${this.dim}`);
                } else {
                    options.push(`${this.dim}${colour}${text}`);
                }
            });
            if (moveCursor) readline.moveCursor(process.stdout, 0, -1);
            console.log(this.#paternDecompose({ time: ' User Input ', level: 'U', levelText: '      ', seperator: ':', text: options.join(','), lineNum: '', levelTextColour: this.c, textColour: this.w, levelColour: this.c }));
        };

        printSelected(false);
        return new Promise(resolve => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('keypress', (ch, key) => {
                switch (key.name) {
                    case 'right': //Right
                        if (selected < list.length - 1) {
                            selected++;
                            printSelected();
                        }
                        break;
                    case 'left': //Left
                        if (selected > 0) {
                            selected--;
                            printSelected();
                        }
                        break;
                    case 'c': //Stop code
                        if (key.ctrl) {
                            this.force('Process exited by user command', ['H', 'SERVER', this.r]);
                            process.exit();
                        }
                        break;
                    case 'return': {//Enter
                        process.stdin.removeAllListeners('keypress');
                        process.stdin.setRawMode(false);
                        readline.moveCursor(process.stdout, 0, -1);
                        readline.clearLine(process.stdout, 1);
                        const text = listPretty[String(list[selected])];
                        this.logSend({
                            time: `${this.c}Data Entered${this.reset}`,
                            level: 'U',
                            levelColour: seperatorColour,
                            levelTextColour: seperatorColour,
                            textColour: textColour,
                            levelText: '',
                            seperator: '      |',
                            text: String(text),
                            lineNum: ''
                        }, true);
                        let ret = list[selected] === 'true' ? true : list[selected];
                        ret = list[selected] === 'false' ? false : ret;
                        resolve(ret);
                        break;
                    }
                    default:
                        break;
                }
            });
            this.once('cancelInput', () => {
                resolve(false);
            });
        });
    }

    input(placeholder: string, seperatorColour = this.c, textColour = this.c): [Promise<string>, readline.Interface] {
        const userCatagory = 'U'
        const userInput = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: this.#paternDecompose({ time: ' User Input ', level: userCatagory, levelTextColour: this.c, textColour: this.w, levelColour: this.c })
        });
        const promise: Promise<string> = new Promise((resolve) => {
            if (typeof placeholder !== 'undefined') {
                const outputString = this.#paternDecompose({ time: ' User Input ', level: userCatagory, text: placeholder, levelTextColour: this.c, textColour: this.dim, levelColour: this.c });
                console.log(outputString);
                const cusrsorPossition = outputString.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').search(placeholder) || 1;
                readline.moveCursor(process.stdout, 0, -1);
                readline.moveCursor(process.stdout, cusrsorPossition, 0);
            } else {
                const outputString = this.#paternDecompose({ time: ' User Input ', level: userCatagory, levelTextColour: this.c, textColour: this.dim, levelColour: this.c });
                console.log(outputString);
                const cusrsorPossition = outputString.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').search(':') || 1;
                readline.moveCursor(process.stdout, 0, -1);
                readline.moveCursor(process.stdout, cusrsorPossition, 0);
            }
            userInput.on('line', async (input) => {
                userInput.close();
                const output = this.parseInput(input, placeholder);
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 1);
                this.logSend({
                    'time': `${this.c}Data Entered${this.reset}`,
                    'level': userCatagory,
                    'levelTextColour': seperatorColour,
                    'levelColour': seperatorColour,
                    'textColour': textColour,
                    'levelText': '',
                    'seperator': '      |',
                    'text': output,
                    'lineNum': ''
                }, true);
                resolve(output);
            });
        });
        return [promise, userInput];
    }

    silentInput(): [Promise<string>, readline.Interface] {
        const userInput = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: ''
        });
        const promise: Promise<string> = new Promise((resolve) => {
            userInput.on('line', async (input) => {
                userInput.close();
                const output = this.parseInput(input);
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 1);
                resolve(output);
            });
        });
        return [promise, userInput];
    }

    getLineNumber(): string {
        const error = new Error();
        if (!error.stack) {
            return "";
        }
        const stack = error.stack.toString().split(/\r\n|\n/);
        const stackPos = stack.length > 3 ? 3 : stack.length - 1;
        const path = stack[stackPos].split('\\').pop();
        if (!path) return "";
        let lineNumRaw = path.split('/').pop();
        if (!lineNumRaw) return "";
        if (lineNumRaw.includes('(')) lineNumRaw = lineNumRaw.split('(').pop();
        let lineNum = '(' + lineNumRaw;
        if (lineNum[lineNum.length - 1] !== ')') {
            lineNum += ')';
        }
        return lineNum;
    }

    #paternDecompose(message: Partial<logMessage>): string {
        let output = this.reset + this.template.replace('$TIME', `${this.reset}${message.time || ''}${this.reset}`);
        output = output.replace('$LEVEL', `${message.levelColour || this.dim}${message.level || ''}${this.reset}`);
        output = output.replace('$CATAGORY', `${message.levelTextColour || this.dim}${message.levelText || '      '}${this.reset}`);
        output = output.replace('$SEPERATOR', `${message.seperatorColour || this.w}${message.seperator || ':'}${this.reset}`);
        output = output.replace('$MESSAGE', `${message.textColour || this.w}${message.text || ''}${this.reset}`);
        output = output.replace('$LINENUMBER', `${this.p}${message.lineNum || ''}${this.reset}`);
        return output;
    }
}

export type logMessage = {
    time: string,
    text: string,
    textColour?: Colour,
    level: Level,
    levelColour?: Colour,
    levelText: string,
    levelTextColour?: Colour,
    seperator: string,
    seperatorColour?: Colour,
    lineNum: string
}

export type Colour = string & { readonly '': unique symbol }
export type Level = 'A' | 'I' | 'D' | 'S' | 'N' | 'W' | 'E' | 'H' | 'C' | 'U' | '•'
export type LevelText = string
export type CustomLevel = [Level, LevelText, Colour?]
export type LevelCombo = Level | CustomLevel

export type LogsConf = {
    createLogFile: boolean,
    logsFileName: string,
    configLocation: string,
    debugLineNum: boolean,
    loggingLevel: Level
}