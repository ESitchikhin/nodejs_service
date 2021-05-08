import path from 'path';
import fs from 'fs';
import {formattedDate} from './dates';

/**
 * Формат логирования:
 * [13.11.2020 13:32.212]: <message_1> | <message_2> | <message_3>
 *
 * Если передан объект - он приводится к JSON, любой другой формат
 * приводится к строке методом .toString()
 *
 */
class Logger {
	errorLogFile: string;
	defaultLogFile: string;

	constructor() {
		this.errorLogFile = path.join(__dirname, '../../logs', (process.env.LOG_ERROR || 'error.log'));
		this.defaultLogFile = path.join(__dirname, '../../logs', (process.env.DEFAULT_ERROR || 'common_log.log'));
	}

	async errorLog(...args: any[]) {
		const fileName = this.errorLogFile;
		await this.log(fileName, args);
	}

	async logTo(fileName, ... args) {
		let logFile: string = '';
		if(fileName) {
			logFile = path.join(__dirname, '../../logs', fileName === 'default' ? 'error.log' : fileName);
		} else {
			logFile = this.defaultLogFile;
		}
		await this.log(logFile, args);
	}

	// Создание сообщения и запись в файл
	private async log(fileName, ... args) {
		if(args.length === 0) return 0;
		const now = new Date();

		let logMessage = `\n[${formattedDate(now, 'full_time')}]: `;
		for(const key in args) {
			let msg = args[key].toString();
			if(typeof msg === 'object') {
				msg = JSON.stringify(msg, null, 4);
			}
			logMessage += (Number(key) > 0 ? ` | ` : '') + `${msg}`;
		}
		try {
			fs.appendFileSync(fileName, logMessage);
		} catch(err) {
			logger.errorLog(err);
		}
	}

}

export const logger = new Logger();

