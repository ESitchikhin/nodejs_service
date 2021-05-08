import {
	EPdfTemplates,
	IBlocksBuilder,
	IBaseHeader,
	IBaseBrokerContacts,
	IBuildingHeader,
	IBuildingLocation,
	IBuildingInfo,
	IBuildingPhoto,
	IAreaCommercial,
	IAreaPhoto,
	IInfoBlockDataRepository,
	IHTMLInfoBlock,
	EBlockNames,
	TRequestedBlock,
	IAreaSchema
} from "../entities/entities";
import path from "path";
import {HTMLBaseHeader} from "./infoblocks/HTMLBaseHeader";
import {HTMLBuildingHeader} from "./infoblocks/HTMLBuildingHeader";
import {HTMLBuildingLocation} from "./infoblocks/HTMLBuildingLocation";
import {HTMLBuildingInfo} from "./infoblocks/HTMLBuildingInfo";
import {HTMLBuildingPhoto} from "./infoblocks/HTMLBuildingPhoto";
import {HTMLAreaCommercial} from "./infoblocks/HTMLAreaCommercial";
import {HTMLAreaPhoto} from "./infoblocks/HTMLAreaPhoto";
import {HTMLAreaSchema} from "./infoblocks/HTMLAreaSchema";
import {HTMLBaseBrokerContacts} from "./infoblocks/HTMLBaseBrokerContacts";

/**
 * Класс Строитель должен реализовать создание инстансов каждого инфоблока
 * для того, чтобы клиент (сервис, который будет использовать инфоблоки)
 * мог создавать документ и генерировать pdf-документ, независимо от того,
 * какой шаблон выбрал пользователь.
 *
 * Все инфоблоки должны наследоваться от InfoBlock, чтобы клиент мог организовать
 * упорядоченный массив инфоблоков и сгенерировать интоговый документ не опираясь на
 * детали реализации каждого конкретного инфоблока.
 *
 * Задача Строителя - создать каждый из инфоблоков того шаблона, который данный Строитель реализует.
 * Для этого нужно в методах создания инфо-блоков Строителю нужно сформировать объект TOptionsIBCreator
 * и скормить его в конструктор инфо-блока. Создав инстанс, строитель должен вернуть его
 *
 */

export class ReoHTMLBuilder implements IBlocksBuilder {
	template: string;
	data: IInfoBlockDataRepository;

	constructor(currentTemplate: string, data: IInfoBlockDataRepository) {
		this.template = currentTemplate;
		this.data = data;
	}


	public getInfoBlock(requestedBlock: TRequestedBlock): IHTMLInfoBlock {
		let currentInfoBlock: IHTMLInfoBlock;

		switch (requestedBlock.name) {
			case EBlockNames.Header: currentInfoBlock = this.getHeaderInstance(); break;
			case EBlockNames.BuildingHeader: currentInfoBlock = this.getBuildingHeaderInstance(requestedBlock.options.building); break;
			case EBlockNames.BuildingLocation: currentInfoBlock = this.getBuildingLocationInstance(requestedBlock.options.building); break;
			case EBlockNames.BuildingInfo: currentInfoBlock = this.getBuildingInfoInstance(requestedBlock.options.building); break;
			case EBlockNames.BuildingPhoto: currentInfoBlock = this.getBuildingPhotoInstance(requestedBlock.options.building); break;
			case EBlockNames.AreaCommercial: currentInfoBlock = this.getAreaCommercialInstance(requestedBlock.options.building, requestedBlock.options.area); break;
			case EBlockNames.AreaPhoto: currentInfoBlock = this.getAreaPhotoInstance(requestedBlock.options.building, requestedBlock.options.area); break;
			case EBlockNames.AreaSchema: currentInfoBlock = this.getAreaSchemaInstance(requestedBlock.options.building, requestedBlock.options.area); break;
			case EBlockNames.BrokerContacts: currentInfoBlock = this.getBrokerContactsInstance(); break;
		}
		return currentInfoBlock;
	}

	// Базовые инфо-блоки документа
	public getHeaderInstance(): IHTMLInfoBlock {
		return new HTMLBaseHeader({
			filename:  path.join(this.template, 'header.ejs'),
			content: null,
		}, this.data.getPresentationName(), this.data.getBaseLogoLink());
	}

	public getBuildingHeaderInstance(building: string): IHTMLInfoBlock {
		return new HTMLBuildingHeader({
				filename: path.join(this.template, 'building-header.ejs'),
				content: null,
			},
			this.data.getBuildingData(building)
		);
	}

	public getBuildingLocationInstance(building: string): IHTMLInfoBlock {
		return new HTMLBuildingLocation({
				filename: path.join(this.template, 'building-location.ejs'),
				content: null,
			},
			this.data.getBuildingData(building)
		);
	}

	public getBuildingInfoInstance(building: string): IHTMLInfoBlock {
		return new HTMLBuildingInfo({
				filename: path.join(this.template, 'building-info.ejs'),
				content: null,
			},
			this.data.getBuildingData(building)
		);
	}


	public getBuildingPhotoInstance(building: string): IHTMLInfoBlock {
		return new HTMLBuildingPhoto({
				filename: path.join(this.template, 'photos.ejs'),
				content: null,
			},
			this.data.getBuildingData(building), this.data.getGreyscalePhotoFlag()
		);
	}


	public getAreaCommercialInstance(building: string, area: string): IHTMLInfoBlock {
		return new HTMLAreaCommercial({
				filename: path.join(this.template, 'area-commercial.ejs'),
				content: null,
			},
			this.data.getAreaData(building, area)
		);
	}


	public getAreaPhotoInstance(building: string, area: string): IHTMLInfoBlock {
		return new HTMLAreaPhoto({
				filename: path.join(this.template, 'photos.ejs'),
				content: null,
			},
			this.data.getAreaData(building, area), this.data.getGreyscalePhotoFlag()
		);
	}


	public getAreaSchemaInstance(building: string, area: string): IHTMLInfoBlock {
		return new HTMLAreaSchema({
				filename: path.join(this.template, 'area-schema.ejs'),
				content: null,
			},
			this.data.getAreaData(building, area)
		);

	}


	public getBrokerContactsInstance(): IHTMLInfoBlock {
		return new HTMLBaseBrokerContacts({
				filename: path.join(this.template, 'broker-contacts.ejs'),
				content: null,
			},
			this.data.getBrokerData(),
		);
	}

}



