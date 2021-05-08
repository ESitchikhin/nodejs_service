import PdfService from '../services/PdfService';
import {EPdfTemplates, TRequestedBlock, TValidationResult} from "../models/entities/entities";
import {TBlock, TInputData, TTemplate} from "../models/entities/inputData";
import {TemplateFactory} from "../models/TemplateFactory";
import request from 'request';
import {logger} from "../utils/logger";
import {generateUUID} from "../utils/uuid";
import path from "path";
import fs from 'fs';
import FormData from 'form-data';
import http from 'http';
import axios, {AxiosRequestConfig} from "axios";

interface IPDFCreatePayload {
	fileLink: string,
	fileName: string,
}


class PdfController {
	/**
	 * Принцип работы сервиса:
	 *    1. Получив заброс определяем упорядоченный список инфо-блоков, которые нужно будет напечатать в pdf-презентацию
	 *    2. Создаем html-документ будущей презентации c помощью сервиса PdfService.getHtmlDocument, на вход задается
	 *        - дизайн-шаблон
	 *        - список инфо-блоков
	 *
	 * @param req
	 * @param res
	 */
	async createPdf(req, res) {
		const status: number = 204;
		const requestedBlocks: TRequestedBlock[] = [];
		const callback: {url: string, port: number, protocol: string} = req.callback;
		const presentationId: string = req.body.presentationId;

		const inputData: TInputData = req.body;
		const template: string = inputData.templateId;
		switch (template) {
			case EPdfTemplates.REO: break;
			case EPdfTemplates.test: break;
			case EPdfTemplates.REOPerfect: break;
			default: return res.status(400).send();
		}

		const validator = TemplateFactory.getValidator(template);
		if(validator) {
			const validationResult = validator.validate(inputData.blocks, inputData);
			if(validationResult.failure) {
				return res.status(400).send(validationResult.blocksWithErrors.filter(block => block.errors));
			}
		}

		setImmediate(async () => {
			// Создаем массив запрошенных блоков типа IBlockRequest
			inputData.blocks.forEach(block => {
				const options = {
					building: block.realtyId,
					area: `${block.realtyObjectId}_${block.realtyOfferId}`
				}
				requestedBlocks.push({name: block.blockId, options})
			});

			// Создаем PDF-файл путем рендеринга [вариант генерации PDF из html-документа откланен заказчиком]
			const pdfResult = await PdfService.getPDFByPDFKit(template, requestedBlocks, inputData);
			PdfService.clearTemporaryFiles();

			// Отправляем созаднный документ на заданный callback-сервис
			// Для этого: 
			// 1. Конфигурируем урл и заголовки колбек-сервиса
			const cbUrl = new URL(callback.protocol + '://' + callback.url + '/' + presentationId);
			const options: FormData.SubmitOptions = {
				protocol: cbUrl.protocol === 'http:' ? 'http:' : "https:",
				host: cbUrl.hostname,
				port: cbUrl.port || '80',
				path: cbUrl.pathname,
				method: 'POST',
			}
			// 2. Если на callback-сервисе требуется авторизация, то указываем данные в заголовке 
			// [Ключ и значение Заголовков устанавливается переменными окружения при запуске сервиса] 
			if(process.env.CLIENT_ID && process.env.CLIENT_KEY) {
				options.headers = {
					[process.env.CLIENT_ID_HEADER]: process.env.CLIENT_ID,
					[process.env.CLIENT_KEY_HEADER]: process.env.CLIENT_KEY,
				};
			}

			// 3. Создаем FormData с файлом и отправляем на принимающий колбэк-сервис
			const form = new FormData();
			form.append('file', fs.createReadStream(pdfResult.pdfFile), {contentType: 'application/pdf', filename: 'presentation.pdf'});
			form.submit(options, (err, res) => {
				if(err)  {
					console.log('callback error:', {
						error: err,
						responseHeaders: res?.headers,
						statusCode: res?.statusCode,
						presentationId,
						fileName: pdfResult.pdfFile});
				}
				else {
					console.log('callback response:', {
						responseHeaders: res?.headers,
						statusCode: res?.statusCode,
						presentationId,
						fileName: pdfResult.pdfFile});
				}
				fs.unlinkSync(pdfResult.pdfFile);
			});
		});
		res.status(status).send();
	}

	async getAvailableTemplates(req, res) {
		const status: number = 200;
		const inputData: TInputData = req.body as TInputData;
		const dataType = inputData.dataType;
		const templates: TTemplate[] = [];

		switch (dataType) {
			case "multipleOffers":
				templates.push({id: 'real_estate_offer_template', name: 'Предложение помещений'});
				break;
			case "singleOffer":
				templates.push({id: 'real_estate_offer_template', name: 'Предложение помещений'});
				break;
		}
		return res.status(status).json({
			dataType,
			templates,
		});
	}

	async getAvailableBlocks(req, res) {
		const status: number = 200;
		const inputData: TInputData = req.body as TInputData;
		const templateId: string = inputData.templateId;
		const validator = TemplateFactory.getValidator(templateId);
		const blocks: TBlock[] = PdfService.createBlocksOfTemplate(templateId, inputData);
		let validationResult:  TValidationResult;
		if(validator) {
			validationResult = validator.validate(blocks, inputData);
		} else {
			validationResult = {
				failure: true,
				blocksWithErrors: [],
			};
		}

		return res.status(status).json({
			blocks: validationResult.blocksWithErrors
		});
	}

	async getPdfFile(req, res) {
		const fileId = req.params.fileId;
		const fileName = path.join(process.cwd(), 'static/result/', fileId + '.pdf');
		res.download(fileName,  err => {
			if(!err) {
				fs.unlinkSync(fileName);
			}
		});
	}

}

const instance = new PdfController();
export default instance;
