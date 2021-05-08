import {PDFInfoBlock} from "./PDFInfoBlock";
import {IBuildingHeader, TOptionsIBCreator} from "../../entities/entities";
import {TBuilding, TFeature} from "../../entities/storedData";
import SVGtoPDF from 'svg-to-pdfkit';
import path from "path";
import {randomString, splitString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import sharp from "sharp";
import {logger} from "../../../utils/logger";

export class PDFBuildingHeader extends PDFInfoBlock implements IBuildingHeader {
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
		super();

		this.mainPhotoFile = buildingData.buildingPrimaryPhoto;
		this.prefix = buildingData.buildingHeader.prefix;
		this.name = buildingData.buildingHeader.name;
		this.location = buildingData.buildingLocation.location;
		this.isSubway = !!buildingData.buildingLocation.isSubway;
		this.subwayStations = buildingData.buildingLocation.subwayStations;
		this.roads = buildingData.buildingLocation.roads;
		this.features = buildingData.buildingHeader.features;
	}

	async getParams(): Promise<{
		patternSrc: string,
		prefix: string,
		realtyName: string,
		location: string,
		isSubway: boolean,
		subwayStations: string,
		roads: string,
		features: TFeature[],
	}> {
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

		return {
			patternSrc: this.mainPhotoFile.url.length > 0 ? processedPhotoFile : '/static/img/buildingHeaderPattern.png',
			prefix: this.prefix,
			realtyName: this.name,
			location: this.location,
			isSubway: this.isSubway,
			subwayStations: this.subwayStations,
			roads: this.roads,
			features: this.features,
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();
		const svgIcon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<circle cx="12" cy="11.9996" r="12" fill="white"/>\n' +
			'<path d="M17.3333 8.6663H14.6666V7.33297L13.3333 5.99963H10.6666L9.33331 7.33297V8.6663H6.66665C5.93331 8.6663 5.33331 9.2663 5.33331 9.99963V13.333C5.33331 13.833 5.59998 14.253 5.99998 14.4863V16.6663C5.99998 17.4063 6.59331 17.9996 7.33331 17.9996H16.6666C17.4066 17.9996 18 17.4063 18 16.6663V14.4796C18.3933 14.2463 18.6666 13.8196 18.6666 13.333V9.99963C18.6666 9.2663 18.0666 8.6663 17.3333 8.6663ZM10.6666 7.33297H13.3333V8.6663H10.6666V7.33297ZM6.66665 9.99963H17.3333V13.333H14V11.333H9.99998V13.333H6.66665V9.99963ZM12.6666 13.9996H11.3333V12.6663H12.6666V13.9996ZM16.6666 16.6663H7.33331V14.6663H9.99998V15.333H14V14.6663H16.6666V16.6663Z" fill="url(#paint0_linear)"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="5.33331" y1="5.99961" x2="20.2048" y2="8.02577" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';

		const svgLocationIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M8.00002 7.99968C7.26669 7.99968 6.66669 7.39968 6.66669 6.66634C6.66669 5.93301 7.26669 5.33301 8.00002 5.33301C8.73335 5.33301 9.33335 5.93301 9.33335 6.66634C9.33335 7.39968 8.73335 7.99968 8.00002 7.99968ZM12 6.79968C12 4.37968 10.2334 2.66634 8.00002 2.66634C5.76669 2.66634 4.00002 4.37968 4.00002 6.79968C4.00002 8.35968 5.30002 10.4263 8.00002 12.893C10.7 10.4263 12 8.35968 12 6.79968ZM8.00002 1.33301C10.8 1.33301 13.3334 3.47968 13.3334 6.79968C13.3334 9.01301 11.5534 11.633 8.00002 14.6663C4.44669 11.633 2.66669 9.01301 2.66669 6.79968C2.66669 3.47968 5.20002 1.33301 8.00002 1.33301Z" fill="white" fill-opacity="0.8"/>\n' +
			'</svg>\n';

		const svgSubwayIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M9.17185 9.58938V10.28H12V9.58938H11.4498L9.5777 4.99951L7.9992 7.6794L6.4223 4.99951L4.54863 9.58938H4V10.28H6.82815V9.58938H6.40465L6.81692 8.44464L7.9992 10.3328L9.18308 8.44464L9.59535 9.58938H9.17185Z" fill="white" fill-opacity="0.8"/>\n' +
			'<rect x="1.65" y="1.64939" width="12.7" height="12.7" rx="6.35" stroke="white" stroke-opacity="0.8" stroke-width="1.3"/>\n' +
			'</svg>\n';

		const xBlcok: number = 210;
		const xPadding = 40;
		const yPadding = 32;

		const lines = [
			{
				name: 'prefix',
				height: 21,
				fontSize: 18,
				marginBottom: 15
			},
			{
				name: 'realtyName',
				height: 40,
				fontSize: 40,
				marginBottom: 15,
			},
			{
				name: 'location',
				height: 21,
				fontSize: 14,
				marginBottom: 10,
			},
			{
				name: 'subwayStations',
				height: 21,
				fontSize: 14,
				marginBottom: 26,
			},
			{
				name: 'features',
				height: 45,
				marginBottom: 0,
			}
		]

		// Realty Name
		const realtyNameArray = splitString(pageParams.realtyName, 24);

		const widthBlock: number =  doc.page.width - xBlcok;
		const heightBlock: number = 2 * yPadding + lines.reduce((height, line, number, lines) => {
			if(line.name === 'realtyName') {
				return realtyNameArray.reduce((height, name, strNumber) => height + line.height, height) + line.marginBottom;
			}
			if(line.name === 'location' || line.name === 'subwayStations') {
				const currentText = line.name === 'location' ? pageParams.location : pageParams.subwayStations;
				const lineCount = Math.ceil(currentText.length / 73);
				return height + lineCount * line.height + line.marginBottom;
			}
			return height + line.height + line.marginBottom;
		}, 0);
		const yBlcok: number = (doc.page.height - heightBlock) / 2;


		const gradient = doc.linearGradient(210, 296.5, 842, 296.5)
			.stop(0, '#008054')
			.stop(1, '#B4D88B');

		doc.image(path.join(process.cwd(), pageParams.patternSrc), 0, 0, {fit: [doc.page.width, doc.page.height], align: 'center', valign: 'center'});
		doc.rect(0, 0, doc.page.width, doc.page.height).fillOpacity(0.4).fill('black');
		doc.rect(xBlcok, yBlcok, widthBlock, heightBlock).fillOpacity(0.9).fill(gradient);

		let yCurrentLineStart = yBlcok + yPadding;

		lines.forEach(line => {
			let lineCount = 1;

			if(line.name === 'prefix') {

				const svgMarginTop = 0;
				const svgViewBox = 24;
				const svgMarginRight = 8;
				SVGtoPDF(doc, svgIcon, xBlcok + xPadding, yCurrentLineStart + svgMarginTop, {width: svgViewBox, height: svgViewBox});

				doc.fontSize(line.fontSize)
					.fillColor('white')
					.font('Bold')
					.text(pageParams.prefix,
						xBlcok + xPadding + svgViewBox + svgMarginRight,
						yCurrentLineStart + (line.height - line.fontSize) / 2,
						{
							width: widthBlock - 2 * xPadding,
						});

			}
			if(line.name === 'realtyName') {

				realtyNameArray.forEach((stringName, number, array) => {
					doc.fontSize(line.fontSize)
						.fillColor('white')
						.font('Bold')
						.text(stringName, xBlcok + xPadding, yCurrentLineStart + (line.height - line.fontSize) / 2, {
							lineBreak: false,
						});
					yCurrentLineStart = yCurrentLineStart + (number === array.length - 1 ? 0 : line.height);
				});

			}
			if(line.name === 'location' || line.name === 'subwayStations') {

				const svgViewBox = 16;
				const svgMarginTop = (line.name === 'location' ? 2 : 1) + (line.height - svgViewBox) / 2;
				const svgMarginRight = 5;
				const currentIcon = line.name === 'location' ? svgLocationIcon : svgSubwayIcon;
				const currentText = line.name === 'location' ? pageParams.location : pageParams.subwayStations;
				lineCount = Math.ceil(currentText.length / 73);

				SVGtoPDF(doc, currentIcon, xBlcok + xPadding, yCurrentLineStart + svgMarginTop, {width: svgViewBox, height: svgViewBox});

				doc.fontSize(line.fontSize)
					.fillColor('white')
					.fillOpacity(0.8)
					.font('Regular')
					.text(currentText, xBlcok + xPadding + svgViewBox + svgMarginRight, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: widthBlock - 2 * xPadding,
						lineGap: (line.height - line.fontSize) / 2,
					});
			}
			if(line.name === 'features') {

				const featurePadding = 28;
				let xCurrentFeature = xBlcok + xPadding;
				pageParams.features.forEach((feature, number) => {

					const currentFeatureWidth = feature.width + (number === 0 ? 1 : 2) * featurePadding;

					doc.fontSize(24)
						.fillOpacity(1)
						.fillColor('white')
						.font('Bold')
						.text(feature.name, number === 0 ? xCurrentFeature : xCurrentFeature + featurePadding, yCurrentLineStart, {
							width: feature.width,
							lineBreak: false,
						});

					if(feature.svgSuffixWhite) {
						SVGtoPDF(doc,
							feature.svgSuffixWhite,
							xCurrentFeature + (number === 0 ? 0 : featurePadding) + feature.svgSuffixOffset,
							yCurrentLineStart + feature.svgSuffixMarginTop);
					}

					doc.fontSize(14)
						.fillOpacity(0.8)
						.fillColor('white')
						.font('Regular')
						.text(feature.desc, number === 0 ? xCurrentFeature : xCurrentFeature + featurePadding, yCurrentLineStart + 24 + 3, {
							width: feature.width,
							lineBreak: false,
						});

					if(number !==  pageParams.features.length - 1) {
						doc.rect(xCurrentFeature + currentFeatureWidth - 1, yCurrentLineStart, 1, line.height)
							.fillOpacity(0.3)
							.fill('white');
					}
					xCurrentFeature += currentFeatureWidth
				});

			}

			// doc.rect(xBlcok, yCurrentLineStart, widthBlock, 1).fillOpacity(0.9).fill('red');
			// doc.rect(xBlcok, yCurrentLineStart + line.height, widthBlock, 1).fillOpacity(0.9).fill('red');
			yCurrentLineStart += lineCount * line.height + line.marginBottom;
		});


		return doc;
	}

}
