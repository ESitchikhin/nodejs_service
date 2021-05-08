import {IAreaPhoto, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import ejs from "ejs";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import {TArea, TMedia} from "../../entities/storedData";
import {randomString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import {logger} from "../../../utils/logger";

export class HTMLAreaPhoto extends HTMLInfoBlock implements IAreaPhoto{
	photos: TMedia[];
	isGreyscale: boolean;

	constructor(options: TOptionsIBCreator, areaData: TArea, isGreyscale) {
		super(options);
		this.photos = areaData.areaPhotos;
		this.isGreyscale = isGreyscale;
	}

	async generateHtmlResult(): Promise<void> {
		/*const photos: string[] = [
			'/static/img/tmp/bp-REzGSZX6.jpg',
			'/static/img/tmp/bp-Z5pz8Q56.jpg',
			'/static/img/tmp/bp-MX9KH5bZ.jpg',
			'/static/img/tmp/bp-zmd7RASN.jpg',
			'/static/img/tmp/bp-TSN6Da5b.jpg',
			'/static/img/tmp/bp-k849h7mA.jpg',
			'/static/img/tmp/bp-sBnxP66x.jpg',
			'/static/img/tmp/bp-GeEaZeFA.jpg',
			'/static/img/tmp/bp-SmeFwHW8.jpg',
		];*/
		const photos: string[] = [];
		const requestConfig: AxiosRequestConfig = {
			method: 'get',
			baseURL: process.env.MEDIA_SERVICE,
			url: '',
			responseType: 'stream',
		}
		for(const photo of this.photos) {
			const photoFile =`/static/img/tmp/a-${randomString(8)}.jpg`;
			const fullPath = path.join(process.cwd(), photoFile);

			requestConfig.url = photo.url;

			try {
				const response = await axios(requestConfig);
				await response.data.pipe(fs.createWriteStream(fullPath));
				photos.push(photoFile);
			} catch (err) {
				logger.errorLog(err);
			}
		}

		const pageParams = {
			photos,
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
