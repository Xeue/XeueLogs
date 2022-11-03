import fs from 'fs'
import path from 'path'
import process from 'node:process'
import {fileURLToPath} from 'url'
import figlet from 'figlet'
import EventEmitter from 'events'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export let createLogFile = true
export let logsFileName = 'Test'
export let configLocation = __dirname
export let loggingLevel = 'A'
export let debugLineNum = true
export const logEvent = new EventEmitter()
let paused = false
let doneHeader = false


export let logs = {
	printHeader: printHeader,
	setConf: setConf,
	log: log,
	object: logObj,
	file: logFile,
	pause: pause,
	resume: resume,
	force: logForced,
	input: input,
	silentInput: silentInput,
	select: select,
	error: error,
	warn: warn,
	debug: debug,
	use: (logger) => {
		logs = logger
	},

	r: '\x1b[31m', //red
	g: '\x1b[32m', //green
	y: '\x1b[33m', //yellow
	b: '\x1b[34m', //blue
	p: '\x1b[35m', //pruple
	c: '\x1b[36m', //cyan
	w: '\x1b[37m', //white
	black: '\x1b[30m', //black
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	bright: '\x1b[1m',
	underline: '\x1b[4m',

	FgBlack: '\x1b[30m',
	FgRed: '\x1b[31m',
	FgGreen: '\x1b[32m',
	FgYellow: '\x1b[33m',
	FgBlue: '\x1b[34m',
	FgMagenta: '\x1b[35m',
	FgCyan: '\x1b[36m',
	FgWhite: '\x1b[37m',

	BgBlack: '\x1b[40m',
	BgRed: '\x1b[41m',
	BgGreen: '\x1b[42m',
	BgYellow: '\x1b[43m',
	BgBlue: '\x1b[44m',
	BgMagenta: '\x1b[45m',
	BgCyan: '\x1b[46m',
	BgWhite: '\x1b[47m',

	createLogFile: createLogFile,
	logsFileName: logsFileName,
	configLocation: configLocation,
	loggingLevel: loggingLevel,
	debugLineNum: debugLineNum
}

function printHeader(text) {
	if (doneHeader) return
	const asci = figlet.textSync(text, {
		font: 'Big',
		horizontalLayout: 'fitted',
		verticalLayout: 'fitted'
	})
	console.log(asci)
	logFile(asci, true)
	doneHeader = true
}

function setConf(conf) {
	createLogFile = conf?.createLogFile
	logsFileName = conf?.logsFileName
	configLocation = conf?.configLocation
	loggingLevel = conf?.loggingLevel
	debugLineNum = conf?.debugLineNum
}

