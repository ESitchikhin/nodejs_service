import sharp from "sharp";

import {IBuildingLocation, TOptionsIBCreator} from "../../entities/entities";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import {TBuilding} from "../../entities/storedData";
import ejs from "ejs";
import path from "path";
import axios, {AxiosRequestConfig} from 'axios';
import fs from 'fs';
import {randomString} from "../../../utils/string-utils";
import {unitFormat} from "../../../utils/unit-format";
import {TAllInfrastructures} from "../../entities/inputData";
import {logger} from "../../../utils/logger";

export class HTMLBuildingLocation extends HTMLInfoBlock implements IBuildingLocation{
	location: string;
	isSubway: boolean;
	roads: string;
	distance: number;
	subwayStations: string;
	description: string;
	infrastructure: {key: TAllInfrastructures, svg: string}[];
	map;

	constructor(options: TOptionsIBCreator, buildingData: TBuilding) {
		super(options);
		this.location = buildingData.buildingLocation.location;
		this.isSubway = buildingData.buildingLocation.isSubway;
		this.subwayStations = buildingData.buildingLocation.subwayStations;
		this.roads = buildingData.buildingLocation.roads;
		this.distance = buildingData.buildingLocation.distance;
		this.description = buildingData.buildingLocation.description;
		this.map = {
			lat: buildingData.buildingLocation.map.lat,
			lng:  buildingData.buildingLocation.map.lng
		}
		this.infrastructure = buildingData.buildingLocation.infrastructure;
	}

	async generateHtmlResult(): Promise<void> {

		const mapFile = `/static/img/tmp/map-${randomString(8)}.png`;
		const mapFileProcessed = `/static/img/tmp/mapproc-${randomString(8)}.png`;
		const fullPathMapFile = path.join(process.cwd(), mapFile);
		const fullPathMapProcessed = path.join(process.cwd(), mapFileProcessed);
		const key = process.env.GOOGLE_API_KEY;

		const requestConfig: AxiosRequestConfig = {
			method: 'get',
			url: 'https://maps.googleapis.com/maps/api/staticmap',
			responseType: 'stream',
			params: {
				center: `${this.map.lat}, ${this.map.lng}`,
				size: '314x595',
				language: 'ru-ru',
				format: 'png',
				zoom: 13,
				scale: 2,
				key,
				maptype: 'roadmap',
			}
		}

		try {
			const response = await axios(requestConfig);
			await response.data.pipe(fs.createWriteStream(fullPathMapFile));
		} catch (err) {
			logger.errorLog(err);
		}

		try {
			const response = await axios(requestConfig);
			await response.data.pipe(fs.createWriteStream(fullPathMapFile));
			let i = 0;
			while (!response.data.complete && i < 20) {
				i = await new Promise(resolve => setTimeout(() => resolve(i + 1), 50));
			}
			await sharp(fullPathMapFile).greyscale().toFile(fullPathMapProcessed);
		} catch (err) {
			logger.errorLog(err);
		}



		// let mapFile = '/static/img/tmp/map-Tdgs2Ts.jpg'
		let baseDistance = this.distance;
		let distance = '';
		let distanceUnit = '';

		if(baseDistance >= 1000) {
			baseDistance = baseDistance - baseDistance % 100;
			distance = '~' + unitFormat({})(baseDistance/1000);
			distanceUnit = 'км';
		} else {
			baseDistance = baseDistance - baseDistance % 50;
			distance = '~' + unitFormat({})(baseDistance);
			distanceUnit = 'метров';
		}

		const infrastructure = this.infrastructure.map(value => value.svg);

		const pageParams = {
			distance,
			distanceUnit,
			infrastructure,
			location: this.location,
			subwayStations: this.subwayStations,
			isSubway: this.isSubway,
			description: this.description,
			mapFileSrc: mapFileProcessed,
		}

		this.htmlResult = await new Promise<any | null>(resolve => {

			ejs.renderFile(this.htmlDoc, pageParams, (err, html) => {
				if (err) {
					logger.errorLog(`Невозможно открыть файл ${this.htmlDoc}`);
				}
				const renderHtml = html

				/*.replace(/img src=\"/g, 'img src="file://localhost' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/link href=\"/g, 'link href="file://localhost' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/src: url\(\"/g, 'src: url("file://localhost' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/src: url\(\'/g, 'src: url(\'file://localhost' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/ url\(\"/g, ' url(\"file://localhost' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/ url\('/g, ' url(\'file://localhost' + path.join(process.cwd()));*/

				resolve(renderHtml);

			});
		});

		this.isGenerated = true;
	}


}
