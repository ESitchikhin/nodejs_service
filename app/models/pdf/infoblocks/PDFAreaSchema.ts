import {PDFInfoBlock} from "./PDFInfoBlock";
import {
	IAreaSchema,
	TOptionsIBCreator
} from "../../entities/entities";
import {TArea, TBuilding, TFeature, TMedia} from "../../entities/storedData";
import SVGtoPDF from 'svg-to-pdfkit';
import path from "path";
import axios, {AxiosRequestConfig} from "axios";
import {randomString} from "../../../utils/string-utils";
import fs from "fs";
import {logger} from "../../../utils/logger";


type TPageParams = {
	floor: string,
	areaSchema: TMedia,
}


export class PDFAreaSchema extends PDFInfoBlock implements IAreaSchema {
	schema: TMedia;
	floor: string;

	constructor(options: TOptionsIBCreator, areaData: TArea) {
		super();
		this.schema = areaData.areaSchema;
		this.floor = areaData.areaCommercial.floor;
	}

	async getParams(): Promise <TPageParams> {
		const areaSchema = {...this.schema};

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
				let i = 0;
				while (!response.data.complete && i < 20) {
					i = await new Promise(resolve => setTimeout(() => resolve(i + 1), 50));
				}
				areaSchema.url = photoFile;
			} catch (err) {
				logger.errorLog(err);
			}
		}

		return  {
			floor: this.floor + ' этаж',
			areaSchema
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();
		const svgSubHeaderIcon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<circle cx="12" cy="12" r="12" fill="url(#paint0_linear)"/>\n' +
			'<path d="M12.6666 16H11.3333V14.6667H12.6666V16ZM14 13.3333H9.99998V17.3333H14V13.3333ZM16.6666 10.2V6.66667H14.6666V8.4L12 6L5.33331 12H7.33331L12 7.79333L16.6666 12H18.6666L16.6666 10.2Z" fill="white"/>\n' +
			'<defs>\n' +
			'<linearGradient id="paint0_linear" x1="4.91689e-08" y1="-4.24127e-05" x2="26.8618" y2="3.29373" gradientUnits="userSpaceOnUse">\n' +
			'<stop stop-color="#008054"/>\n' +
			'<stop offset="1" stop-color="#B4D88B"/>\n' +
			'</linearGradient>\n' +
			'</defs>\n' +
			'</svg>\n';

		const lines = [
			{
				name: 'subHeader',
				height: 21,
				fontSize: 18,
				marginBottom: 14
			},
			{
				name: 'header',
				height: 40,
				fontSize: 40,
				marginBottom: 73,
			},
			{
				name: 'schema',
				height: 0,
				marginBottom: 0
			}
		]
		const xPadding = 105;
		const yPadding = 50;
		const widthBlock = doc.page.width - 2 * xPadding
		let yCurrentLineStart = yPadding;

		lines.forEach(line => {

			if(line.name === 'subHeader') {
				const svgViewBox = 24;
				const svgMarginRight = 8;
				const svgMarginTop = (line.height - svgViewBox) / 2;

				SVGtoPDF(doc,
					svgSubHeaderIcon,
					xPadding,
					yCurrentLineStart + svgMarginTop, {
						width: svgViewBox,
						height: svgViewBox
					});

				doc.fontSize(line.fontSize)
					.font('Bold')
					.fillColor('#434343')
					.text(pageParams.floor, xPadding + svgViewBox + svgMarginRight, yCurrentLineStart);
			}

			if(line.name === 'header') {

					const textWidth = doc.fontSize(line.fontSize).font('Bold').widthOfString('Планировка помещения');
					const gradientTextWidth = doc.fontSize(line.fontSize).font('Bold').widthOfString('Планировка');
					const xTextStart = xPadding;
					const yTextStart = yCurrentLineStart;
					const gradientHeader = doc.linearGradient(
						xTextStart,
						yTextStart,
						xTextStart + (textWidth < widthBlock ? textWidth : widthBlock),
						yTextStart)
						.stop(0, '#008054')
						.stop(1, '#B4D88B');

					doc.fontSize(line.fontSize)
						.fill(gradientHeader)
						.font('Bold')
						.text('Планировка', xTextStart, yCurrentLineStart, {width: widthBlock, lineBreak: false})
						.fillColor('#434343')
						.text(' помещения', xTextStart + gradientTextWidth, yCurrentLineStart, {width: widthBlock - gradientTextWidth, lineBreak: false});

			}

			if(line.name === 'schema') {
				doc.image(path.join(process.cwd(), pageParams.areaSchema.url), xPadding, yCurrentLineStart, {fit: [pageParams.areaSchema.width, pageParams.areaSchema.height], align: "center", valign: 'center'});
			}


			// doc.rect(xCurrentLineStart, yCurrentLineStart, widthBlock, 1).fillOpacity(0.9).fill('red');
			// doc.rect(xCurrentLineStart, yCurrentLineStart + line.height, widthBlock, 1).fillOpacity(0.9).fill('red');
			yCurrentLineStart += line.height + line.marginBottom;
		});



		return doc;
	}

}
