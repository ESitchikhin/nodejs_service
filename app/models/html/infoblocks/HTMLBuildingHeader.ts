import {IBuildingHeader, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import ejs from "ejs";
import sharp from 'sharp';
import {TBuilding, TFeature} from "../../entities/storedData";
import axios, {AxiosRequestConfig} from "axios";
import {randomString} from "../../../utils/string-utils";
import fs from "fs";
import {logger} from "../../../utils/logger";

export class HTMLBuildingHeader extends HTMLInfoBlock implements IBuildingHeader{
	mainPhotoFile: {
		name: string,
		url: string
	};
	prefix: string;
	name: string;
	location: string;
	isSubway: boolean;
	subwayStations: string;
	roads: string;
	features: TFeature[];

	constructor(options: TOptionsIBCreator, buildingData: TBuilding) {
		super(options);
		this.mainPhotoFile = buildingData.buildingPrimaryPhoto;
		this.prefix = buildingData.buildingHeader.prefix;
		this.name = buildingData.buildingHeader.name;
		this.location = buildingData.buildingLocation.location;
		this.isSubway = !!buildingData.buildingLocation.isSubway;
		this.subwayStations = buildingData.buildingLocation.subwayStations;
		this.roads = buildingData.buildingLocation.roads;
		this.features = buildingData.buildingHeader.features;
	}

	async generateHtmlResult(): Promise<void> {

		const rndName = randomString(8);
		const mainPhotoFile =`/static/img/tmp/b-main-${rndName}.jpg`;
		const processedPhotoFile =`/static/img/tmp/b-mp-${rndName}.jpg`;

		if(this.mainPhotoFile.url.length > 0) {
			const requestConfig: AxiosRequestConfig = {
				method: 'get',
				baseURL: process.env.MEDIA_SERVICE,
				url: this.mainPhotoFile.url,
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
			patternSrc: this.mainPhotoFile.url.length > 0 ? processedPhotoFile : '/static/img/buildingHeaderPattern.png',
			prefix: this.prefix,
			realtyName: this.name,
			location: this.location,
			isSubway: this.isSubway,
			subwayStations: this.subwayStations,
			roads: this.roads,
			features: this.features,
		}

		this.htmlResult = await new Promise<any | null>(resolve => {

			ejs.renderFile(this.htmlDoc, pageParams, (err, html) => {
				if (err) {
					logger.errorLog(`Невозможно открыть файл ${this.htmlDoc}`);
				}
				let renderHtml = html.replace(/img src=\"/g, 'img src="file://' + path.join(process.cwd()));
				renderHtml = renderHtml.replace(/link href=\"/g, 'link href="file://' + path.join(process.cwd()));
				renderHtml = renderHtml.replace(/url\(\"/g, 'url("file://' + path.join(process.cwd()));

				resolve(renderHtml);

			});
		});

		this.isGenerated = true;
	}

}
