import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import {checkAndCreateFileDirectory, getRootPath} from '../utils/files';


const rootPath: string = process.env.ROOT_PATH ? getRootPath(process.env.ROOT_PATH) : getRootPath('project');
const baseDir: string = path.join(rootPath, process.env.BASE_LOG_DIR || '/logs');

const requestFileName = process.env.REQUEST_LOG_FILE || 'request.log';

let callbackUrl = process.env.CALLBACK_URL;
const callbackPort = process.env.CALLBACK_PORT;
if(!callbackUrl) {
	const argv =  process.argv;
	const namePosition = argv.findIndex(arg => arg.toLowerCase().indexOf('index') !== -1);
	if(namePosition !== -1 && argv.length >= namePosition + 2) {
		callbackUrl = argv[namePosition + 1];
	}
}
const paramSplit = callbackUrl.split('://');
const secret = process.env.SECRET ? process.env.SECRET : null;
const secretHeader = process.env.SECRET ? process.env.SECRET_HEADER : null;
export const config = {
	ports: {
		http: Number(process.env.HTTP_PORT) || 80,
		https: Number(process.env.HTTPS_PORT) || 443,
	},
	hosts: {
		http: process.env.HTTP_HOST || '0.0.0.0',
		https: process.env.HTTPS_HOST || '0.0.0.0',
	},
	protocol: process.env.PROTOCOL || 'http',
	ssl: {
		privateKey: process.env.PRIVATE_KEY || null,
		certificate: process.env.CERTIFICATE || null,
	},
	logs: {
		isLogged: process.env.IS_LOGGED === 'N',
		request: path.join(baseDir, requestFileName),
		error: path.join(baseDir, '../logs', (process.env.LOG_ERROR || 'error.log')),
	},
	callback: {
		url: paramSplit.length === 2 ? paramSplit[1] : undefined,
		port: callbackPort
			? callbackPort
			: (paramSplit[0] ? (paramSplit[0] === 'https' ? 443 : 80) : 8000),
		protocol: paramSplit.length === 2 ? paramSplit[0] : undefined,
	},
	secrets: {
		secret,
		secretHeader,
		clientId: process.env.CLIENT_ID,
		clientKey: process.env.CLIENT_KEY,
		clientIdHeader: process.env.CLIENT_ID_HEADER,
		clientKeyHeader: process.env.CLIENT_KEY_HEADER,
	}
}

checkAndCreateFileDirectory(config.logs.request);
