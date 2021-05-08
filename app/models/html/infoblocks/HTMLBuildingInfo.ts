import {IBuildingInfo, TCharacteristic, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import {TBuilding, TFeature} from "../../entities/storedData";
import ejs from "ejs";
import {logger} from "../../../utils/logger";

export class HTMLBuildingInfo extends HTMLInfoBlock implements IBuildingInfo{
	prefix: string;
	keyFeatures: TFeature[];
	characteristics: TCharacteristic[];

	constructor(options: TOptionsIBCreator, buildingData: TBuilding) {
		super(options);
		this.prefix = buildingData.buildingHeader.prefix;
		this.keyFeatures = buildingData.buildingInfo.keyFeatures;
		this.characteristics = buildingData.buildingInfo.characteristics;
	}

	async generateHtmlResult(): Promise<void> {
		const characteristics = [
			[],
			[],
			[]
		]
		let leftChars = this.characteristics.length;
		for (let i = 0; i < 3; i++) {
			const charactArray = [];
			let j = 0
			for (; j < leftChars / (3 - i); j++) {
				charactArray.push(this.characteristics[this.characteristics.length - leftChars + j]);
			}
			leftChars = leftChars - j;
			characteristics[i] = charactArray;
		}
		const pageParams = {
			characteristics,
			keyFeatures: this.keyFeatures,
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
