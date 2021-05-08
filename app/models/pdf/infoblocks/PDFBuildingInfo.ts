import {PDFInfoBlock} from "./PDFInfoBlock";
import {
	IBuildingHeader,
	IBuildingInfo,
	IBuildingLocation,
	TCharacteristic,
	TOptionsIBCreator
} from "../../entities/entities";
import {TBuilding, TFeature} from "../../entities/storedData";
import SVGtoPDF from 'svg-to-pdfkit';
import path from "path";
import {getStringWidth, randomString, splitString, toCase} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import sharp from "sharp";
import {TAllInfrastructures} from "../../entities/inputData";
import {unitFormat} from "../../../utils/unit-format";
type TParamsCharacteristic = {
	icon?: string
	paramArray: string[],
	valueArray: string[],
}

type TPageParams = {
	header: string,
	characteristics: TParamsCharacteristic[][],
	keyFeatures: TFeature[]
}

export class PDFBuildingInfo extends PDFInfoBlock implements IBuildingInfo {
	prefix: string;
	keyFeatures: TFeature[];
	characteristics: TCharacteristic[];

	constructor(options: TOptionsIBCreator, buildingData: TBuilding) {
		super();
		this.prefix = buildingData.buildingHeader.prefix;
		this.keyFeatures = buildingData.buildingInfo.keyFeatures;
		this.characteristics = buildingData.buildingInfo.characteristics;
	}

