import {IBuildingPhoto, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import {TBuilding, TMedia} from "../../entities/storedData";
import ejs from "ejs";
import {randomString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import {logger} from "../../../utils/logger";

export class HTMLBuildingPhoto extends HTMLInfoBlock implements IBuildingPhoto{
	photos: TMedia[];
	isGreyscale: boolean

	constructor(options: TOptionsIBCreator, buildingData: TBuilding, isGreyscale) {
		super(options);
		this.photos = buildingData.buildingPhotos;
		this.isGreyscale = isGreyscale;
	}

	async generateHtmlResult(): Promise<void> {
		const photos: string[] = [];
		const requestConfig: AxiosRequestConfig = {
			method: 'get',
			baseURL: process.env.MEDIA_SERVICE,
			url: '',
			responseType: 'stream',
		}
		for(const photo of this.photos) {
			const photoFile =`/static/img/tmp/b-${randomString(8)}.jpg`;
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
