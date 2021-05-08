import {
	EPdfTemplates,
	IBlocksBuilder, IBlocksGenerator,
	IInfoBlockDataRepository,
} from './entities/entities';
import {ReoHTMLBuilder} from "./html/ReoHTMLBuider";
import {TInputData} from "./entities/inputData";
import ReoBlocksGenerator from "./ReoBlocksGenerator";
import ReoValidator from "./ReoValidator";
import {ReoPDFBuilder} from "./pdf/ReoPDFBuilder";

export class TemplateFactory {
	private readonly currentTemplate: string;
	private readonly data: IInfoBlockDataRepository;

	constructor(template: number | string, dataRepository: IInfoBlockDataRepository) {
		this.currentTemplate = typeof template === "string" ? template : EPdfTemplates[template];
		this.data = dataRepository;
	}


	/**
	 * Статический метод фабрики, возвращающий Строителя для заданного шаблона инфоблоков
	 */
	static getHTMLBlocksBuilder(currentTemplate: string, data: IInfoBlockDataRepository): IBlocksBuilder {
		switch (currentTemplate) {
			case EPdfTemplates.REO:
				return new ReoHTMLBuilder(currentTemplate, data);
			case EPdfTemplates.test:
				return new ReoHTMLBuilder(currentTemplate, data);
		}
		return null;
	}

	static getPDFBlocksBuilder(currentTemplate: string, data: IInfoBlockDataRepository): IBlocksBuilder {
		switch (currentTemplate) {
			case EPdfTemplates.REO:
				return new ReoPDFBuilder(currentTemplate, data);
			case EPdfTemplates.test:
				return new ReoPDFBuilder(currentTemplate, data);
		}
		return null;
	}

	static getBlocksGenerator(currentTemplate: string, inputData: TInputData): IBlocksGenerator {
		switch (currentTemplate) {
			case EPdfTemplates.REO:
				return new ReoBlocksGenerator(inputData);
			case EPdfTemplates.test:
				return new ReoBlocksGenerator(inputData);
		}
		return null;
	}

	// Статичный фабричный метод, возвращающий валидатор для заданного шаблона презентации
	static getValidator(templateId: number | string) {
		const template = typeof templateId === 'number' ? EPdfTemplates[templateId] : templateId;
		switch (template) {
			case EPdfTemplates.REO:
				return new ReoValidator();
			case EPdfTemplates.test:
				return new ReoValidator();
		}
		return null;
	}
}


