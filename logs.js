const fs = require('fs');
const process = require('node:process');
const figlet = require('figlet');
const EventEmitter = require('events');
const readline = require('readline');

class Logs extends EventEmitter {
	constructor(
		createLogFile = true,
		logsFileName = 'logs',
		configLocation = './',
		loggingLevel = 'D',
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
		this.loggingLevel = loggingLevel;
		this.debugLineNum = options.debugLineNum || false;
		this.paused = options.paused || false;
		this.doneHeader = options.doneHeader || false;
		this.template = options.template || '[$TIME][$LEVEL] $CATAGORY$SEPERATOR $MESSAGE $LINENUMBER';
		this.r = '\x1b[31m'; //red
		this.g = '\x1b[32m'; //green
		this.y = '\x1b[33m'; //yellow
		this.b = '\x1b[34m'; //blue
		this.p = '\x1b[35m'; //pruple
		this.c = '\x1b[36m'; //cyan
		this.w = '\x1b[37m'; //white
		this.black = '\x1b[30m'; //black
		this.reset = '\x1b[0m';
		this.dim = '\x1b[2m';
		this.bright = '\x1b[1m';
		this.underline = '\x1b[4m';
		this.FgBlack = '\x1b[30m';
		this.FgRed = '\x1b[31m';
		this.FgGreen = '\x1b[32m';
		this.FgYellow = '\x1b[33m';
		this.FgBlue = '\x1b[34m';
		this.FgMagenta = '\x1b[35m';
		this.FgCyan = '\x1b[36m';
		this.FgWhite = '\x1b[37m';
		this.BgBlack = '\x1b[40m';
		this.BgRed = '\x1b[41m';
		this.BgGreen = '\x1b[42m';
		this.BgYellow = '\x1b[43m';
		this.BgBlue = '\x1b[44m';
		this.BgMagenta = '\x1b[45m';
		this.BgCyan = '\x1b[46m';
		this.BgWhite = '\x1b[47m';
		readline.emitKeypressEvents(process.stdin);
	}