export function log(message, level, lineNumInp) {

	const e = new Error()
	const stack = e.stack.toString().split(/\r\n|\n/)
	let lineNum = '('+stack[2].split('/').pop()
	if (typeof lineNumInp !== 'undefined') {
		lineNum = lineNumInp
	}
	if (lineNum[lineNum.length - 1] !== ')') {
		lineNum += ')'
	}
	const timeNow = new Date()
	const hours = String(timeNow.getHours()).padStart(2, '0')
	const minutes = String(timeNow.getMinutes()).padStart(2, '0')
	const seconds = String(timeNow.getSeconds()).padStart(2, '0')
	const millis = String(timeNow.getMilliseconds()).padStart(3, '0')

	const timeString = `${hours}:${minutes}:${seconds}.${millis}`

	if (typeof message === 'undefined') {
		log(`Log message from line ${logs.p}${lineNum}${logs.reset} is not defined`, 'E')
		return
	} else if (typeof message !== 'string') {
		log(`Log message from line ${logs.p}${lineNum}${logs.reset} is not a string so attemping to stringify`, 'E')
		try {
			message = JSON.stringify(message, null, 4)
		} catch (e) {
			log(`Log message from line ${logs.p}${lineNum}${logs.reset} could not be converted to string`, 'E')
			logs.object('Message', e, 'E')
			console.dir(message)
			return
		}
	}

	message = message.replace(/true/g, `${logs.g}true${logs.w}`)
	message = message.replace(/false/g, `${logs.r}false${logs.w}`)
	message = message.replace(/null/g, `${logs.y}null${logs.w}`)
	message = message.replace(/undefined/g, `${logs.y}undefined${logs.w}`)
	message = message.replace(/[\r]/g, '')
	let messageArray = message.split(/[\r\n]/g)
	let customColor = logs.p
	let customCatagory
	let custom = false
	if (Array.isArray(level)) {
		if (level.length > 2) {
			customColor = level[2]
		}
		customCatagory = level[1]
		level = level[0]
		custom = true
	}
	let returnArray = []
	for (let index = 0; index < messageArray.length; index++) {
		let message = messageArray[index]
        
		const regexp = / \((.*?):(.[0-9]*):(.[0-9]*)\)"/g
		const matches = message.matchAll(regexp)
		for (const match of matches) {
			message = message.replace(match[0], `" [${logs.y}${match[1]}${logs.reset}] ${logs.p}(${match[2]}:${match[3]})${logs.reset}`)
		}
    
		let draw = false
		let colour
		let catagory = ''
		let showLineNum = debugLineNum

		switch (level) {
		case 'A':
		case 'I':
			if (loggingLevel == 'A') { //White
				draw = true
				colour = logs.w
				catagory = '  INFO'
			}
			break
		case 'D':
			if (loggingLevel == 'A' || loggingLevel == 'D') { //Cyan
				draw = true
				colour = logs.c
				catagory = ' DEBUG'
			}
			break
		case 'S':
		case 'N':
			if (loggingLevel == 'A' || loggingLevel == 'D') { //Blue
				draw = true
				colour = logs.b
				catagory = 'NETWRK'
			}
			break
		case 'W':
			if (loggingLevel != 'E') { //Yellow
				draw = true
				colour = logs.y
				catagory = '  WARN'
			}
			break
		case 'E': //Red
			colour = logs.r
			catagory = ' ERROR'
			draw = true
			break
		case 'H': //Green
			colour = logs.g
			catagory = '  HELP'
			draw = true
			showLineNum = false
			break
		case 'C':
		default: //Green
			draw = true
			colour = logs.g
			catagory = '  CORE'
		}
    
		let lineNumString = ` ${logs.p}${lineNum}${logs.reset}`
		if (Array.isArray(level)) {
			if (level.length > 3) {
				if (!level[3]) {
					debugLineNum = false
				}
			}
		}
		if (showLineNum == false || showLineNum == 'false') {
			lineNumString = ''
		}
		let seperator = ':'
		if (custom) {
			colour = customColor
			catagory = customCatagory
			while (catagory.length < 6) {
				catagory = ' ' + catagory
			}
			if (catagory == '' || catagory == '      ') seperator = '|'
		}
		if (index !== 0) {
			lineNumString = ''
			let newCatagory = ''
			for (let index = 0; index < catagory.length; index++) {
				newCatagory += ' '
			}
			catagory = newCatagory
			seperator = '|'
		}
		if (draw) {
			logSend(`${logs.reset}[${timeString}]${colour} ${catagory}${seperator} ${logs.w}${message}${lineNumString}`)
			returnArray.push(`${logs.reset}[${timeString}]${colour} ${catagory}${seperator} ${logs.w}${message}${lineNumString}`)
		}
	}
	return returnArray.join('\n')
}

export function logObj (message, obj, level, lineNumInp) {
	let lineNum
	if (typeof lineNumInp !== 'undefined') {
		lineNum = lineNumInp
	} else {
		const e = new Error()
		const stack = e.stack.toString().split(/\r\n|\n/)
		lineNum = '('+stack[2].split('/').pop()
	}
    
	let combined
	if (typeof message === 'undefined') {
		message = 'Logged object'
	}
	if (obj instanceof Error) {
		log(obj.stack, level, lineNum)
	} else {
		try {
			combined = `${message}: ${JSON.stringify(obj, null, 4)}`
		} catch (error) {
			log(message, level, lineNum)
			combined = obj
		}
		log(combined, level, lineNum)
	}
}

export function logFile (msg, sync = false) {
	if (createLogFile) {
		const dir = `${configLocation}/logs`

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, {
				recursive: true
			})
		}

		const today = new Date()
		const dd = String(today.getDate()).padStart(2, '0')
		const mm = String(today.getMonth() + 1).padStart(2, '0')
		const yyyy = today.getFullYear()

		const fileName = `${dir}/${logsFileName}-[${yyyy}-${mm}-${dd}].log`
		const data = msg.replaceAll(logs.r, '').replaceAll(logs.g, '').replaceAll(logs.y, '').replaceAll(logs.b, '').replaceAll(logs.p, '').replaceAll(logs.c, '').replaceAll(logs.w, '').replaceAll(logs.reset, '').replaceAll(logs.dim, '').replaceAll(logs.bright, '') + '\n'

		if (sync) {
			try {
				fs.appendFileSync(fileName, data)
			} catch (error) {
				createLogFile = false
				log('Could not write to log file, permissions?', 'E')
			}
		} else {
			fs.appendFile(fileName, data, err => {
				if (err) {
					createLogFile = false
					log('Could not write to log file, permissions?', 'E')
				}
			})
		}
	}
}

function logSend(message, force = false) {
	if (paused && !force) return
	logFile(message)
	console.log(message)
	logEvent.emit('logSend', message)
}

function logForced(message, level, lineNumInp) {
	const output = log(message, level, lineNumInp)
	if (!paused) return
	logSend(output, true)
}

