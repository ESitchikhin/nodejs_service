import {PDFInfoBlock} from "./PDFInfoBlock";
import {IBaseBrokerContacts, IBuildingHeader, TOptionsIBCreator} from "../../entities/entities";
import {TBrokerData, TBuilding, TFeature, TMedia} from "../../entities/storedData";
import PDFDocument from "pdfkit";
import SVGtoPDF from 'svg-to-pdfkit';
import path from "path";
import {randomString, splitString} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import sharp from "sharp";

type TPageParams = {
	patternFooter: string,
	fioArray: string[],
	personalPhone: string,
	emailName: string,
	emailDomain: string,
	desc: string
}

export class PDFBaseBrokerContacts extends PDFInfoBlock implements IBaseBrokerContacts {
	avatarUrl: string | null;
	fio: string;
	email: string;
	personalPhone: string | null;
	desc: string;

	constructor(options: TOptionsIBCreator, brokerData: TBrokerData) {
		super();
		this.avatarUrl = brokerData.avatarUrl;
		this.fio = brokerData.fio;
		this.email = brokerData.email;
		this.personalPhone = brokerData.personalPhone;
		this.desc = brokerData.desc
	}

	async getParams(): Promise<TPageParams> {
		const splitEmail = this.email.split('@');
		return  {
			patternFooter: '/static/img/footerPattern.png',
			fioArray: splitString(this.fio, 21),
			personalPhone: this.personalPhone ? this.personalPhone : '',
			emailName: splitEmail[0] + '@',
			emailDomain: splitEmail[1],
			desc: this.desc
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();
		const svgIcon = '<svg viewBox="0 0 208 196" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<rect width="208" height="196" fill="#F3F3F3"/>\n' +
			'<path d="M149.989 124.25H149.636L104.273 150.576L103.989 150.989L58 124.25V70.75L58.3644 70.7041L103.92 44.2294L103.989 44L149.989 70.75V124.25Z" fill="#C0D886"/>\n' +
			'<path d="M137.677 107.136V78.0569L104.023 58.4877V44L58 70.7615L70.5506 78.0569L95.5266 63.5234L129.09 82.9779V111.999L137.677 107.136Z" fill="#008054"/>\n' +
			'<path d="M70.357 88.1055V117.184L103.977 136.73L104.023 150.989L150 124.216L137.7 117.069L112.678 131.672L79.0809 112.16V83.0469L70.357 88.1055Z" fill="#008054"/>\n' +
			'<path d="M79.0924 83.0467L95.39 73.5718L107.895 80.8213L91.6089 90.2963L79.0924 83.0467Z" fill="#008054"/>\n' +
			'<path d="M91.6088 90.273L107.85 80.8096V95.4349L91.6088 104.784V90.273Z" fill="#4DA32F"/>\n' +
			'<path d="M104.046 111.999L120.4 102.501V117.069L104.046 126.693V111.999Z" fill="#4DA32F"/>\n' +
			'<path d="M91.5861 104.773L107.85 95.332L120.355 102.536L104.068 112.011L91.5861 104.773Z" fill="#008054"/>\n' +
			'<path d="M95.3672 73.5604L120.366 88.0366V117.104L129.124 111.999V82.9321L95.4925 63.5005L70.5279 78.0455L58 70.7386V124.239L104 151H104.034V136.662L70.414 117.161V88.0825L95.3672 73.5604Z" fill="#7BBB58"/>\n' +
			'</svg>\n';
		const svgWidth = 208;
		const svgHeight = 196;
		const xBlockPadding = 106;
		const yBlockPadding = 200;
		const blockWidth = doc.page.width - 2 * xBlockPadding;
		const blockHeight = doc.page.height - 2 * yBlockPadding + 1;

		doc.image(path.join(process.cwd(), pageParams.patternFooter), 0, 0, {fit: [doc.page.width, doc.page.height], align: 'center', valign: 'center'});
		doc.rect(xBlockPadding, yBlockPadding, blockWidth, blockHeight)
			.fill('white');

		SVGtoPDF(doc, svgIcon, xBlockPadding, yBlockPadding, {width: svgWidth, height: svgHeight});

		const lines = [
			{
				name: 'name',
				height: 21,
				fontSize: 24,
				marginBottom: 4
			},
			{
				name: 'description',
				height: 21,
				fontSize: 14,
				marginBottom: 8,
			},
			{
				name: 'phone',
				height: 21,
				fontSize: 14,
				marginBottom: 0,
			},
			{
				name: 'email',
				height: 21,
				fontSize: 14,
				marginBottom: 0,
			}
		]

		const xTextLineStart = xBlockPadding + svgWidth + 90;
		let yCurrentLineStart = yBlockPadding + 52;
		const textWidth = blockWidth - svgWidth + 90 - 25;

		lines.forEach(line => {
			let lineCount = 1;

			if(line.name === 'name') {
				lineCount = 0;

				pageParams.fioArray.forEach(fioLine => {
					const textWidth = doc.fontSize(line.fontSize).font('Bold').widthOfString(fioLine);
					const gradientHeader = doc.linearGradient(
						xTextLineStart,
						yCurrentLineStart,
						xTextLineStart + textWidth,
						yCurrentLineStart)
						.stop(0, '#008054')
						.stop(1, '#B4D88B');

					doc.fontSize(line.fontSize)
						.fill(gradientHeader)
						.font('Bold')
						.text(fioLine, xTextLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
							lineBreak: false,
						});

					yCurrentLineStart += line.height;
				});

			}
			if(line.name === 'description' || line.name === 'phone') {
				const text = line.name === 'description' ? pageParams.desc : pageParams.personalPhone;
				const font = line.name === 'description' ? 'Regular' : 'Bold'

				doc.fontSize(line.fontSize)
					.fillColor('#434343')
					.font(font)
					.text(text, xTextLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: textWidth,
						height: line.height,
						lineBreak: false,
					});
			}
			if(line.name === 'email') {
				const textWidth = doc.fontSize(line.fontSize).font('Bold').widthOfString(pageParams.emailName);
				doc.fontSize(line.fontSize)
					.fillColor('#434343')
					.font('Bold')
					.text(pageParams.emailName, xTextLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: textWidth,
						height: line.height,
						lineBreak: false,
					});

				const widthBlock = 350;

				const xTextStart = xTextLineStart + textWidth;
				const gradientTextWidth = doc.fontSize(line.fontSize).font('Bold').widthOfString(pageParams.emailDomain);
				const gradientHeader = doc.linearGradient(
					xTextStart,
					yCurrentLineStart,
					xTextStart + gradientTextWidth,
					yCurrentLineStart)
					.stop(0, '#008054')
					.stop(1, '#B4D88B');

				doc.fontSize(line.fontSize)
					.fill(gradientHeader)
					.font('Bold')
					.text(pageParams.emailDomain, xTextStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						width: gradientTextWidth + 5,
						height: line.height,
						lineBreak: false,
					});

			}

			// doc.rect(xBlcok, yCurrentLineStart, widthBlock, 1).fillOpacity(0.9).fill('red');
			// doc.rect(xBlcok, yCurrentLineStart + line.height, widthBlock, 1).fillOpacity(0.9).fill('red');
			yCurrentLineStart += lineCount * line.height + line.marginBottom;
		});


		return doc;
	}

}
