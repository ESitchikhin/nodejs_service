import {TArea, TCommercialParam, TCommercialTerms, TMedia} from "../../entities/storedData";
import {PDFInfoBlock} from "./PDFInfoBlock";
import {IAreaCommercial, TOptionsIBCreator} from "../../entities/entities";
import {randomString, splitString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import SVGtoPDF from 'svg-to-pdfkit';
import {text} from "express";
import {logger} from "../../../utils/logger";

type TPageParams = {
	isNdsInclude: boolean,
	areaPatternSrc: string,
	areaPatternWidth: number,
	areaPatternHeight: number,
	operationType: string,
	purpose: string,
	layout: string,
	terms: TCommercialTerms[],
	params: TCommercialParam[],
	areaFeatures: string[],
	state: string,
	occupiedState: string,
	floor: string,
	pricePerMonth: string,
	priceTotal: string,
	pricePerSquare: string,
}

type TLineParamsBox = {
	height: number,
	fontSizeFirst: number,
	fontSize: number,
	firstStringMarginBottom: number,
	marginBottom: number
}

export class PDFAreaCommercial extends PDFInfoBlock implements IAreaCommercial {
	areaCommercial: {
		isNdsInclude: boolean,
		operationType: string,
		purpose: string,
		layout: string,
		terms: TCommercialTerms[],
		params: TCommercialParam[],
		areaFeatures: string[],
		state: string,
		occupiedState: string,
		floor: string,
		pricePerMonth: string,
		priceTotal: string,
		pricePerSquare: string,
	};
	areaPrimaryPhoto: TMedia

	constructor(options: TOptionsIBCreator, areaData: TArea) {
		super();
		this.areaCommercial = areaData.areaCommercial;
		this.areaPrimaryPhoto = areaData.areaPrimaryPhoto;
	}

	async getParams(): Promise <TPageParams> {

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

		return {
			areaPatternSrc: this.areaPrimaryPhoto.url.length > 0
				? processedPhotoFile
				: (this.areaPrimaryPhoto.width <= 526 ? '/static/img/areaCommercialTemplate526.jpg' : '/static/img/areaCommercialTemplate842.jpg'),
			areaPatternWidth: this.areaPrimaryPhoto.width,
			areaPatternHeight: this.areaPrimaryPhoto.height,
			...this.areaCommercial
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();
		const isCommercialTerms = this.areaPrimaryPhoto.width <= 526;

		// PriceBox - блок с ценами
		const widthPriceBox = 528;
		const heightPriceBox = 117;

		const widthCommercialLine = widthPriceBox;
		const heightCommercialLine = 32;

		const xPriceBox = doc.page.width - widthPriceBox;
		const yPriceBox = isCommercialTerms ? doc.page.height - heightPriceBox : doc.page.height - heightPriceBox - heightCommercialLine;
		const priceTemplate = '/static/img/priceTemplate.png'

		// CommercialTermsBox - блок с коммерческими условиями
		const widthCommercialTermsBox = doc.page.width - this.areaPrimaryPhoto.width;
		const heightCommercialTermsBox = doc.page.height - heightPriceBox;

		// ParamsBox - блок с коммерческими условиями
		const widthParamsBox = 212;
		const topPaddingParamsBox = isCommercialTerms ? (pageParams.params.length === 3 ? 105 : 46) : 52;
		const bottomPaddingParamsBox = 20;
		const lineParamsBox: TLineParamsBox = {
			height: 21,
			fontSizeFirst: 24,
			fontSize: 14,
			firstStringMarginBottom: 3,
			marginBottom: 26
		};
		const xParamsBox = isCommercialTerms
			? doc.page.width - widthCommercialTermsBox - widthParamsBox
			: doc.page.width - widthParamsBox;


		const heightParamsBox = topPaddingParamsBox + pageParams.params.reduce((height, param) => {
			return height
				+ lineParamsBox.height
				+ lineParamsBox.firstStringMarginBottom
				+ lineParamsBox.height * splitString(param.description, 14).length
				+ lineParamsBox.marginBottom;
		}, 0) + bottomPaddingParamsBox

		const yParamsBox = isCommercialTerms
			? doc.page.height - heightPriceBox - heightParamsBox
			: doc.page.height - heightPriceBox - heightParamsBox - heightCommercialLine;


		// OccupiedState - указание состояния Свободно / Занято
		const xOccupiedState = xParamsBox + 52;
		const yOccupiedState = 47;
		const widthOccupiedState = widthParamsBox - 52 - 8;

		doc.image(path.join(process.cwd(), pageParams.areaPatternSrc), 0, 0, {fit: [pageParams.areaPatternWidth, pageParams.areaPatternHeight], align: 'center', valign: 'center'});
		doc.rect(0, 0, pageParams.areaPatternWidth, pageParams.areaPatternHeight).fillOpacity(0.6).fill('black');
		doc.rect(xParamsBox, 0, widthParamsBox, heightParamsBox + doc.page.height - heightParamsBox).fillOpacity(0.2).fill('white');
		doc.fillOpacity(1).image(path.join(process.cwd(), priceTemplate), xPriceBox, yPriceBox,
			{fit: [widthPriceBox, heightPriceBox], align: 'center', valign: 'center'});


		this.generateMainData(doc, pageParams);
		this.generateFloor(doc, pageParams.floor)
		this.generateParams(doc, pageParams.params, lineParamsBox, {
			x: xParamsBox,
			y: yParamsBox,
			width: widthParamsBox,
			height: heightParamsBox,
			topPadding: topPaddingParamsBox,
			bottomPadding: bottomPaddingParamsBox
		});

		if(isCommercialTerms) {
			this.generateCommercialTerms(doc, pageParams.terms, {x: doc.page.width - widthCommercialTermsBox, y: 0, height: heightCommercialTermsBox, width: widthCommercialTermsBox})
		} else {
			this.generateLine(doc, pageParams.terms.filter(term => term.name === 'Тип налогооблажения')[0], pageParams.isNdsInclude, {x: xPriceBox, y: doc.page.height - heightCommercialLine, width: widthCommercialLine, height: heightCommercialLine});
		}

		this.generatePrices(doc, pageParams, {x: xPriceBox, y: yPriceBox, width: widthPriceBox, height: heightPriceBox});
		this.generateOccupiedState(doc, pageParams.occupiedState, {x: xOccupiedState, y: yOccupiedState, width: widthOccupiedState});

		return doc
	}

	private generateMainData(doc: PDFKit.PDFDocument, pageParams: TPageParams) {
		const iconRent = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<circle cx="12" cy="12" r="12" fill="white"/>\n' +
			'<path d="M15.3333 6.66675L18 9.33341L15.3333 12.0001V10.0001H12.6667V8.66675H15.3333V6.66675ZM10.6667 8.66675C10.3 8.66675 10 8.96675 10 9.33341C10 9.70008 10.3 10.0001 10.6667 10.0001C11.0333 10.0001 11.3333 9.70008 11.3333 9.33341C11.3333 8.96675 11.0333 8.66675 10.6667 8.66675ZM8 8.66675C7.63333 8.66675 7.33333 8.96675 7.33333 9.33341C7.33333 9.70008 7.63333 10.0001 8 10.0001C8.36667 10.0001 8.66667 9.70008 8.66667 9.33341C8.66667 8.96675 8.36667 8.66675 8 8.66675ZM8.66667 15.3334H11.3333V14.0001H8.66667V12.0001L6 14.6667L8.66667 17.3334V15.3334ZM13.3333 15.3334C13.7 15.3334 14 15.0334 14 14.6667C14 14.3001 13.7 14.0001 13.3333 14.0001C12.9667 14.0001 12.6667 14.3001 12.6667 14.6667C12.6667 15.0334 12.9667 15.3334 13.3333 15.3334ZM16 15.3334C16.3667 15.3334 16.6667 15.0334 16.6667 14.6667C16.6667 14.3001 16.3667 14.0001 16 14.0001C15.6333 14.0001 15.3333 14.3001 15.3333 14.6667C15.3333 15.0334 15.6333 15.3334 16 15.3334Z" fill="url(#paint0_linear)"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="6" y1="6.66673" x2="19.3782" y2="8.51221" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';

		const iconSell = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<circle cx="12" cy="12" r="12" fill="white"/>\n' +
			'<path d="M15.3333 6.66675L18 9.33341L15.3333 12.0001V10.0001H12.6667V8.66675H15.3333V6.66675ZM10.6667 8.66675C10.3 8.66675 10 8.96675 10 9.33341C10 9.70008 10.3 10.0001 10.6667 10.0001C11.0333 10.0001 11.3333 9.70008 11.3333 9.33341C11.3333 8.96675 11.0333 8.66675 10.6667 8.66675ZM8 8.66675C7.63333 8.66675 7.33333 8.96675 7.33333 9.33341C7.33333 9.70008 7.63333 10.0001 8 10.0001C8.36667 10.0001 8.66667 9.70008 8.66667 9.33341C8.66667 8.96675 8.36667 8.66675 8 8.66675ZM8.66667 15.3334H11.3333V14.0001H8.66667V12.0001L6 14.6667L8.66667 17.3334V15.3334ZM13.3333 15.3334C13.7 15.3334 14 15.0334 14 14.6667C14 14.3001 13.7 14.0001 13.3333 14.0001C12.9667 14.0001 12.6667 14.3001 12.6667 14.6667C12.6667 15.0334 12.9667 15.3334 13.3333 15.3334ZM16 15.3334C16.3667 15.3334 16.6667 15.0334 16.6667 14.6667C16.6667 14.3001 16.3667 14.0001 16 14.0001C15.6333 14.0001 15.3333 14.3001 15.3333 14.6667C15.3333 15.0334 15.6333 15.3334 16 15.3334Z" fill="url(#paint0_linear)"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="6" y1="6.66673" x2="19.3782" y2="8.51221" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';

		const mainLines = [
			{
				name: 'operation',
				height: 21,
				fontSize: 18,
				marginBottom: 10
			},
			{
				name: 'purpose',
				height: 40,
				fontSize: 40,
				marginBottom: 8
			},
			{
				name: 'layout',
				height: 28,
				fontSize: 28,
				marginBottom: 20
			},
			{
				name: 'features',
				height: 21,
				fontSize: 14,
				marginBottom: pageParams.areaFeatures.length > 0 ? 16 : 0,
			},
			{
				name: 'state',
				height: 21,
				fontSize: 14,
				marginBottom: 0
			}
		]

		// Main Data
		const xCurrentLineStart = 105;
		let yCurrentLineStart = 50;

		mainLines.forEach(line => {
			let lineCount = 1;

			if(line.name === 'operation') {
				const svgIcon = pageParams.operationType === 'Аренда' ? iconRent : iconSell;
				const svgViewBox = 24;
				const svgMarginTop = (line.height - svgViewBox) / 2;
				const svgMarginRight = 8
				SVGtoPDF(doc, svgIcon, xCurrentLineStart, yCurrentLineStart + svgMarginTop, {width: svgViewBox, height: svgViewBox});

				doc.fontSize(line.fontSize)
					.fillColor('white')
					.font('Bold')
					.text(pageParams.operationType,
						xCurrentLineStart + svgViewBox + svgMarginRight,
						yCurrentLineStart + (line.height - line.fontSize) / 2);
			}
			if(line.name === 'purpose') {
				const purposeArray = splitString(pageParams.purpose, 9)
				purposeArray.forEach(purposeLine => {
					lineCount = 0;
					doc.fontSize(line.fontSize)
						.fillColor('#73C167')
						.font('Bold')
						.text(purposeLine,
							xCurrentLineStart,
							yCurrentLineStart + (line.height - line.fontSize) / 2
						);
					yCurrentLineStart += line.height;
				});
			}
			if(line.name === 'layout') {

				doc.fontSize(line.fontSize)
					.fillColor('white')
					.font('Bold')
					.text(pageParams.layout,
						xCurrentLineStart,
						yCurrentLineStart + (line.height - line.fontSize) / 2);

			}
			if(line.name === 'features') {
				lineCount = 0;
				pageParams.areaFeatures.forEach((feature, number, array) => {
					doc.fontSize(line.fontSize)
						.fillColor('white')
						.fillOpacity(0.8)
						.font('Regular')
						.text(feature.toLowerCase() + (number !== array.length - 1 ? ',' : ''),
							xCurrentLineStart,
							yCurrentLineStart + (line.height - line.fontSize) / 2
						);
					yCurrentLineStart += line.height;
				});
			}
			if(line.name === 'state') {
				const stateArray = splitString(pageParams.state, 23);
				lineCount = 0;
				stateArray.forEach(state => {
					doc.fontSize(line.fontSize)
						.fillColor('white')
						.fillOpacity(0.8)
						.font('Regular')
						.text(state,
							xCurrentLineStart,
							yCurrentLineStart + (line.height - line.fontSize) / 2
						);
					yCurrentLineStart += line.height;
				})
			}

			yCurrentLineStart += lineCount * line.height + line.marginBottom;
		});

	}

	private generateFloor(doc: PDFKit.PDFDocument, floor) {

		const xCurrentLineStart = 105;
		const yFloorLineStart = 364;
		const yFloorDescLineStart = 489;
		const floorFontSize = 144;
		const floorDescFontSize = 72

		doc.fontSize(floorFontSize)
			.fillColor('white')
			.fillOpacity(1)
			.font('Bold')
			.text(floor,
				xCurrentLineStart,
				yFloorLineStart);

		doc.fontSize(floorDescFontSize)
			.fillColor('white')
			.fillOpacity(0.8)
			.font('Regular')
			.text('этаж',
				xCurrentLineStart,
				yFloorDescLineStart);
	}

	private generateParams(doc: PDFKit.PDFDocument, params: TCommercialParam[], lineParamsBox: TLineParamsBox, paramsBox: {x: number, y: number, width: number, height: number, topPadding: number, bottomPadding: number}) {
		const xCurrentLineStart = paramsBox.x + 45;
		const svgViewBox = 24;
		const svgMarginRight = 11;

		let yCurrentLineStart = paramsBox.y + paramsBox.topPadding;
		params.forEach(param => {

			SVGtoPDF(doc, param.svg, xCurrentLineStart, yCurrentLineStart , {width: svgViewBox, height: svgViewBox});

			doc.fontSize(lineParamsBox.fontSizeFirst)
				.fillColor('white')
				.font('Bold')
				.text(param.value,
					xCurrentLineStart + svgViewBox + svgMarginRight,
					yCurrentLineStart + (lineParamsBox.height - lineParamsBox.fontSizeFirst) / 2);
			yCurrentLineStart += lineParamsBox.height + lineParamsBox.firstStringMarginBottom;

			splitString(param.description, 13).forEach(description => {
				doc.fontSize(lineParamsBox.fontSize)
					.fillColor('white')
					.font('Regular')
					.text(description,
						xCurrentLineStart + svgViewBox + svgMarginRight,
						yCurrentLineStart + (lineParamsBox.height - lineParamsBox.fontSize) / 2);
				yCurrentLineStart += lineParamsBox.height
			})

			yCurrentLineStart += lineParamsBox.marginBottom;

		});

	}

	private generateCommercialTerms(doc: PDFKit.PDFDocument, terms: TCommercialTerms[], commercialTermsBox: {x: number, y: number, width: number, height: number}) {
		const termIcon = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M1.33337 7.99992C1.33337 4.31992 4.32004 1.33325 8.00004 1.33325C11.68 1.33325 14.6667 4.31992 14.6667 7.99992C14.6667 11.6799 11.68 14.6666 8.00004 14.6666C4.32004 14.6666 1.33337 11.6799 1.33337 7.99992ZM8.00004 11.9999C10.2067 11.9999 12 10.2066 12 7.99992C12 5.79325 10.2067 3.99992 8.00004 3.99992C5.79337 3.99992 4.00004 5.79325 4.00004 7.99992C4.00004 10.2066 5.79337 11.9999 8.00004 11.9999Z" fill="url(#paint0_linear)"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="1.33337" y1="1.33323" x2="16.2566" y2="3.1631" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';


		const lines = [
			{
				name: 'header',
				height: 29,
				fontSize: 24,
				marginBottom: 18
			},
			{
				name: 'terms',
				height: 0,
				termName: {
					height: 21,
					fontSize: 14
				},
				termParams: {
					height: 21,
					fontSize: 12
				},
				termMarginBottom: 16,
				marginBottom: 0
			},
		];

		const xPadding = 56;
		const yPadding = 46;
		const xCurrentLineStart = commercialTermsBox.x + xPadding;
		let yCurrentLineStart = commercialTermsBox.y + yPadding;

		lines.forEach(line => {
			if(line.name === 'header') {

				const gradient = doc.linearGradient(
					xCurrentLineStart,
					yCurrentLineStart,
					xCurrentLineStart + 180,
					yCurrentLineStart)
					.stop(0, '#008054')
					.stop(1, '#B4D88B');

				doc.fontSize(line.fontSize)
					.fill(gradient)
					.fillOpacity(1)
					.font('Bold')
					.text('Коммерческие', xCurrentLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: 180,
					});
				yCurrentLineStart += line.height;
				doc.fontSize(line.fontSize)
					.fill(gradient)
					.fillOpacity(1)
					.font('Bold')
					.text('условия:', xCurrentLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: 180,
					});

			}
			if(line.name === 'terms') {
				const svgViewBox = 16;
				const svgMarginRight = 8;
				const svgMarginTop = (line.termName.height - line.termName.fontSize)/2;

				terms.forEach(term => {

					SVGtoPDF(doc, termIcon, xCurrentLineStart, yCurrentLineStart + svgMarginTop, {width: svgViewBox, height: svgViewBox});

					doc.fontSize(line.termName.fontSize)
						.fillOpacity(1)
						.fillColor('#434343')
						.font('Bold')
						.text(term.name, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (line.termName.height - line.termName.fontSize)/2, {
							lineBreak: false,
						});

					yCurrentLineStart += line.termName.height
					const params = term.params.join(', ');
					splitString(params, 32).forEach(paramLine => {
						doc.fontSize(line.termParams.fontSize)
							.fillOpacity(1)
							.fillColor('#7B7B7B')
							.font('Regular')
							.text(paramLine, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (line.termParams.height - line.termParams.fontSize)/2, {
								lineBreak: false,
							});
						yCurrentLineStart += line.termParams.height;
					});
					yCurrentLineStart += line.termMarginBottom;
				});
			}

			yCurrentLineStart += line.height + line.marginBottom;
		});

	}

	private generatePrices(doc: PDFKit.PDFDocument, pageParams: TPageParams, priceBox: {x: number, y: number, width: number, height: number}) {

		const svgWallet = '<svg viewBox="0 0 119 117" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M0 0L107 -5.40026e-07L118.5 58.5L107 117L-6.67574e-07 117L0 0Z" fill="#73C167"/>\n' +
			'<path d="M68.4526 47.375C68.2585 44.8708 66.1603 42.8921 63.6073 42.8921H40.8615C38.1809 42.8921 36 45.073 36 47.7536V70.2469C36 72.9276 38.1809 75.1085 40.8615 75.1085H67.1385C69.8192 75.1085 72.0001 72.9276 72.0001 70.2469V52.0546C72 49.8293 70.4966 47.9499 68.4526 47.375ZM40.8615 45.1632H63.6073C64.8432 45.1632 65.879 46.0334 66.136 47.1931H40.8615C39.9097 47.1931 39.0217 47.4691 38.2711 47.9438V47.7536C38.2711 46.3253 39.4332 45.1632 40.8615 45.1632ZM67.1385 72.8374H40.8615C39.4332 72.8374 38.2711 71.6753 38.2711 70.2469V52.0546C38.2711 50.6262 39.4332 49.4641 40.8615 49.4641H67.1385C68.5669 49.4641 69.729 50.6262 69.729 52.0546V56.0175H62.488C59.6187 56.0175 57.2843 58.352 57.2843 61.2213C57.2843 64.0907 59.6187 66.4252 62.488 66.4252H69.7289V70.2469C69.7289 71.6753 68.5668 72.8374 67.1385 72.8374ZM69.7289 64.1541H62.488C60.871 64.1541 59.5554 62.8385 59.5554 61.2213C59.5554 59.6042 60.871 58.2886 62.488 58.2886H69.7289V64.1541Z" fill="white"/>\n' +
			'<path d="M62.9096 62.49C63.5625 62.49 64.0918 61.9607 64.0918 61.3077C64.0918 60.6548 63.5625 60.1255 62.9096 60.1255C62.2567 60.1255 61.7274 60.6548 61.7274 61.3077C61.7274 61.9607 62.2567 62.49 62.9096 62.49Z" fill="white"/>\n' +
			'</svg>\n'

		const svgWalletHeight = 117, svgWalletWidth = 119;

		const iconMonth = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path fill-rule="evenodd" clip-rule="evenodd" d="M20 3H19V1H17V3H7V1H5V3H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM4 21H20V5H4V21Z" fill="white"/>\n' +
			'<path d="M12 18H14V8H10V10H12V18Z" fill="white"/>\n' +
			'</svg>\n';
		const iconYear = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path fill-rule="evenodd" clip-rule="evenodd" d="M20 3H19V1H17V3H7V1H5V3H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM4 21H20V5H4V21Z" fill="white"/>\n' +
			'<path d="M8 18H10V8H6V10H8V18Z" fill="white"/>\n' +
			'<path d="M18 16H14V14H16C17.1 14 18 13.11 18 12V10C18 8.89 17.1 8 16 8H12V10H16V12H14C12.9 12 12 12.89 12 14V18H18V16Z" fill="white"/>\n' +
			'</svg>\n';
		const iconPerMeter = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path fill-rule="evenodd" clip-rule="evenodd" d="M20 3H19H17H7H5H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM4 21H20V5H4V21Z" fill="white"/>\n' +
			'<path d="M8.324 16H9.809L9.917 13.867C9.935 13.507 9.908 13.075 9.908 13.075H9.926C9.926 13.075 10.097 13.462 10.196 13.759L10.808 15.379H12.068L12.68 13.759C12.797 13.471 12.932 13.075 12.932 13.075H12.95C12.95 13.075 12.932 13.507 12.941 13.867L13.049 16H14.543L14.102 11.365H12.311L11.627 13.399C11.546 13.633 11.438 13.939 11.438 13.939H11.429C11.429 13.939 11.33 13.633 11.249 13.399L10.565 11.365H8.765L8.324 16ZM15.1973 12.193H18.1403V11.221H16.4213C16.5113 10.843 18.0863 10.672 18.0863 9.421C18.0863 8.521 17.3033 8.134 16.6193 8.134C16.0073 8.134 15.4403 8.458 15.1523 8.935L15.8993 9.574C16.0523 9.385 16.2683 9.169 16.5383 9.169C16.7453 9.169 16.9433 9.268 16.9433 9.475C16.9433 10.078 15.1523 10.141 15.1523 11.752C15.1523 11.887 15.1703 12.04 15.1973 12.193Z" fill="white"/>\n' +
			'</svg>\n';
		const iconSquare = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path fill-rule="evenodd" clip-rule="evenodd" d="M20 3H19H17H7H5H4C2.9 3 2 3.9 2 5V21C2 22.1 2.9 23 4 23H20C21.1 23 22 22.1 22 21V5C22 3.9 21.1 3 20 3ZM4 21H20V5H4V21Z" fill="white"/>\n' +
			'<path fill-rule="evenodd" clip-rule="evenodd" d="M13 9V5H15V9H18V11H15H13V9ZM20 15L13 15V17L20 17V15ZM8 14H4V12H8V9H10V17H8V14Z" fill="white"/>\n' +
			'</svg>\n';

		const iconCurrency = '<svg viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M2.16 18V15.432H0.24V13.104H2.16V11.232H0.24V8.256H2.16V0.863999H7.632C9.84 0.863999 11.448 1.312 12.456 2.208C13.48 3.104 13.992 4.336 13.992 5.904C13.992 6.832 13.784 7.704 13.368 8.52C12.952 9.336 12.256 9.992 11.28 10.488C10.32 10.984 9.008 11.232 7.344 11.232H5.784V13.104H9.48V15.432H5.784V18H2.16ZM6.984 8.256C8.008 8.256 8.816 8.08 9.408 7.728C10.016 7.376 10.32 6.808 10.32 6.024C10.32 4.568 9.36 3.84 7.44 3.84H5.784V8.256H6.984Z" fill="white"/>\n' +
			'</svg>\n';
		const iconCurrencyWidth = 14;
		const iconCurrencyHeight = 18;
		const leftIconCurrencyMargin = 5;

		let xCurrentLineStart = priceBox.x
		let yCurrentLineStart = priceBox.y

		const svgViewBox = 24;
		const svgMarginRight = 10;
		const xPadding = 34;
		const yPadding = 43;
		const bottomPriceMargin = 3;
		const priceFontSize = 24;
		const descFontSize = 14;
		const lineHeight = 21;

		const firstPrice = pageParams.operationType === 'Аренда' ? pageParams.pricePerMonth : pageParams.pricePerSquare;
		const firstDesc = pageParams.operationType === 'Аренда' ? 'за месяц' : 'за м²';
		const firstIcon =  pageParams.operationType === 'Аренда' ? iconMonth : iconPerMeter;

		const secondPrice =  pageParams.operationType === 'Аренда' ? pageParams.pricePerSquare : pageParams.priceTotal;
		const secondDesc =  pageParams.operationType === 'Аренда' ? 'за м² в год' : 'стоимость';
		const secondIcon =  pageParams.operationType === 'Аренда' ? iconYear : iconSquare;

		const firstPriceWidth = doc.fontSize(priceFontSize).font('Bold').widthOfString(firstPrice) + leftIconCurrencyMargin + iconCurrencyWidth;
		const firstDescWidth = doc.fontSize(priceFontSize).font('Regular').widthOfString(firstDesc);
		const secondPriceWidth = doc.fontSize(priceFontSize).font('Bold').widthOfString(secondPrice) + leftIconCurrencyMargin + iconCurrencyWidth;
		const secondDescWidth = doc.fontSize(priceFontSize).font('Regular').widthOfString(secondDesc);

		const firstTextWidth = firstPriceWidth > firstDescWidth ? firstPriceWidth : firstDescWidth;
		const secondTextWidth = secondPriceWidth > secondDescWidth ? secondPriceWidth : secondDescWidth;

		const contentWidth = 2 * (svgViewBox + svgMarginRight) + firstTextWidth + xPadding + secondTextWidth;
		let xBasePadding = (priceBox.width - svgWalletWidth - contentWidth) / 2;

		if(xBasePadding > 30) {
			SVGtoPDF(doc, svgWallet, xCurrentLineStart, yCurrentLineStart, {width: svgWalletWidth, height: priceBox.height});
			xCurrentLineStart += svgWalletWidth;
		} else {
			xBasePadding += svgWalletWidth / 2;
		}

		yCurrentLineStart += yPadding;
		xCurrentLineStart += xBasePadding;

		SVGtoPDF(doc, firstIcon, xCurrentLineStart, yCurrentLineStart, {width: svgViewBox, height: svgViewBox});
		doc.fontSize(priceFontSize)
			.fillOpacity(1)
			.fillColor('white')
			.font('Bold')
			.text(firstPrice, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (lineHeight - priceFontSize)/2, {
				lineBreak: false,
			});
		SVGtoPDF(
			doc,
			iconCurrency,
			xCurrentLineStart + svgViewBox + svgMarginRight + firstPriceWidth - iconCurrencyWidth,
			yCurrentLineStart + 2 + (lineHeight - iconCurrencyHeight)/2,
			{width: iconCurrencyWidth, height: iconCurrencyHeight});

		yCurrentLineStart += lineHeight + bottomPriceMargin;
		doc.fontSize(descFontSize)
			.fillOpacity(1)
			.fillColor('white')
			.font('Regular')
			.text(firstDesc, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (lineHeight - descFontSize)/2, {
				lineBreak: false,
			});

		const textWidth = doc.fontSize(priceFontSize).font('Bold').widthOfString(pageParams.pricePerMonth);
		xCurrentLineStart += svgViewBox + svgMarginRight + textWidth + iconCurrencyWidth + leftIconCurrencyMargin + xPadding;
		yCurrentLineStart = priceBox.y + yPadding;
		SVGtoPDF(doc, secondIcon, xCurrentLineStart, yCurrentLineStart, {width: svgViewBox, height: svgViewBox});
		doc.fontSize(priceFontSize)
			.fillOpacity(1)
			.fillColor('white')
			.font('Bold')
			.text(secondPrice, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (lineHeight - priceFontSize)/2, {
				lineBreak: false,
			});
		SVGtoPDF(doc,
			iconCurrency,
			xCurrentLineStart + svgViewBox + svgMarginRight + secondPriceWidth - iconCurrencyWidth,
			yCurrentLineStart + 2 + (lineHeight - iconCurrencyHeight)/2,
			{width: iconCurrencyWidth, height: iconCurrencyHeight});

		yCurrentLineStart += lineHeight + bottomPriceMargin;
		doc.fontSize(descFontSize)
			.fillOpacity(1)
			.fillColor('white')
			.font('Regular')
			.text(secondDesc, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart + (lineHeight - descFontSize)/2, {
				lineBreak: false,
			});
	}

	private generateLine(doc: PDFKit.PDFDocument, term: TCommercialTerms, isNdsInclude: boolean, lineBox: {x: number, y: number, width: number, height: number}) {

		const fontSize = 14;
		const text = term.params[0] // + ', ' + term.additional;

		doc.rect(lineBox.x, lineBox.y, lineBox.width, lineBox.height).fillOpacity(1).fill('#A7CF7B');

		doc.fontSize(fontSize)
			.fillOpacity(1)
			.fillColor('white')
			.font('Regular')
			.text(text, lineBox.x, lineBox.y + (lineBox.height - fontSize) / 2, {
				width: lineBox.width,
				height: lineBox.height,
				align: 'center',
				lineBreak: false,
			});
	}

	private generateOccupiedState(doc: PDFKit.PDFDocument, stateText: string, position: {x: number, y: number, width: number}) {

		const icon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M11 7H13V9H11V7ZM11 11H13V17H11V11ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white"/>\n' +
			'</svg>\n';

		const svgViewBox = 24;
		const svgMarginTop = 2;
		const svgMarginRight = 8;
		const fontSize = 14;
		const lineHeight = 21;

		SVGtoPDF(doc, icon, position.x, position.y + svgMarginTop, {width: svgViewBox, height: svgViewBox});
		doc.fontSize(fontSize)
			.fillOpacity(0.8)
			.fillColor('white')
			.font('Bold')
			.text(stateText, position.x + svgViewBox + svgMarginRight, position.y + (lineHeight - fontSize)/2, {
				width: position.width,
				lineGap: 3.5
			});
	}

}