	async getParams(): Promise <TPageParams> {
		const characteristics = [
			[],
			[],
			[]
		]
		let leftCharacts = this.characteristics.length;
		for (let i = 0; i < 3; i++) {
			const charactArray = [];
			let j = 0
			for (; j < leftCharacts / (3 - i); j++) {
				const currentCharacteristic = this.characteristics[this.characteristics.length - leftCharacts + j];
				const paramArray: string[] = splitString(currentCharacteristic.param, 21);
				const valueArray: string[] = splitString(currentCharacteristic.value, 26);
				charactArray.push({
					icon: currentCharacteristic.icon,
					paramArray,
					valueArray
				});
			}
			leftCharacts = leftCharacts - j;
			characteristics[i] = charactArray;
		}
		return {
			header: `О ${this.prefix.toLowerCase().split(' ').map(word => toCase(word, 'п')).join(' ')}`,
			characteristics,
			keyFeatures: this.keyFeatures,
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();

		const lines = [
			{
				name: 'header',
				height: 40,
				fontSize: 40,
				marginBottom: 35
			},
			{
				name: 'features',
				height: 45,
				marginBottom: 31,
			},
			{
				name: 'subHeader',
				height: 24,
				fontSize: 24,
				marginBottom: 25,
			},
			{
				name: 'characteristics',
				height: 0,
				marginBottom: 0,
				paramLineHeight: 14,
				marginLineBottom: 24,
				valueLineHeight: 14.4,
				marginValueTop: 4,
			}
		]

		const xTextPadding = 103;
		const widthBlock: number =  doc.page.width - 2 * xTextPadding;
		const heightBlock: number = lines.reduce((height, line) => {
			if(line.name === 'characteristics') {
				let maxHeight = 0;
				pageParams.characteristics.forEach(characts => {
					let columnHeight = 0
					characts.forEach(characteristic => {
						columnHeight += characteristic.paramArray.reduce((height) => height + line.paramLineHeight, 0);
						if(characteristic.valueArray.length > 0) {
							columnHeight += line.marginValueTop;
							columnHeight += characteristic.valueArray.reduce((height) => height + line.valueLineHeight, 0)
						}
						columnHeight += line.marginLineBottom;
					});
					maxHeight = columnHeight > maxHeight ? columnHeight : maxHeight;
				})
				return line.height = height + maxHeight;
			}
			return height + line.height + line.marginBottom;
		}, 0);
		const yTextPadding = (doc.page.height - heightBlock) / 2;

		let xCurrentLineStart = xTextPadding;
		let yCurrentLineStart = yTextPadding;

		doc.fillOpacity(0.8).image(path.join(process.cwd(), '/static/img/pattern.png'), 0, 0, {height: doc.page.height, width: 507});

		lines.forEach(line => {

			if(line.name === 'header') {
				const textWidth = doc.fontSize(line.fontSize).font('Bold').widthOfString(pageParams.header);
				const xTextStart = xTextPadding;
				const yTextStart = yCurrentLineStart;
				const gradientHeader = doc.linearGradient(
					xTextStart,
					yTextStart,
					xTextStart + (textWidth < widthBlock ? textWidth : widthBlock),
					yTextStart)
					.stop(0, '#008054')
					.stop(1, '#B4D88B');

				doc.fontSize(line.fontSize)
					.fillOpacity(1)
					.fill(gradientHeader)
					.font('Bold')
					.text(pageParams.header, xCurrentLineStart, yCurrentLineStart, {
						lineBreak: false,
					});
			}

			if(line.name === 'features') {

				const featurePadding = 20;
				let xCurrentFeature = xCurrentLineStart;

				pageParams.keyFeatures.forEach((feature, number) => {

					const currentFeatureWidth = feature.width + (number === 0 ? 1 : 2) * featurePadding;

					const textWidth = doc.fontSize(24).font('Bold').widthOfString(feature.name.toString());
					const xTextStart = number === 0 ? xCurrentFeature : xCurrentFeature + featurePadding;
					const yTextStart = yCurrentLineStart;
					const gradient = doc.linearGradient(
						xTextStart,
						yTextStart,
						xTextStart + (textWidth < widthBlock ? textWidth : widthBlock),
						yTextStart)
						.stop(0, '#008054')
						.stop(1, '#B4D88B');

					doc.fontSize(24)
						.fill(gradient)
						.font('Bold')
						.text(feature.name, xTextStart, yTextStart, {
							width: feature.width,
							lineBreak: false,
						});

					if(feature.svgSuffixBlack) {
						SVGtoPDF(doc,
							feature.svgSuffixBlack,
							xCurrentFeature + (number === 0 ? 0 : featurePadding) + feature.svgSuffixOffset,
							yCurrentLineStart + feature.svgSuffixMarginTop);
					}

					doc.fontSize(14)
						.fillColor('#7B7B7B')
						.font('Regular')
						.text(feature.desc, number === 0 ? xCurrentFeature : xCurrentFeature + featurePadding, yCurrentLineStart + 24 + 3, {
							width: feature.width,
							lineBreak: false,
						});

					xCurrentFeature += currentFeatureWidth
				});
			}

			if(line.name === 'subHeader') {
				const gradientHeader = doc.linearGradient(xTextPadding, yCurrentLineStart, xTextPadding + 282, yCurrentLineStart)
					.stop(0, '#008054')
					.stop(1, '#B4D88B');

				doc.fontSize(line.fontSize)
					.fill(gradientHeader)
					.font('Bold')
					.text('Ключевые особенности', xCurrentLineStart, yCurrentLineStart + (line.height - line.fontSize) / 2, {
						lineBreak: false,
					});
			}

			if(line.name === 'characteristics') {
				const yCharacteristicsStart = yCurrentLineStart;
				const columnCharacteristicsWidth = widthBlock / pageParams.characteristics.length;

				pageParams.characteristics.forEach(characts => {
					yCurrentLineStart = yCharacteristicsStart;

					characts.forEach(characteristic => {

						const svgViewBox = 24;
						const svgMarginRight = 8;
						const svgMarginTop = -2;

						SVGtoPDF(doc,
							characteristic.icon,
							xCurrentLineStart,
							yCurrentLineStart + svgMarginTop, {
								width: svgViewBox,
								height: svgViewBox
							});

						characteristic.paramArray.forEach(param => {
							doc.fontSize(14)
								.fillColor('#7B7B7B')
								.fillOpacity(1)
								.font('Regular')
								.text(param, xCurrentLineStart + svgViewBox + svgMarginRight, yCurrentLineStart, {
									width: columnCharacteristicsWidth - svgViewBox - svgMarginRight,
									lineBreak: false,
								});
							yCurrentLineStart += line.paramLineHeight;
						});

						if(characteristic.valueArray.length > 0) {
							yCurrentLineStart += line.marginValueTop;
							characteristic.valueArray.forEach((value, index, array) => {
								doc.fontSize(12)
									.fillColor('#7B7B7B')
									.fillOpacity(0.7)
									.font('Regular')
									.text(value,
										xCurrentLineStart + svgViewBox + svgMarginRight,
										yCurrentLineStart + (line.valueLineHeight - 12) / 2,
										{
											width: columnCharacteristicsWidth - svgViewBox - svgMarginRight,
											lineBreak: false,
										});
								yCurrentLineStart += line.valueLineHeight;
							});
						}
						yCurrentLineStart += line.marginLineBottom;
					});

					xCurrentLineStart += columnCharacteristicsWidth;
				});

			}

			// doc.rect(xCurrentLineStart, yCurrentLineStart, widthBlock, 1).fillOpacity(0.9).fill('red');
			// doc.rect(xCurrentLineStart, yCurrentLineStart + line.height, widthBlock, 1).fillOpacity(0.9).fill('red');
			yCurrentLineStart += line.height + line.marginBottom;
		});



		return doc;
	}

}
