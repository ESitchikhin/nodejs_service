import {IAreaSchema, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import ejs from "ejs";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import {TArea, TMedia} from "../../entities/storedData";
import {randomString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import {logger} from "../../../utils/logger";

export class HTMLAreaSchema extends HTMLInfoBlock implements IAreaSchema {
	schema: TMedia;
	floor: string;

	constructor(options: TOptionsIBCreator, areaData: TArea) {
		super(options);
		this.schema = areaData.areaSchema;
		this.floor = areaData.areaCommercial.floor;
	}

	async generateHtmlResult(): Promise<void> {
		let areaSchema: string = '/static/img/tmp/bp-REzGSZX6.jpg';

		const requestConfig: AxiosRequestConfig = {
			method: 'get',
			baseURL: process.env.MEDIA_SERVICE,
			url: '',
			responseType: 'stream',
		}
		if(this.schema && this.schema.url !== '') {
			const photoFile =`/static/img/tmp/schema-${randomString(8)}.jpg`;
			const fullPath = path.join(process.cwd(), photoFile);

			requestConfig.url = this.schema.url;

			try {
				const response = await axios(requestConfig);
				await response.data.pipe(fs.createWriteStream(fullPath));
				areaSchema = photoFile;
			} catch (err) {
				logger.errorLog(err);
			}
		}

		const pageParams = {
			floor: this.floor,
			areaSchema,
		}

		this.htmlResult = await new Promise<any | null>(resolve => {

			ejs.renderFile(this.htmlDoc, pageParams, (err, html) => {
				if (err) {
					logger.errorLog(`Невозможно открыть файл ${this.htmlDoc}`);
				} else {
					let renderHtml = html.replace(/img src=\"/g, 'img src="file://' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/link href=\"/g, 'link href="file://' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/url\(\"/g, 'url("file://' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/url\('/g, 'url(\'file://' + path.join(process.cwd()));
					resolve(renderHtml);
				}
			});
		});

		this.isGenerated = true;
	}

}
