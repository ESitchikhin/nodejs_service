import path from 'path';
import fs from 'fs';
import {logger} from "./logger";

export function getRootPath(envFlag: string = 'project'): string
{
	let resultPath: string;
	switch (envFlag.toLowerCase()) {
		case 'project':
			resultPath = path.join(process.cwd());
			break;
		case 'root':
			resultPath = '/';
			break;
		default:
			resultPath = path.join('/', envFlag);
			break;
	}

	return resultPath;
}

export function checkAndCreateFileDirectory(fileName: string): void
{
	const dir: string = path.dirname(fileName);
	if (!fs.existsSync(dir)) {
		fs.mkdir(dir, (err: any) => {
			if (err) {
				logger.errorLog(`Directory ${dir} doesn't created`);
				logger.errorLog(`ERROR: `, err);
			}
		});
	}
}
