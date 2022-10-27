import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import figlet from 'figlet';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let createLogFile = true;
export let logsFileName = "Test";
export let configLocation = __dirname;
export let loggingLevel = "A";
export let debugLineNum = true;
export const logEvent = new EventEmitter();
let paused = false;


export const logs = {
    printHeader: printHeader,
    setConf: setConf,
    loadArgs: loadArgs,
    log: log,
    logObj: logObj,
    logFile: logFile,
    logSend: logSend,
    pause: pause,
    resume: resume,
    force: logForced,

    r: "\x1b[31m", //red
    g: "\x1b[32m", //green
    y: "\x1b[33m", //yellow
    b: "\x1b[34m", //blue
    p: "\x1b[35m", //pruple
    c: "\x1b[36m", //cyan
    w: "\x1b[37m", //white
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bright: "\x1b[1m",
    createLogFile: createLogFile,
    logsFileName: logsFileName,
    configLocation: configLocation,
    loggingLevel: loggingLevel,
    debugLineNum: debugLineNum
}

function printHeader(text) {
    console.clear();
    const asci = figlet.textSync(text, {
        font: 'Big',
        horizontalLayout: 'fitted',
        verticalLayout: 'fitted'
    })
    console.log(asci);
    logFile(asci, true);
}

function setConf(conf) {
    createLogFile = conf?.createLogFile;
    logsFileName = conf?.logsFileName;
    configLocation = conf?.configLocation;
    loggingLevel = conf?.loggingLevel;
    debugLineNum = conf?.debugLineNum;
}

function loadArgs() {
    if (typeof args[0] !== "undefined") {
        if (args[0] == "--help" || args[0] == "-h" || args[0] == "-H" || args[0] == "--h" || args[0] == "--H") {
            log(`You can start the server with two arguments: (config path) (logging level)`, "H");
            log(`The first argument is the relative path of the config file, eg (${logs.y}.${logs.reset}) or (${logs.y}/Config1${logs.reset})`, "H");
            log(`The second argument is the desired logging level ${w+dim}(A)ll${logs.reset}, ${logs.c}(D)ebug${logs.reset}, ${logs.y}(W)arnings${logs.reset}, ${logs.r}(E)rrors${logs.reset}`, "H");
            process.exit(1);
        }
        if (args[0] == ".") {
            args[0] = "";
        }
        configLocation = __dirname + args[0];
    } else {
        configLocation = __dirname;
    }

    if (typeof args[1] !== "undefined") {
        argLoggingLevel = args[1];
    }
}

