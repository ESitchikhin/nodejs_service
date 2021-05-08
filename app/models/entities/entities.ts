import {TBlock, TBlockError, TBroker, TCustomer, TInputData} from "./inputData";
import {TArea, TBrokerData, TBuilding, TCommercialParam, TCommercialTerms, TFeature, TMedia} from "./storedData";
import PDFDocument = PDFKit.PDFDocument;

//  -----------------------------------------------------------------------------------
// |
// | Здесь перечислены все типы сущностей, участвующих в работе программы. Принцип реализации:
// | 1. Фабрика строителей - создает нужного строителя инфо-блоков в зависимости от запрошенного паттерна
// | 2. Строитель - создает все инфо-блоки реализуемого им паттерна, задав им html-шаблоном
// |
//  -----------------------------------------------------------------------------------


export interface IValidator {
	validate(blocks: TBlock[], inputData: TInputData): TValidationResult | null;
}

export type TValidationResult = {
	failure: boolean,
	blocksWithErrors: TBlock[],
}


export interface IInfoBlockValidator {
	inputData: TInputData,
	getErrors(): TBlockError[] | null
}


// **********************************************************************
/**
 * Тип сущности Инфо-блок на верхнем уровне абстракции, данный интерфейс реализует абстрактный класс InfoBlock от
 * которого наследуются все остальные классы инфо-блоков
 */
export interface IHTMLInfoBlock {
	getHtml(): Promise<string>,
}

// **********************************************************************
/**
 * Тип сущности Инфо-блок на верхнем уровне абстракции, данный интерфейс реализует абстрактный класс InfoBlock от
 * которого наследуются все остальные классы инфо-блоков
 */
export interface IPDFInfoBlock {
	getPDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFDocument>,
}


// **********************************************************************

export enum EPdfTemplates {
	REO = 'real_estate_offer_template',
	test = 'test_template',
	REOPerfect = 'offer_perfect_template',
}

// **********************************************************************
export enum EBlockNames {
	Header = 'header',
	BuildingHeader = 'building_header',
	BuildingLocation = 'building_location',
	BuildingInfo = 'building_info',
	BuildingPhoto = 'building_photo',
	AreaCommercial = 'area_commercial',
	AreaPhoto = 'area_photo',
	AreaSchema = 'area_schema',
	BrokerContacts = 'broker_contacts',
}

// **********************************************************************
/**
 * Опции для создания инфоблока, задают начальный html-шаблон для инфоблока,
 * который должен создать Строитель - это его зона ответственности
 */
export type TOptionsIBCreator = {
	filename: string | null,
	content: string | null,
}

// **********************************************************************
/**
 * Характеристика чего-либо
 */
export type TCharacteristic = {
	icon?: string
	param: string,
	value: string,
}

//  -----------------------------------------------------------------------------------
// |
// | Зона ответственности инфоблока - загрузить собственные данные
// | (предполагается, что из API, но теоретически это может быть и база данных),
// | которые ему необходимы и построить выходной html опираясь на входящий шаблон.
// |
// | Входящий шаблон задается объектом типа TOptionsIBCreator
// |
//  -----------------------------------------------------------------------------------

/**
 * Инфоблок Заголовок презентации
 */
export interface IBaseHeader {
	name: string | null,
}

/**
 * Инфоблок Контакты брокера
 */
export interface IBaseBrokerContacts {
	avatarUrl: string | null,
	fio: string,
	email: string,
	personalPhone: string | null,
}

/**
 * Инфоблок Подвал презентации
 */
export interface IBaseFooter extends IHTMLInfoBlock {
	address: string,
	commonPhone: string,
}

/**
 * Инфоблок Заголовок Здания
 */
export interface IBuildingHeader {
	mainPhotoFile: {
		name: string,
		url: string
	};
	prefix: string;
	name: string;
	location: string;
	isSubway: boolean;
	subwayStations: string;
	roads: string;
	features: TFeature[];
}

/**
 * Инфоблок Расположение Здания
 */
export interface IBuildingLocation {
	location: string;
	subwayStations: string;
	isSubway: boolean;
	roads: string;
	distance: number;
	description: string;
	map: {
		lat: number,
		lng: number
	}
}

/**
 * Инфоблок Описание Здания
 */
export interface IBuildingInfo {
	prefix: string;
	keyFeatures: TFeature[],
	characteristics: TCharacteristic[],
}

/**
 * Инфоблок Фотографии Здания
 */
export interface IBuildingPhoto {
	isGreyscale: boolean,
	photos: TMedia[],
}


/**
 * Инфоблок Коммерческое предложение помещения
 */
export interface IAreaCommercial {
	areaCommercial: {
		isNdsInclude: boolean,
		operationType: string,
		purpose: string,
		layout: string,
		terms: TCommercialTerms[],
		params: TCommercialParam[],
		areaFeatures: string[],
		state: string,
		floor: string,
		pricePerMonth: string,
		priceTotal: string,
		pricePerSquare: string,
	},
	areaPrimaryPhoto: TMedia
}

/**
 * Инфоблок Фотографии помещения
 */
export interface IAreaPhoto {
	photos: TMedia[],
	isGreyscale: boolean
}

/**
 * Инфоблок Фотографии помещения
 */
export interface IAreaSchema {
	schema: TMedia,
}


// **********************************************************************
/**
 * Строитель иИнфоблоков
 */
export interface IBlocksBuilder {
	template: string,
	data: IInfoBlockDataRepository,

	getInfoBlock(TRequestedBlock): IHTMLInfoBlock | IPDFInfoBlock | null,
	getHeaderInstance(): IHTMLInfoBlock | IPDFInfoBlock,
	getBuildingHeaderInstance(building: string): IHTMLInfoBlock | IPDFInfoBlock,
	getBuildingLocationInstance(building: string): IHTMLInfoBlock | IPDFInfoBlock,
	getBuildingInfoInstance(building: string): IHTMLInfoBlock | IPDFInfoBlock,
	getBuildingPhotoInstance(building: string): IHTMLInfoBlock | IPDFInfoBlock,
	getAreaCommercialInstance(building: string, area: string): IHTMLInfoBlock | IPDFInfoBlock,
	getAreaPhotoInstance(building: string, area: string): IHTMLInfoBlock | IPDFInfoBlock,
	getAreaSchemaInstance(building: string, area: string): IHTMLInfoBlock | IPDFInfoBlock,
	getBrokerContactsInstance(): IHTMLInfoBlock | IPDFInfoBlock,
}

// **********************************************************************
/**
 * Генератор доступных инфоблоков
 */
export interface IBlocksGenerator {
	inputData: TInputData,
	getInfoBlocks(): TBlock[],
}


// **********************************************************************
/**
 * Тип, которым описывается каждый инфоблок во входящем запросе
 */
export type TRequestedBlock = {
	name: string,
	options?: { [key: string]: string },
}


//  -----------------------------------------------------------------------------------
// |
// | Интерфейс репозитория данных, которые должны быть реализованы
// | любым объектом, адаптер между сырыми данными и данными, используемыми
// | строителем инфоблоков при их загрузке
// |
//  -----------------------------------------------------------------------------------
/**
 * Интерфейс Помещения в Здании для репозитория данных
 */
export interface IInfoBlockDataRepository {
	setInputData(data: TInputData): void;
	getPresentationName(): string,
	getBaseLogoLink(): string,
	getGreyscalePhotoFlag(): boolean,

	getBuildingData(buildingId: string): TBuilding,
	getAreaData(buildingId: string, areaId: string): TArea,
	getBrokerData(): TBrokerData
}
