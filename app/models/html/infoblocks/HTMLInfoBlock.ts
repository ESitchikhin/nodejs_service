import path from "path";
import fs from "fs";
import {logger} from "../../../utils/logger";
import {IHTMLInfoBlock, TOptionsIBCreator} from "../../entities/entities";

/**
 * Абстрактный класс, который реализует метод создания итогового html
 * для текущего инфо-блока.
 *
 * Каждый наследующий его класс должен реализовать методы
 * - createHtmlContent() - заполнение переменнтой content нужным html-контентом
 *
 * При этом каждый инфо-блок самостоятельно определяет, как получить данные
 * чтобы сгенерировать итоговый html-контент, и какие данные он должен подгрузить.
 *
 * Строитель инфо-блоков ответственный за то, чтобы подгрузить текущий
 * html-шаблон, реализующий данный инфо-блок в шаблоне Строителя. Шаблон можно
 * задать либо файлом шаблона (передав имя файла в конструктор Инфо-блока), либо
 * строковыми данными (передав эту строку в конструктор).
 *
 * InfoBlock определяет входную инфформацию, которую должен подготовить Строитель:
 * это должен быть объект типа <TOptionsIBCreator>
 *
 */

export abstract class HTMLInfoBlock implements IHTMLInfoBlock {

	// Свойства, содержащие входящий дизайн html-инфоблока
	private readonly isInFile: boolean;
	protected htmlDoc: string | null;
	protected htmlContent: string | null;

	// Исходящий html, который должны создавать наследники класса путем
	// наполнения входящего шаблона данными, подгруженными из внешних сервисов
	protected htmlResult: string = '';
	protected isGenerated: boolean = false;

	// Свойства, содержащие ошибки при заполнении инфо-блока, если есть ошибки,
	// то метод getHtml шаблон выдает пустую строку
	protected error: boolean = false;
	protected errorCode: string = 'OK';
	protected errorMessage: string = '';

	protected constructor(options: TOptionsIBCreator) {

		// Загрузка начальных данных в зависимости от способа передачи
		if(options.filename) {
			this.htmlDoc = path.join(process.cwd(), '/static/', options.filename);
			this.htmlContent = null;
			this.isInFile = true;

		} else if(options.content) {
			this.htmlDoc = null;
			this.htmlContent = options.content;
			this.isInFile = false;

		} else {
			this.htmlDoc = null;
			this.htmlContent = null;
			this.error = true;
			this.errorCode = 'Опции для создания Инфо-блока не заданы';

		}
	}

	/**
	 * Возвращает результирующий статичный html-документ с заполненными данными
	 * получеными нужным образом для каждого из инфо-блоков pdf-шаблона
	 */
	async getHtml(): Promise<string> {
		// Если результат еще не сгенерирован, то генерируем результирующий контент
		if(!this.isGenerated) {
			await this.generateHtmlResult();
		}

		// В случае ошибки возвращаем пустую строку
		if(this.error) {
			logger.errorLog(`HTMLInfoBlock.GetHtml() - ${this.errorCode}`, this.errorMessage).then(r => false);
			return '';
		}

		// Иначе возвращаем html-результат
		return this.htmlResult;
	}

	/**
	 * Абстрактный метод генерации html-результирующего шаблона, который должен реализовывать
	 * каждый наследник IHTMLInfoBlock
	 */
	abstract async generateHtmlResult(): Promise<void>;

	/**
	 * Возвращает входящий контент, установленный Строителем для данного инфо-блока
	 */
	protected getInputContent(): string {
		return this.isInFile ? this.getContentFromFile() : this.getContentFromInput();
	}

	//  ----------------------------------------------------
	// |                                                    |
	// |                Приватные методы                    |
	// |                                                    |
	//  ----------------------------------------------------

	private getContentFromFile(): string {
		let content: string;

		try {
			content = fs.readFileSync(this.htmlDoc, 'utf8');
		} catch(err) {
			logger.errorLog(err);
		}

		return content;
	}

	private getContentFromInput(): string {
		return this.htmlContent;
	}
}