	printHeader(text) {
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

	setConf(conf) {
		this.createLogFile = conf?.createLogFile;
		this.logsFileName = conf?.logsFileName;
		this.configLocation = conf?.configLocation;
		this.loggingLevel = conf?.loggingLevel;
		this.debugLineNum = conf?.debugLineNum;
	}

	log(message, level, lineNumInp) {
		const lineNum = typeof lineNumInp !== 'undefined' ? lineNumInp : this.getLineNumber();
		const timeNow = new Date();
		const hours = String(timeNow.getHours()).padStart(2, '0');
		const minutes = String(timeNow.getMinutes()).padStart(2, '0');
		const seconds = String(timeNow.getSeconds()).padStart(2, '0');
		const millis = String(timeNow.getMilliseconds()).padStart(3, '0');
	
		const timeString = `${hours}:${minutes}:${seconds}.${millis}`;
	
		if (typeof message === 'undefined') {
			this.log(`Log message from line ${this.p}${lineNum}${this.reset} is not defined`, 'E');
			return;
		} else if (typeof message !== 'string' && typeof message !== 'boolean' && typeof message !== 'number') {
			this.log(`Log message from line ${this.p}${lineNum}${this.reset} is not a string so attemping to stringify`, 'E');
			try {
				message = JSON.stringify(message, null, 4);
			} catch (e) {
				this.log(`Log message from line ${this.p}${lineNum}${this.reset} could not be converted to string`, 'E');
				this.object('Message', e, 'E');
				console.dir(message);
				return;
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
		let customColor = this.p;
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
		let returnArray = [];
		for (let index = 0; index < messageArray.length; index++) {
			let message = messageArray[index];
			
			const regexp = / \((.*?):(.[0-9]*):(.[0-9]*)\)"/g;
			const matches = message.matchAll(regexp);
			for (const match of matches) {
				message = message.replace(match[0], `" [${this.y}${match[1]}${this.reset}] ${this.p}(${match[2]}:${match[3]})${this.reset}`);
			}
		
			let draw = false;
			let colour;
			let catagory = '';
			let showLineNum = this.debugLineNum;
	
			switch (level) {
			case 'A':
			case 'I':
				if (this.loggingLevel == 'A') { //White
					draw = true;
					colour = this.w;
					catagory = '  INFO';
				}
				break;
			case 'D':
				if (this.loggingLevel == 'A' || this.loggingLevel == 'D') { //Cyan
					draw = true;
					colour = this.c;
					catagory = ' DEBUG';
				}
				break;
			case 'S':
			case 'N':
				if (this.loggingLevel == 'A' || this.loggingLevel == 'D') { //Blue
					draw = true;
					colour = this.b;
					catagory = 'NETWRK';
				}
				break;
			case 'W':
				if (this.loggingLevel != 'E') { //Yellow
					draw = true;
					colour = this.y;
					catagory = '  WARN';
				}
				break;
			case 'E': //Red
				colour = this.r;
				catagory = ' ERROR';
				draw = true;
				break;
			case 'H': //Green
				colour = this.g;
				catagory = '  HELP';
				draw = true;
				showLineNum = false;
				break;
			case 'C':
			default: //Green
				draw = true;
				colour = this.g;
				catagory = '  CORE';
			}
		
			let lineNumString = `${lineNum}`;
			if (Array.isArray(level)) {
				if (level.length > 3) {
					if (!level[3]) {
						showLineNum = false;
					}
				}
			}
			if (showLineNum == false || showLineNum == 'false') {
				lineNumString = '';
			}
			let seperator = ':';
			if (custom) {
				colour = customColor;
				catagory = customCatagory;
				while (catagory.length < 6) {
					catagory = ' ' + catagory;
				}
				if (catagory == '' || catagory == '      ') seperator = '|';
			}
			if (index !== 0) {
				lineNumString = '';
				let newCatagory = '';
				for (let index = 0; index < catagory.length; index++) {
					newCatagory += ' ';
				}
				catagory = newCatagory;
				seperator = '|';
			}
			if (draw) {
				this.logSend({
					'timeString': timeString,
					'colour': colour,
					'level': level,
					'catagory': catagory,
					'textColour': this.w,
					'seperator': seperator,
					'message': message,
					'lineNumString': lineNumString
				});
				returnArray.push({
					'timeString': timeString,
					'colour': colour,
					'level': level,
					'catagory': catagory,
					'textColour': this.w,
					'seperator': seperator,
					'message': message,
					'lineNumString': lineNumString
				});
			}
		}
		return returnArray;
	}

	object(message, obj, level, lineNumInp) {
		let errorMessage = true;
		const lineNum = typeof lineNumInp !== 'undefined' ? lineNumInp : this.getLineNumber();
	
		if (typeof message === 'object') {
			if (typeof obj === 'string') {
				level = obj;
			}
			obj = message;
			message = undefined;
			errorMessage = false;
		}
		
		let combined;
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

	file(msg, sync = false) {
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
			const data = msg.replaceAll(this.r, '').replaceAll(this.g, '').replaceAll(this.y, '').replaceAll(this.b, '').replaceAll(this.p, '').replaceAll(this.c, '').replaceAll(this.w, '').replaceAll(this.reset, '').replaceAll(this.dim, '').replaceAll(this.bright, '') + '\n';
	
			if (sync) {
				try {
					fs.appendFileSync(fileName, data);
				} catch (error) {
					this.createLogFile = false;
					this.log('Could not write to log file, permissions?', 'E');
				}
			} else {
				fs.appendFile(fileName, data, err => {
					if (err) {
						this.createLogFile = false;
						this.log('Could not write to log file, permissions?', 'E');
					}
				});
			}
		}
	}

	logSend(msgObj, force = false) {
		if (this.paused && !force) return;
		let level = '•';
		let levelColour = this.g;
		switch (msgObj.level) {
		case 'A':
		case 'I':
			level = 'I';
			levelColour = this.dim;
			break;
		case 'S':
		case 'N':
		case 'D':
			level = 'D';
			levelColour = this.c;
			break;
		case 'U':
			level = 'U';
			levelColour = this.c;
			break;
		case 'W':
			level = 'W';
			levelColour = this.y;
			break;
		case 'E': //Red
			level = 'E';
			levelColour = this.r;
			break;
		case 'H': //Green
			level = 'H';
			levelColour = this.g;
			break;
		}
		msgObj.levelColour = levelColour;
		msgObj.level = level;

		const output = this.#paternDecompose(msgObj.timeString, level, msgObj.catagory, msgObj.seperator, msgObj.message, msgObj.lineNumString, msgObj.colour, msgObj.textColour, levelColour)

		this.file(output);
		readline.moveCursor(process.stdout, -5000, 0);
		//console.log(`${this.reset}[${msgObj.timeString}]${levelColour}${level}${this.reset}${msgObj.colour} ${msgObj.catagory}${msgObj.seperator} ${msgObj.textColour}${msgObj.message} ${this.p}${msgObj.lineNumString}${this.reset}`);
		console.log(output);
		this.emit('logSend', msgObj);
	}

	force(message, level, lineNumInp) {
		const messages = this.log(message, level, lineNumInp);
		if (!this.paused) return;
		messages.forEach(msg => this.logSend(msg, true));
	}

	info(message, object) {
		const lineNum = this.getLineNumber();
		this.logSwitch(message, object, 'I', lineNum);
	}

	debug(message, object) {
		const lineNum = this.getLineNumber();
		this.logSwitch(message, object, 'D', lineNum);
	}

	warn(message, object) {
		const lineNum = this.getLineNumber();
		this.logSwitch(message, object, 'W', lineNum);
	}

	error(message, object) {
		const lineNum = this.getLineNumber();
		this.logSwitch(message, object, 'E', lineNum);
	}

	logSwitch(message, object, level, lineNum) {
		let text;
		switch (level) {
		case 'E':
			text = 'Error';
			break;
		case 'W':
			text = 'Warning';
			break;
		case 'D':
			text = 'Debug';
			break;
		case 'I':
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

	parseInput(input, backup) {
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

	select(list, current, seperatorColour = this.c, textColour = this.c) {
		let hasDescription = false;
		let listPretty = {};
		
		if (!Array.isArray(list)) {
			hasDescription = true;
			[list, listPretty] = [Object.keys(list), list];
		}
	
		let selected = list.indexOf(current);
		if (selected == -1) {
			selected = list.indexOf(String(current));
		}

		const printSelected = (moveCursor = true) => {
			let options = [];
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
				const text = hasDescription ? listPretty[option] : option;
				if (index == selected) {
					options.push(`${this.reset}${this.underline}${colour}${text}${this.reset}${this.dim}`);
				} else {
					options.push(`${this.dim}${colour}${text}`);
				}
			});
			if (moveCursor) readline.moveCursor(process.stdout, 0, -1);
			console.log(this.#paternDecompose(' User Input ', 'U', '      ', ':', options.join(','), '', this.c, this.w, this.c));
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
						this.force('Process exited by user command', ['H','SERVER',this.r]);
						process.exit();
					}
					break;
				case 'return': {//Enter
					process.stdin.removeAllListeners('keypress');
					process.stdin.setRawMode(false);
					readline.moveCursor(process.stdout, 0, -1);
					readline.clearLine(process.stdout, 1);
					const text = hasDescription ? listPretty[list[selected]] : list[selected];
					this.logSend({
						'timeString': `${this.c}Data Entered${this.reset}`,
						'level': 'U',
						'colour': seperatorColour,
						'textColour': textColour,
						'catagory': '',
						'seperator': '      |',
						'message': text,
						'lineNumString': ''
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
			this.on('cancelInput', () => {
				resolve(false);
			});
		});
	}

	input(placeholder, seperatorColour = this.c, textColour = this.c) {
		const userInput = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: this.#paternDecompose(' User Input ', 'U', '      ', ':', '', '', this.c, this.w, this.c)
		});
		const promise = new Promise ((resolve)=>{
			if (typeof placeholder !== 'undefined') {
				const outputString = this.#paternDecompose(' User Input ', 'U', '      ', ':', placeholder, '', this.c, this.dim, this.c);
				console.log(outputString);
				const cusrsorPossition = outputString.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').search(placeholder) || 1;
				readline.moveCursor(process.stdout, 0, -1);
				readline.moveCursor(process.stdout, cusrsorPossition, 0);
			} else {
				const outputString = this.#paternDecompose(' User Input ', 'U', '      ', ':', '', '', this.c, this.dim, this.c);
				console.log(outputString);
				const cusrsorPossition = outputString.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').search(':') || 1;
				readline.moveCursor(process.stdout, 0, -1);
				readline.moveCursor(process.stdout, cusrsorPossition, 0);
			}
			userInput.on('line', async (input)=>{
				userInput.close();
				const output = this.parseInput(input, placeholder);
				readline.moveCursor(process.stdout, 0, -1);
				readline.clearLine(process.stdout, 1);
				this.logSend({
					'timeString': `${this.c}Data Entered${this.reset}`,
					'level': 'U',
					'colour': seperatorColour,
					'textColour': textColour,
					'catagory': '',
					'seperator': '      |',
					'message': output,
					'lineNumString': ''
				}, true);
				resolve(output);
			});
		});
		return [promise, userInput];
	}
	
	silentInput() {
		const userInput = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			prompt: ''
		});
		const promise = new Promise ((resolve)=>{
			userInput.on('line', async (input)=>{
				userInput.close();
				const output = this.parseInput(input);
				readline.moveCursor(process.stdout, 0, -1);
				readline.clearLine(process.stdout, 1);
				resolve(output);
			});
		});
		return [promise, userInput];
	}

	getLineNumber() {
		const error = new Error();
		const stack = error.stack.toString().split(/\r\n|\n/);
		let lineNum = '('+stack[3].split('\\').pop().split('/').pop();
		if (lineNum[lineNum.length - 1] !== ')') {
			lineNum += ')';
		}
		return lineNum;
	}

	#paternDecompose(time, level, catagory, seperator, message, lineNum, colour, textColour, levelColour) {
		let output = this.reset + this.template.replace('$TIME', `${this.reset}${time}${this.reset}`);
		output = output.replace('$LEVEL', `${levelColour}${level}${this.reset}`);
		output = output.replace('$CATAGORY', `${colour}${catagory}${this.reset}`);
		output = output.replace('$SEPERATOR', `${colour}${seperator}${this.reset}`);
		output = output.replace('$MESSAGE', `${textColour}${message}${this.reset}`);
		output = output.replace('$LINENUMBER', `${this.p}${lineNum}${this.reset}`);
		return output;
	}
}

module.exports.Logs = Logs;