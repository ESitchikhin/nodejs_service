import {IBaseBrokerContacts, TOptionsIBCreator} from "../../entities/entities";
import path from "path";
import {HTMLInfoBlock} from "./HTMLInfoBlock";
import axios, {AxiosRequestConfig} from "axios";
import {randomString} from "../../../utils/string-utils";
import fs from "fs";
import ejs from "ejs";
import {TBrokerData} from "../../entities/storedData";
import {logger} from "../../../utils/logger";

export class HTMLBaseBrokerContacts extends HTMLInfoBlock implements IBaseBrokerContacts {
	avatarUrl: string | null;
	fio: string;
	email: string;
	personalPhone: string | null;

	constructor(options: TOptionsIBCreator, brokerData: TBrokerData) {
		super(options);
		this.avatarUrl = brokerData.avatarUrl;
		this.fio = brokerData.fio;
		this.email = brokerData.email;
		this.personalPhone = brokerData.personalPhone;
	}

	async generateHtmlResult(): Promise<void> {
		const pageParams = {
			patternFooter: '/static/img/footerPattern.png',
			fio: this.fio,
			personalPhone: this.personalPhone,
			email: this.email,
		}

		this.htmlResult = await new Promise<any | null>(resolve => {

			ejs.renderFile(this.htmlDoc, pageParams, (err, html) => {
				if (err) {
					logger.errorLog(`Невозможно открыть файл ${this.htmlDoc}`);
					resolve('');
				} else {
					let renderHtml = html.replace(/img src=\"/g, 'img src="file://' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/link href=\"/g, 'link href="file://' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/url\(\"/g, 'url("file://' + path.join(process.cwd()));
					renderHtml = renderHtml.replace(/url\('/g, 'url(\'file://' + path.join(process.cwd()));
					resolve(renderHtml);
				}
			});
		});

		this.isGenerated = true;
	}



}
