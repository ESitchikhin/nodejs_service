import {
	IBlocksGenerator,
	IHTMLInfoBlock,
	IInfoBlockDataRepository,
	IPDFInfoBlock,
	TRequestedBlock
} from "../models/entities/entities";
import htmlPdf from 'html-pdf';
import {TemplateFactory} from "../models/TemplateFactory";
import {InMemoryIDBRepository} from "../models/InMemoryIDBRepository";
import path from "path";
import fs from 'fs';
import {TBlock, TInputData} from "../models/entities/inputData";
import PDFDocument from "pdfkit";
import {generateUUID} from "../utils/uuid";
import {logger} from "../utils/logger";
import {randomString} from "../utils/string-utils";
import getStream from 'get-stream';

/*
 * Сервисный класс, содержит набор статических методов для выполнения сервисных функций web-сервиса
 *
 */
export default class PdfService {

	/**
	 * Создает правильную последовательность Инфоблоков, заданную шаблоном
	 *
	 * @param templateId
	 * @param inputData
	 */
	static createBlocksOfTemplate(templateId: string, inputData: TInputData): TBlock[] {
		const blockGenerator: IBlocksGenerator = TemplateFactory.getBlocksGenerator(templateId, inputData);
		return blockGenerator.getInfoBlocks();
	}

	/**
	 * Очищает временные файлы из заданной директории,
	 * если передан null, то из '/static/img/tmp/'
	 * @param inputDir
	 */
	static clearTemporaryFiles(inputDir: string = null) {
		const dir = inputDir || path.join(process.cwd(), '/static/img/tmp/');
		const files = fs.readdirSync(dir);
		for (const i in files){
			const name = dir + '/' + files[i];
			if (fs.statSync(name).isDirectory()){
				PdfService.clearTemporaryFiles(name);
			} else {
				fs.unlinkSync(name);
			}
		}
	}


	/**
	 * Возвращает html-документ по заданному шаблону, заданному списку инфоблоков и с массивом сырых данных
	 *
	 * @param template
	 * @param requestedBlocks: TRequestedBlock[]
	 * @param inputData: TInputData
	 */
	static async getHtmlDocument(template: string, requestedBlocks: TRequestedBlock[], inputData: TInputData): Promise<string> {
		let resultHtml: string = '';

		// Создаем репозиторий данных для инфоблоков и загужаем начальные данные
		const repository: IInfoBlockDataRepository = new InMemoryIDBRepository();
		repository.setInputData(inputData);

		// Получаем Строителя Инфоблоков для запрашиваемого шаблона и объекта
		const blocksBuilder = TemplateFactory.getHTMLBlocksBuilder(template, repository);

		// Проходим упорядоченный массив запрошеных пользователем инфоблоков, создаем инстанс,
		// а затем геренируем html content данного инфоблока и добавляем его к контенту всего документа
		if(blocksBuilder !== null) {
			for (let i = 0; i < requestedBlocks.length; i++) {
				const currentInfoBlock = blocksBuilder.getInfoBlock(requestedBlocks[i]);
				if('getHtml' in currentInfoBlock) {
					resultHtml += await (currentInfoBlock as IHTMLInfoBlock).getHtml();
				}
			}
		}

		const header = fs.readFileSync(path.join(process.cwd(), '/static/', template,'_header.html'));
		const footer = fs.readFileSync(path.join(process.cwd(), '/static/', template,'_footer.html'));

		resultHtml = header + resultHtml + footer;

		return resultHtml;
	}

	/**
	 * Сервис, который создает PDF из заданного html-документа с помощью html-pdf
	 * NOTE: нужно передать правильно сверстанный html-документ
	 * @param html
	 */
	static async createPdfByHtmlPdf(html): Promise<any> {
		let documentPdf;
		const options = {
			format: "A4",
			orientation: "landscape",
			border: 0,
		};
		const resultPdfFileName = path.join(process.cwd(), 'static/result', `html-pdf-${randomString(5)}.pdf`);

		documentPdf = await new Promise<any | null>(resolve => {
			htmlPdf.create(html, options).toFile(resultPdfFileName, (err, result) => {
				if(err) {
					logger.errorLog(err).then(res => {
						resolve(null);
					});
				} else {
					resolve(result);
				}
			});
		});

		return resultPdfFileName;
	}


	static async getPDFByPDFKit(template: string, requestedBlocks: TRequestedBlock[], inputData: TInputData): Promise<{ pdfFile: string, fileId: string, pdfBuffer: Buffer }> {
		const fileId = generateUUID();
		const resultPdfFileName = path.join(process.cwd(), 'static/result', `${fileId}.pdf`);

		// Создаем репозиторий данных для инфоблоков и загужаем начальные данные
		const repository: IInfoBlockDataRepository = new InMemoryIDBRepository();
		repository.setInputData(inputData);

		// Получаем Строителя Инфоблоков для запрашиваемого шаблона и объекта
		const blocksBuilder = TemplateFactory.getPDFBlocksBuilder(template, repository);

		// Проходим упорядоченный массив запрошеных пользователем инфоблоков, создаем инстанс,
		// а затем геренируем html content данного инфоблока и добавляем его к контенту всего документа
		if(blocksBuilder !== null) {
			const doc = new PDFDocument({
				layout: 'landscape',
				size: 'A4',
				margin: 0,
				autoFirstPage: false,
			});
			doc.registerFont('UltraThin', path.join(process.cwd(),'/static/fonts/MuseoSans/MuseoSansCyrl-100.ttf'));
			doc.registerFont('UltraThinItalic', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-100Italic.ttf'));
			doc.registerFont('Thin', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-300.ttf'));
			doc.registerFont('ThinItalic', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-300Italic.ttf'));
			doc.registerFont('Regular', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-500.ttf'));
			doc.registerFont('RegularItalic', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-500.ttf'));
			doc.registerFont('Bold', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-700.ttf'));
			doc.registerFont('BoldItalic', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-700Italic.ttf'));
			doc.registerFont('Black', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-900.ttf'));
			doc.registerFont('BlackItalic', path.join(process.cwd(), '/static/fonts/MuseoSans/MuseoSansCyrl-900Italic.ttf'));

			for (let i = 0; i < requestedBlocks.length; i++) {
				const currentInfoBlock = blocksBuilder.getInfoBlock(requestedBlocks[i]);
				if(currentInfoBlock) {
					await (currentInfoBlock as IPDFInfoBlock).getPDFDocument(doc);
					// Добавляем золотое сечение сверху
					// doc.image(path.join(process.cwd(), '/static/img/GoldenCanonGrid.png'), 0, 0, {height: 595.28, width: 841.89});
				}
			}
			const stream = doc.pipe(fs.createWriteStream(resultPdfFileName));
			doc.end();
			const buffer = await getStream.buffer(doc);

			const result: { pdfFile: string, fileId: string, pdfBuffer: Buffer } = await new Promise(resolve => {
				stream.on('finish', () => {
					resolve({
						pdfFile: resultPdfFileName,
						pdfBuffer: buffer,
						fileId,
					});
				})
			});

			return result;
		}
	}

}
