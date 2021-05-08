import {IBaseHeader, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import fs from "fs";
import {logger} from "../../../utils/logger";
import ejs from "ejs";

export class HTMLBaseHeader extends HTMLInfoBlock implements IBaseHeader {
	name: string | null;


	constructor(options: TOptionsIBCreator, name, logoSvg) {
		super(options);
		this.name = name;

	}

	// Находит в шаблоне переменные {{ name }} и {{ logoLink }}
	// и заменяет их на значения в переменных.
	async generateHtmlResult(): Promise<void> {

		const pageParams = {
			headerTitle: this.name,
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
