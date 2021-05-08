import {PDFInfoBlock} from "./PDFInfoBlock";
import {IBuildingHeader, IBuildingLocation, TOptionsIBCreator} from "../../entities/entities";
import {TBuilding, TFeature} from "../../entities/storedData";
import SVGtoPDF from 'svg-to-pdfkit';
import path from "path";
import {randomString, splitString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import sharp from "sharp";
import {TAllInfrastructures} from "../../entities/inputData";
import {unitFormat} from "../../../utils/unit-format";
import {logger} from "../../../utils/logger";

type TPageParams = {
	distance: string,
	distanceUnit: string,
	infrastructure: string[],
	location: string,
	subwayStations: string,
	isSubway: boolean,
	description: string,
	mapFileSrc: string,
}

export class PDFBuildingLocation extends PDFInfoBlock implements IBuildingLocation {
	location: string;
	isSubway: boolean;
	roads: string;
	distance: number;
	subwayStations: string;
	description: string;
	infrastructure: {key: TAllInfrastructures, svg: string}[];
	map;

	constructor(options: TOptionsIBCreator, buildingData: TBuilding) {
		super();

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

	async getParams(): Promise <TPageParams> {
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
				zoom: 17,
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

		return {
			distance,
			distanceUnit,
			infrastructure,
			location: this.location,
			subwayStations: this.subwayStations,
			isSubway: this.isSubway,
			description: this.description,
			mapFileSrc: mapFileProcessed,
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();

		const svgLocationIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M8.00002 8.00016C7.26669 8.00016 6.66669 7.40016 6.66669 6.66683C6.66669 5.9335 7.26669 5.3335 8.00002 5.3335C8.73335 5.3335 9.33335 5.9335 9.33335 6.66683C9.33335 7.40016 8.73335 8.00016 8.00002 8.00016ZM12 6.80016C12 4.38016 10.2334 2.66683 8.00002 2.66683C5.76669 2.66683 4.00002 4.38016 4.00002 6.80016C4.00002 8.36016 5.30002 10.4268 8.00002 12.8935C10.7 10.4268 12 8.36016 12 6.80016ZM8.00002 1.3335C10.8 1.3335 13.3334 3.48016 13.3334 6.80016C13.3334 9.0135 11.5534 11.6335 8.00002 14.6668C4.44669 11.6335 2.66669 9.0135 2.66669 6.80016C2.66669 3.48016 5.20002 1.3335 8.00002 1.3335Z" fill="url(#paint0_linear)"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="-1.11109" y1="12.1668" x2="11.0662" y2="1.2545" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';
		const svgSubwayIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M9.17185 9.59024V10.2808H12V9.59024H11.4498L9.5777 5.00037L7.9992 7.68025L6.4223 5.00037L4.54863 9.59024H4V10.2808H6.82815V9.59024H6.40465L6.81692 8.44549L7.9992 10.3337L9.18308 8.44549L9.59535 9.59024H9.17185Z" fill="url(#paint0_linear)"/>\n' +
			'<rect x="1.65" y="1.65012" width="12.7" height="12.7" rx="6.35" stroke="url(#paint1_linear)" stroke-width="1.3"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="1.16667" y1="9.3337" x2="5.47383" y2="2.09667" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'<linearGradient id="paint1_linear" x1="-3.95833" y1="12.3751" x2="8.82242" y2="-1.94129" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';
		const svgRoadIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<g clip-path="url(#clip0)">\n' +
			'<rect x="1.65" y="1.65" width="12.7" height="12.7" rx="6.35" stroke="url(#paint0_linear)" stroke-width="1.3"/>\n' +
			'<path d="M5.92223 5.17737L4 10.823H4.97156L6.3656 5.17737H5.92223Z" fill="url(#paint1_linear)"/>\n' +
			'<path d="M10.0778 5.17737H9.6344L11.0284 10.823H12L10.0778 5.17737Z" fill="url(#paint2_linear)"/>\n' +
			'<path d="M6.74482 5.17737L5.35376 10.823H7.41221L7.46889 9.99217H8.53121L8.58789 10.823H10.6463L9.25532 5.17737H6.74482ZM7.817 5.24209H8.18311L8.24111 6.03379H7.75897L7.817 5.24209ZM7.70099 6.82546H8.29915L8.35716 7.61714H7.64292L7.70099 6.82546ZM7.52694 9.20046L7.58494 8.40882H8.41518L8.47323 9.20046H7.52694Z" fill="url(#paint3_linear)"/>\n' +
			'</g>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="-3.95833" y1="12.375" x2="8.82242" y2="-1.94141" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'<linearGradient id="paint1_linear" x1="3.16218" y1="9.76446" x2="7.15244" y2="7.89159" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'<linearGradient id="paint2_linear" x1="8.79658" y1="9.76446" x2="12.7868" y2="7.89159" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'<linearGradient id="paint3_linear" x1="3.4793" y1="9.76446" x2="8.6603" y2="4.32388" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'<clipPath id="clip0">\n' +
			'<rect width="16" height="16" fill="white"/>\n' +
			'</clipPath>\n' +
			'</defs>\n' +
			'</svg>\n';

		const placeSvg = '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M32 5.33337C21.68 5.33337 13.3333 13.68 13.3333 24C13.3333 38 32 58.6667 32 58.6667C32 58.6667 50.6666 38 50.6666 24C50.6666 13.68 42.32 5.33337 32 5.33337ZM32 30.6667C28.32 30.6667 25.3333 27.68 25.3333 24C25.3333 20.32 28.32 17.3334 32 17.3334C35.68 17.3334 38.6666 20.32 38.6666 24C38.6666 27.68 35.68 30.6667 32 30.6667Z" fill="url(#paint0_linear)"/>\n' +
			'<circle cx="32" cy="24" r="7" fill="white"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="13.3333" y1="5.33328" x2="55.4364" y2="8.94713" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';

		const lines = [
			{
				name: 'transferInfo',
				height: 56,
				fontSize: 18,
				marginBottom: 24
			},
			{
				name: 'location',
				height: 21,
				fontSize: 14,
				marginBottom: 12,
			},
			{
				name: 'subwayStations',
				height: 21,
				fontSize: 14,
				marginBottom: 24,
			},
			{
				name: 'descHeader',
				height: 21,
				fontSize: 24,
				marginBottom: 16,
			},
			{
				name: 'description',
				height: 21,
				fontSize: 14,
				marginBottom: 36,
			},
			{
				name: 'infrastructure',
				height: 24,
				marginBottom: 24,
			}
		]

		const descriptionArray = splitString(pageParams.description, 42);

		const mapHeight = doc.page.height;
		const mapWidth = 314;

		const patternHeight = doc.page.height;
		const patternWidth = doc.page.width - mapWidth;

		const xTextPadding = 107;
		const widthBlock: number =  doc.page.width - mapWidth - 2 * xTextPadding;
		const heightBlock: number = lines.reduce((height, line) => {
			if(line.name === 'location' || line.name === 'subwayStations') {
				const currentText = line.name === 'location' ? pageParams.location : pageParams.subwayStations;
				const lineCount = Math.ceil(currentText.length / 42);
				return height + lineCount * line.height + line.marginBottom;
			}
			if(line.name === 'description') {
				return descriptionArray.reduce((height, name, strNumber) => height + line.height, height) + line.marginBottom;
			}
			if(line.name === 'infrastructure') {
				const linesCount = pageParams.infrastructure.length > 7 ? 2 : 1;
				return height + line.height * linesCount + line.marginBottom * (linesCount - 1);
			}
			return height + line.height + line.marginBottom;
		}, 0);
		const yTextPadding = (doc.page.height - heightBlock) / 2;

		const gradient = doc.linearGradient(210, 296.5, 842, 296.5)
			.stop(0, '#008054')
			.stop(1, '#B4D88B');

		doc.image(path.join(process.cwd(), pageParams.mapFileSrc), 0, 0, {height: mapHeight, width: mapWidth});
		doc.image(path.join(process.cwd(), '/static/img/patternLocation.png'), mapWidth, 0, {height: patternHeight, width: patternWidth});

		SVGtoPDF(doc, placeSvg, mapWidth / 2 - 64 / 2, mapHeight / 2 - 64 / 2, {width: 64, height: 64});

		const xCurrentLineStart = mapWidth + xTextPadding;
		let yCurrentLineStart = yTextPadding;

		lines.forEach(line => {
			let lineCount = 1;
			if(line.name === 'transferInfo') {
				const icon = '<svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
					'<path d="M24 15V30L36.75 37.56L39.06 33.72L28.5 27.45V15H24ZM54 21V0L46.08 7.92C41.22 3.03 34.47 0 27 0C12.09 0 0 12.09 0 27C0 41.91 12.09 54 27 54C41.91 54 54 41.91 54 27H48C48 38.58 38.58 48 27 48C15.42 48 6 38.58 6 27C6 15.42 15.42 6 27 6C32.79 6 38.04 8.37 41.85 12.15L33 21H54Z" fill="url(#paint0_linear)"/>\n' +
					'<defs>\n' +
					'<linearGradient id="paint0_linear" x1="1.1063e-07" y1="-9.54285e-05" x2="60.439" y2="7.41089" gradientUnits="userSpaceOnUse">\n' +
					'<stop stop-color="#008054"/>\n' +
					'<stop offset="1" stop-color="#B4D88B"/>\n' +
					'</linearGradient>\n' +
					'</defs>\n' +
					'</svg>\n';
				const iconViewBox = 54;
				const iconMarginRight = 16;

				SVGtoPDF(doc, icon, xCurrentLineStart, yCurrentLineStart, {width: 54, height: 54});

				const text = pageParams.distance + ' ' + pageParams.distanceUnit;
				const textWidth = doc.fontSize(40).font('Regular').widthOfString(text);
				const xTextStart = xCurrentLineStart + iconViewBox + iconMarginRight;
				const yTextStart = yCurrentLineStart + (21 - 40) / 2;
				const gradient = doc.linearGradient(
					xTextStart,
					yTextStart,
					xTextStart + (textWidth < widthBlock ? textWidth : widthBlock),
					yTextStart)
					.stop(0, '#008054')
					.stop(1, '#B4D88B');

				doc.fontSize(40)
					.fill(gradient)
					.font('Bold')
					.text(text, xTextStart, yTextStart, {
						width: widthBlock,
						lineBreak: false,
					});

				doc.fontSize(18)
					.fillColor('#7B7B7B')
					.font('Regular')
					.text(`пешком от ${pageParams.isSubway ? 'метро' : 'шоссе'}`, xCurrentLineStart + iconViewBox + iconMarginRight, yCurrentLineStart + (40 + (21 - 40) / 2) + (21 - 18) / 2, {
						lineBreak: false,
					})

			}
			if(line.name === 'location' || line.name === 'subwayStations') {

				const svgViewBox = 16;
				const svgMarginTop = (line.name === 'location' ? 2 : 1) + (line.height - svgViewBox) / 2;
				const svgMarginRight = 5;
				const currentIcon = line.name === 'location' ? svgLocationIcon : (pageParams.isSubway ? svgSubwayIcon : svgRoadIcon);
				const currentText = line.name === 'location' ? pageParams.location  : pageParams.subwayStations;
				lineCount = Math.ceil(doc.fontSize(line.fontSize)
					.fillColor('#7B7B7B')
					.font('Regular').widthOfString(currentText) / widthBlock);

				SVGtoPDF(doc, currentIcon, xCurrentLineStart, yCurrentLineStart + svgMarginTop, {width: svgViewBox, height: svgViewBox});

				doc.fontSize(line.fontSize)
					.fillColor('#7B7B7B')
					.font('Regular')
					.text(currentText, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: widthBlock,
						lineGap: (line.height - line.fontSize) / 2,
					});
			}
			if(line.name === 'descHeader') {
				doc.fontSize(line.fontSize)
					.fill(gradient)
					.font('Bold')
					.text('Развитая инфраструктура', xCurrentLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: widthBlock,
					});
			}
			if(line.name === 'description') {

				descriptionArray.forEach((stringDesc, number, array) => {

					doc.fontSize(line.fontSize)
						.fillColor('#7B7B7B')
						.font('Regular')
						.text(stringDesc, xCurrentLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
							lineBreak: false,
						});
					yCurrentLineStart = yCurrentLineStart + (number === array.length - 1 ? 0 : line.height);
				});

			}
			else if(line.name === 'infrastructure') {
				const xSvgStart = xCurrentLineStart;
				pageParams.infrastructure.forEach((svg, number) => {
					const svgViewBox = 24;
					const svgMarginRight = 24;
					const shiftCount = number % 7;
					const xSvgStart = xCurrentLineStart + (svgViewBox + svgMarginRight) * shiftCount;
					if(number === 7) {
						yCurrentLineStart += (line.height + line.marginBottom);
					}

					if(number < 14) {
						SVGtoPDF(doc, svg, xSvgStart, yCurrentLineStart, {width: svgViewBox, height: svgViewBox});
					}

				});
			}
			// doc.rect(xCurrentLineStart, yCurrentLineStart, widthBlock, 1).fillOpacity(0.9).fill('red');
			// doc.rect(xCurrentLineStart, yCurrentLineStart + line.height, widthBlock, 1).fillOpacity(0.9).fill('red');
			yCurrentLineStart += lineCount * line.height + line.marginBottom;
		});


		return doc;
	}

}
