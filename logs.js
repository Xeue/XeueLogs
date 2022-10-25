import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import figlet from 'figlet';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const r = "\x1b[31m"; //red
export const g = "\x1b[32m"; //green
export const y = "\x1b[33m"; //yellow
export const b = "\x1b[34m"; //blue
export const p = "\x1b[35m"; //pruple
export const c = "\x1b[36m"; //cyan
export const w = "\x1b[37m"; //white
export const reset = "\x1b[0m";
export const dim = "\x1b[2m";
export const bright = "\x1b[1m";
export let createLogFile = true;
export let logsFileName = "Test";
export let configLocation = __dirname;
export let loggingLevel = "A";
export let debugLineNum = true;
export const logEvent = new EventEmitter();


export const logs = {
    printHeader: printHeader,
    setConf: setConf,
    loadArgs: loadArgs,
    log: log,
    logObj: logObj,
    logFile: logFile,
    logSend: logSend,

    r: r,
    g: g,
    y: y,
    b: b,
    p: p,
    c: c,
    w: w,
    reset: reset,
    dim: dim,
    bright: bright,
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
            log(`The first argument is the relative path of the config file, eg (${y}.${reset}) or (${y}/Config1${reset})`, "H");
            log(`The second argument is the desired logging level ${w+dim}(A)ll${reset}, ${c}(D)ebug${reset}, ${y}(W)arnings${reset}, ${r}(E)rrors${reset}`, "H");
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
        log(`Log message from line ${p}${lineNum}${reset} is not defined`, "E");
        return;
    } else if (typeof message !== "string") {
        log(`Log message from line ${p}${lineNum}${reset} is not a string so attemping to stringify`, "A");
        try {
            message = JSON.stringify(message, null, 4);
        } catch (e) {
            log(`Log message from line ${p}${lineNum}${reset} could not be converted to string`, "E");
        }
    }

    message = message.replace(/true/g, g + "true" + w);
    message = message.replace(/false/g, r + "false" + w);
    message = message.replace(/null/g, y + "null" + w);
    message = message.replace(/undefined/g, y + "undefined" + w);
    message = message.replace(/[\r]/g, "");
    let messageArray = message.split(/[\r\n]/g);
    let customColor = p;
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
            message = message.replace(match[0], `" [${y}${match[1]}${reset}] ${p}(${match[2]}:${match[3]})${reset}`);
        }
    
        let draw = false;
        let colour;
        let catagory;
        let showLineNum = debugLineNum;

        switch (level) {
            case "A":
            case "I":
                if (loggingLevel == "A") { //White
                    draw = true;
                    colour = w;
                    catagory = "  INFO";
                }
                break;
            case "D":
                if (loggingLevel == "A" || loggingLevel == "D") { //Cyan
                    draw = true;
                    colour = c;
                    catagory = " DEBUG";
                }
                break;
            case "S":
            case "N":
                if (loggingLevel == "A" || loggingLevel == "D") { //Blue
                    draw = true;
                    colour = b;
                    catagory = "NETWRK";
                }
                break;
            case "W":
                if (loggingLevel != "E") { //Yellow
                    draw = true;
                    colour = y;
                    catagory = "  WARN";
                }
                break;
            case "E": //Red
                colour = r;
                catagory = " ERROR";
                draw = true;
                break;
            case "H": //Green
                colour = g;
                catagory = "  HELP";
                draw = true;
                showLineNum = false;
                break;
            case "C":
            default: //Green
                draw = true;
                colour = g;
                catagory = "  CORE";
        }
    
        let lineNumString = ` ${p}${lineNum}${reset}`;
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
        if (custom) {
            colour = customColor;
            catagory = customCatagory;
        }
        let seperator = ':';
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
            logSend(`[${timeString}]${colour} ${catagory}${seperator} ${w}${message}${lineNumString}`);
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
        combined = `${message}: ${obj.toString()}`;
    } else {
        combined = `${message}: ${JSON.stringify(obj, null, 4)}`;
    }
    log(combined, level, lineNum);
}

export function logSend (message) {
    logFile(message);
    console.log(message);
    logEvent.emit('logSend', message);
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
        const data = msg.replaceAll(r, "").replaceAll(g, "").replaceAll(y, "").replaceAll(b, "").replaceAll(p, "").replaceAll(c, "").replaceAll(w, "").replaceAll(reset, "").replaceAll(dim, "").replaceAll(bright, "") + "\n";

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