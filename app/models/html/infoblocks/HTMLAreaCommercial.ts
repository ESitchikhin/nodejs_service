import {IAreaCommercial, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import {TArea, TCommercialParam, TCommercialTerms} from "../../entities/storedData";
import ejs from "ejs";
import {RealtyObjectInfoFeatures, TCustomer} from "../../entities/inputData";
import {unitFormat} from "../../../utils/unit-format";
import {formattedDate} from "../../../utils/dates";
import {randomString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import sharp from "sharp";
import {logger} from "../../../utils/logger";

export class HTMLAreaCommercial extends HTMLInfoBlock implements IAreaCommercial{
	areaCommercial: {
		isNdsInclude: boolean,
		operationType: string,
		purpose: string,
		layout: string,
		terms: TCommercialTerms[],
		params: TCommercialParam[],
		areaFeatures: string[],
		state: string,
		floor: string,
		pricePerMonth: string,
		priceTotal: string,
		pricePerSquare: string,
	};
	areaPrimaryPhoto: {
		url: string,
		name: string,
	};

	constructor(options: TOptionsIBCreator, areaData: TArea) {
		super(options);
		this.areaCommercial = areaData.areaCommercial;
		this.areaPrimaryPhoto = areaData.areaPrimaryPhoto;
	}

	async generateHtmlResult(): Promise<void> {


		// Обработка прайм-фото
		const rndName = randomString(8);
		const mainPhotoFile =`/static/img/tmp/a-main-${rndName}.jpg`;
		const processedPhotoFile =`/static/img/tmp/a-mp-${rndName}.jpg`;

		if(this.areaPrimaryPhoto.url.length > 0) {
			const requestConfig: AxiosRequestConfig = {
				method: 'get',
				baseURL: process.env.MEDIA_SERVICE,
				url: this.areaPrimaryPhoto.url,
				responseType: 'stream',
			}

			const fullPath = path.join(process.cwd(), mainPhotoFile);
			const processedFullPath = path.join(process.cwd(), processedPhotoFile);

			try {
				const response = await axios(requestConfig);
				response.data.pipe(fs.createWriteStream(fullPath));
				let i = 0;
				while (!response.data.complete && i < 20) {
					i = await new Promise(resolve => setTimeout(() => resolve(i + 1), 50));
				}
				await sharp(fullPath).greyscale().toFile(processedFullPath);
			} catch (err) {
				logger.errorLog(err);
			}
		}

		const pageParams = {
			areaPatternSrc: this.areaPrimaryPhoto.url.length > 0 ? processedPhotoFile : '/static/img/areaCommercialTemplate526.jpg',
			...this.areaCommercial,
		}

		this.htmlResult = await new Promise<any | null>(resolve => {

			ejs.renderFile(this.htmlDoc, pageParams, (err, html) => {
				if (err) {
					logger.errorLog(`Невозможно открыть файл ${this.htmlDoc}`);
				}
				let renderHtml = html.replace(/img src=\"/g, 'img src="file://' + path.join(process.cwd()));
				renderHtml = renderHtml.replace(/link href=\"/g, 'link href="file://' + path.join(process.cwd()));
				renderHtml = renderHtml.replace(/url\(\"/g, 'url("file://' + path.join(process.cwd()));
				renderHtml = renderHtml.replace(/url\('/g, 'url(\'file://' + path.join(process.cwd()));
				resolve(renderHtml);

			});
		});

		this.isGenerated = true;
	}

}