export function log(message, level, lineNumInp) {

    const e = new Error();
    const stack = e.stack.toString().split(/\r\n|\n/);
    let lineNum = '('+stack[2].split('/').pop();
    if (typeof lineNumInp !== "undefined") {
        lineNum = lineNumInp;
    }
    if (lineNum[lineNum.length - 1] !== ")") {
        lineNum += ")";
    }
    const timeNow = new Date();
    const hours = String(timeNow.getHours()).padStart(2, "0");
    const minutes = String(timeNow.getMinutes()).padStart(2, "0");
    const seconds = String(timeNow.getSeconds()).padStart(2, "0");
    const millis = String(timeNow.getMilliseconds()).padStart(3, "0");

    const timeString = `${hours}:${minutes}:${seconds}.${millis}`;

    if (typeof message === "undefined") {
        log(`Log message from line ${logs.p}${lineNum}${logs.reset} is not defined`, "E");
        return;
    } else if (typeof message !== "string") {
        log(`Log message from line ${logs.p}${lineNum}${logs.reset} is not a string so attemping to stringify`, "A");
        try {
            message = JSON.stringify(message, null, 4);
        } catch (e) {
            log(`Log message from line ${logs.p}${lineNum}${logs.reset} could not be converted to string`, "E");
        }
    }

    message = message.replace(/true/g, `${logs.g}true${logs.w}`);
    message = message.replace(/false/g, `${logs.r}false${logs.w}`);
    message = message.replace(/null/g, `${logs.y}null${logs.w}`);
    message = message.replace(/undefined/g, `${logs.y}undefined${logs.w}`);
    message = message.replace(/[\r]/g, "");
    let messageArray = message.split(/[\r\n]/g);
    let customColor = logs.p;
    let customCatagory;
    let custom = false;
    if (Array.isArray(level)) {
        if (level.length > 2) {
            customColor = level[2];
        }
        customCatagory = level[1];
        level = level[0];
        custom = true;
    }

    for (let index = 0; index < messageArray.length; index++) {
        let message = messageArray[index];
        
        const regexp = / \((.*?):(.[0-9]*):(.[0-9]*)\)"/g;
        const matches = message.matchAll(regexp);
        for (const match of matches) {
            message = message.replace(match[0], `" [${logs.y}${match[1]}${logs.reset}] ${logs.p}(${match[2]}:${match[3]})${logs.reset}`);
        }
    
        let draw = false;
        let colour;
        let catagory = '';
        let showLineNum = debugLineNum;

        switch (level) {
            case "A":
            case "I":
                if (loggingLevel == "A") { //White
                    draw = true;
                    colour = logs.w;
                    catagory = "  INFO";
                }
                break;
            case "D":
                if (loggingLevel == "A" || loggingLevel == "D") { //Cyan
                    draw = true;
                    colour = logs.c;
                    catagory = " DEBUG";
                }
                break;
            case "S":
            case "N":
                if (loggingLevel == "A" || loggingLevel == "D") { //Blue
                    draw = true;
                    colour = logs.b;
                    catagory = "NETWRK";
                }
                break;
            case "W":
                if (loggingLevel != "E") { //Yellow
                    draw = true;
                    colour = logs.y;
                    catagory = "  WARN";
                }
                break;
            case "E": //Red
                colour = logs.r;
                catagory = " ERROR";
                draw = true;
                break;
            case "H": //Green
                colour = logs.g;
                catagory = "  HELP";
                draw = true;
                showLineNum = false;
                break;
            case "C":
            default: //Green
                draw = true;
                colour = logs.g;
                catagory = "  CORE";
        }
    
        let lineNumString = ` ${logs.p}${lineNum}${logs.reset}`;
        if (Array.isArray(level)) {
            if (level.length > 3) {
                if (!level[3]) {
                    debugLineNum = false;
                }
            }
        }
        if (showLineNum == false || showLineNum == "false") {
            lineNumString = ``;
        }
        let seperator = ':';
        if (custom) {
            colour = customColor;
            catagory = customCatagory;
            while (catagory.length < 6) {
                catagory = ' ' + catagory
            }
            if (catagory == '' || catagory == '      ') seperator = '|'
        }
        if (index !== 0) {
            lineNumString = ``;
            let newCatagory = '';
            for (let index = 0; index < catagory.length; index++) {
                newCatagory += ' ';
            }
            catagory = newCatagory;
            seperator = '|';
        }
        if (draw) {
            logSend(`${logs.reset}[${timeString}]${colour} ${catagory}${seperator} ${logs.w}${message}${lineNumString}`);
            return `${logs.reset}[${timeString}]${colour} ${catagory}${seperator} ${logs.w}${message}${lineNumString}`
        }
    }
}

export function logObj (message, obj, level) {
    const e = new Error();
    const stack = e.stack.toString().split(/\r\n|\n/);
    let lineNum = '('+stack[2].split('/').pop();

    let combined;
    if (typeof message === 'undefined') {
        message = 'Logged object';
    }
    if (obj instanceof Error) {
        log(obj.stack, level, lineNum);
    } else {
        combined = `${message}: ${JSON.stringify(obj, null, 4)}`;
        log(combined, level, lineNum);
    }
}

export function logFile (msg, sync = false) {
    if (createLogFile) {
        const dir = `${configLocation}/logs`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true
            });
        }

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        const fileName = `${dir}/${logsFileName}-[${yyyy}-${mm}-${dd}].log`;
        const data = msg.replaceAll(logs.r, "").replaceAll(logs.g, "").replaceAll(logs.y, "").replaceAll(logs.b, "").replaceAll(logs.p, "").replaceAll(logs.c, "").replaceAll(logs.w, "").replaceAll(logs.reset, "").replaceAll(logs.dim, "").replaceAll(logs.bright, "") + "\n";

        if (sync) {
            try {
                fs.appendFileSync(fileName, data);
            } catch (error) {
                createLogFile = false;
                log("Could not write to log file, permissions?", "E");
            }
        } else {
            fs.appendFile(fileName, data, err => {
                if (err) {
                    createLogFile = false;
                    log("Could not write to log file, permissions?", "E");
                }
            });
        }
    }
}

function logSend(message) {
    if (paused) return
    logFile(message);
    console.log(message);
    logEvent.emit('logSend', message);
}

function logForced(message, level, lineNumInp) {
    const output = log(message, level, lineNumInp)
    if (paused) {
        logFile(output);
        console.log(output);
        logEvent.emit('logSend', output);
    }
}

function pause() {
    logEvent.emit('logPause')
    paused = true
}

function resume() {
    paused = false
    logEvent.emit('logResume')
}