function error(message, object) {
	const e = new Error()
	const stack = e.stack.toString().split(/\r\n|\n/)
	let lineNum = '('+stack[2].split('/').pop()
	logSwitch(message, object, 'E', lineNum)
}
function debug(message, object) {
	const e = new Error()
	const stack = e.stack.toString().split(/\r\n|\n/)
	let lineNum = '('+stack[2].split('/').pop()
	logSwitch(message, object, 'D', lineNum)
}
function warn(message, object) {
	const e = new Error()
	const stack = e.stack.toString().split(/\r\n|\n/)
	let lineNum = '('+stack[2].split('/').pop()
	logSwitch(message, object, 'W', lineNum)
}

function logSwitch(message, object, level, lineNum) {
	let text
	switch (level) {
	case 'E':
		text = 'Error'
		break
	case 'W':
		text = 'Warning'
		break
	case 'D':
		text = 'Debug'
		break
	default:
		break
	}
	if (typeof message !== 'undefined' && typeof object !== 'undefined') {
		logObj(message, object, level, lineNum)
	} else if (typeof message !== 'undefined' && typeof object === 'undefined') {
		log(message, level, lineNum)
	} else if (typeof message === 'undefined' && typeof object !== 'undefined') {
		logObj(text, object, level, lineNum)
	} else {
		log(`It looks like an unspecified: ${text} has been called`, level, lineNum)
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

function parseInput(input, backup) {
	let output
	try {
		output = JSON.parse(input)
	} catch (error) {
		output = input
	}
	if ((output === '' || typeof output === 'undefined') && typeof backup !== 'undefined') {
		output = backup
	}
	return output
}

function select(list, current, seperatorColour = logs.c, textColour = logs.c) {

	function printSelected(moveCursor = true) {
		let options = []
		list.forEach((option, index) => {
			switch (option) {
			case true:
				option = `${logs.g}${option}`
				break
			case false:
				option = `${logs.r}${option}`
				break
			case undefined:
			case null:
				option = `${logs.y}${option}`
				break
			}
			if (index == selected) {
				options.push(`${logs.reset}${logs.underline}${option}${logs.reset}${logs.dim}`)
			} else {
				options.push(`${logs.dim}${option}`)
			}
		})
		if (moveCursor) readline.moveCursor(process.stdout, 0, -1)
		console.log(`${logs.reset}[ ${logs.c}User Input${logs.w} ]       ${seperatorColour}: ${logs.reset}${options.join(',')}`)
	}

	let selected = list.indexOf(current)
	printSelected(false)

	const promise = new Promise((resolve) => {
		const stdin = process.stdin
		stdin.setRawMode(true)
		stdin.resume()
		stdin.setEncoding('utf8')
		
		stdin.on('keypress', function(letter, key){
			switch (key.name) {
			case 'right': //Right
				if (selected < list.length - 1) {
					selected++
					printSelected()
				}
				break
			case 'left': //Left
				if (selected > 0) {
					selected--
					printSelected()
				}
				break
			case 'c': //Stop code
				if (key.ctrl) process.exit()
				break
			case 'return': //Enter
				stdin.removeAllListeners('keypress')
				readline.moveCursor(process.stdout, 0, -1)
				readline.clearLine(process.stdout, 1)
				console.log(`${logs.reset}[ ${logs.c}User Input${logs.w} ]       ${seperatorColour}| ${textColour}${list[selected]}${logs.reset}`)
				resolve(list[selected])
				break
			default:
				log(key.name)
				break
			}
		})
	})

	return promise
}

function input(placeholder, seperatorColour = logs.c, textColour = logs.c) {
	const userInput = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: `${logs.reset}[ ${logs.c}User Input${logs.w} ]       ${seperatorColour}: ${textColour}`
	})
	const promise = new Promise ((resolve)=>{
		if (typeof placeholder !== 'undefined') {
			console.log(`${logs.reset}[ ${logs.c}User Input${logs.w} ]       ${seperatorColour}: ${logs.reset}${logs.dim}${placeholder}${logs.reset}${textColour}`)
			readline.moveCursor(process.stdout, 0, -1)
			readline.moveCursor(process.stdout, 23, 0)
		} else {
			console.log(`${logs.reset}[ ${logs.c}User Input${logs.w} ]       ${seperatorColour}: ${textColour}`)
			readline.moveCursor(process.stdout, 0, -1)
			readline.moveCursor(process.stdout, 23, 0)
		}
		userInput.on('line', async (input)=>{
			userInput.close()
			const output = parseInput(input, placeholder)
			readline.moveCursor(process.stdout, 0, -1)
			readline.clearLine(process.stdout, 1)
			logSend(`${logs.reset}[ ${logs.c}User Input${logs.w} ]       ${seperatorColour}| ${textColour}${output}${logs.reset}`, true)
			resolve(output)
		})
	})
	return [promise, userInput]
}

function silentInput() {
	const userInput = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	})
	const promise = new Promise ((resolve)=>{
		userInput.on('line', async (input)=>{
			userInput.close()
			const output = parseInput(input)
			readline.moveCursor(process.stdout, 0, -1)
			readline.clearLine(process.stdout, 1)
			resolve(output)
		})
	})
	return [promise, userInput]
}