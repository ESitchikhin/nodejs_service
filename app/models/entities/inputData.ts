type TInputDataForTemplates = {
	dataType: "singleOffer" | "multipleOffers" | "singleObject" | "multipleObjects" | "singleRealty" | "multipleRealties",
	data: TRealty []
	flag
}

// **********************************************************************
// *
// * Входные данные
// *
// **********************************************************************
/**
 * Описание входных данных в репозиторий инфоблоков (описание всех типов данных)
 */
export type TInputData = {
	presentationId: string,
	dataType: TDataType
	templateId: string,
	isGreyscalePhotos: boolean,
	isNdsInclude: boolean,
	data?: TRealty[],
	broker?: TBroker,
	blocks?: TBlock[],
}

export type TDataType = 'singleOffer' | 'multipleOffers' | 'singleObject' |	'multipleObjects' | 'singleRealty' |	'multipleRealties';

export type TBroker = {
	phone: string
	email: string
	name: string
	description: string
}

export type TBlock = {
	realtyId: string | null,
	realtyObjectId: string | null,
	realtyOfferId: string | null,
	blockId: string,
	isOptional: boolean,
	name: string | undefined,
	svg: string | undefined,
	errors?: TBlockError[] | null,
}

export type TBlockError = {
	dataType: 'realty' | 'object' | 'offer' | 'broker' | 'agency' | 'inputData',
	property: string,
	message?: string,
}

export type TAgency = {
	svgIcon: string
	name: string
	phone: string
	email: string
}

// **********************************************************************
// **********************************************************************

// структура данных ответа c endpoint
// POST : /api/v1/pdf/get-templates/
export type TResponseTemplates = {
	dataType: TDataType
	templates: TTemplate[]
}

export type TTemplate = {
	id: string,
	name: string,
}

// структура данных ответа c endpoint
// POST : /api/v1/pdf/get-blocks/
export type TResponseBlocks = {
	blocks: TBlock[],
}

// структура данных ответа c endpoint POST : /api/v1/pdf/create/
// если данные проходят валидацию, то отправляется ответ с кодом 204,
// иначе отправляется ответ с кодом 400
// после создания презентации, pdf-файл отправлется на вебхук


// **********************************************************************
// **********************************************************************

export type TRealty = {
	id: string,
	name: string,
	prefix: string,

	markets: EMarkets,
	realtyType: 'other' | 'multistorey' | 'lowRise' | 'underground' | 'nonCapital' | 'groundArea' | undefined,
	buildingType: 'other' | 'groundArea' | 'cottage' | 'mansion' | 'residentialBuilding' | 'productionBuilding'
		| 'officeBuilding' | 'warehouseBuilding' | 'hotelBuilding' | 'retailBuilding' | 'officeWarehouseBuilding'
		| 'retailOfficeBuilding' | 'retailFunBuilding' | 'hotelBusinessBuilding' | 'multifunctionalBuilding' | undefined,
	taxSvcNumber: number,
	buildingClass: number,
	buildingClassLetter: string,

	land: TRealtyLand,
	building: TBuildingInfo,
	inner: TBuildingInner,
	outer: TBuildingOuter,
	communicate: TCommunicate,
	lift: TLift,
	parking: TParking,
	lux: TLux,
	entry: TEntry,
	features: TFeatures,

	address: TRealtyAddress,
	medias: TEntityMedia[],

	realtyObjects: TRealtyObject[]

	[key: string]: any,
}

type EMarkets = 'none' | 'offices' | 'warehouses' | 'retail' | 'apartments' | 'flats' | 'countryHouses';

//  -----------------------------------------------------------------------------------

type TRealtyLand = {
	area: number,
	category?: 'none' | 'agricultural' | 'settlements' | 'industryTransportCommunications',
	purpose: 'none'| 'agricultural' | 'businessManagement' | 'commonUseArea' | 'highriseBuildings'
		| 'hotelAmenities' | 'individualHousingConstruction' | 'industry' | 'leisure' | 'lowriseHousing'
		| 'publicUseOfCapitalConstruction' | 'serviceVehicles' | 'shoppingCenters' | 'warehouses';
	electricity: ELandCommunications,
	gas: ELandCommunications,
	sewerages: ELandCommunications,
	watersupply: ELandCommunications,
	entryWays: 'none' | 'asphalt' | 'dirt',
	note: string,
}
type ELandCommunications = 'none' | 'inside' | 'onTheEdge' | 'no';

//  -----------------------------------------------------------------------------------

type TBuildingInfo = {
	status?: 'project' | 'complete' | 'building' | 'demolished',
	buildYear?: number,
	reBuildYear?: number,
	squareTotal?: number,
	squareUsefull?: number,
	floors?: number,
	material?: 'none' | 'aerocreteBlock' | 'block' | 'boards' | 'brick' | 'foamConcreteBlock'
		| 'gasSilicateBlock' | 'monolith' | 'monolithBrick' | 'old' | 'panel' | 'stalin' | 'wireframe'
		| 'wood' | 'metalwork' | 'sandwichPanel' | 'angar',
	note?: string
}

//  -----------------------------------------------------------------------------------

type TBuildingInner = {
	ceilingHeight?: number
	floorLoad?: number
	powerType?: 'none' | 'central' | 'autonomous' | 'no'
	powerAmount?: number
	powerAmountPerMeter?: number
	autonomPowerSupliesCount?: number
	autonomPowerSupliesNote?: string
	ventilation: 'none' | 	'natural' | 	'supply' | 	'supplyExhaust'
	ventilationNote?: string
	airConditioning: 'none' |	'unknown' |	'split' |	'multiSplit' |	'vrf' |	'chillerFancoil'
	airConditioningNote: string
	fireSafety: 'none' |	'alarm' |	'autoFireFightingSystem'
	autoFireFightingSystem: 'none' | 'aerosol' | 'water' | 'powder' | 'gas' | 'foam'
	fireSafetyNote: string
	heating?: 'none' | 'central' | 'autonomous' | 'no'
	heatingNote?: string
	waterSupply?: 'none' | 'central' | 'autonomous' | 'no'
	hotWater?: 'none' | 'no' | 'centralOpen' | 'centralClosed' | 'autonomous'
	waterSupplyNote?: string
	note?: string
}

//  -----------------------------------------------------------------------------------

type TBuildingOuter = {
	type?: undefined,
	territoryArea?: number,
	infrastructure?: string,
	note?: string,
	anons?: string
}
export type TAllInfrastructures = 'none' | 'groceryStore' | 'groceryMarket' | 'fastfood' | 'cafe' | 'restaurant'
	| 'bar' | 'tradeCenter' | 'cinema' | 'childrenGarden' | 'childrenPlayground' | 'school'
	| 'childGoodsMarket' | 'medicine' | 'fitnes' | 'waterpool' | 'carService' | 'carWash' | 'bankomat'
	| 'park' | 'openWater';


//  -----------------------------------------------------------------------------------

type TCommunicate = {
	phoneProviders: number,
	internetProviders: number,
	note: string,
	anons: string,
}

//  -----------------------------------------------------------------------------------

type TLift = {
	type: string,
	passengerLifts: number,
	freightLifts: number,
	passengerWaitingTime: number,
	freightTonnage: number,
	note: string,
	anons: string,
}

//  -----------------------------------------------------------------------------------

type TParking = {
	type?: TParkingTypes,
	placesTotal?: number,
	note?: string,
	anons?: string,
}

type TParkingTypes = 'none' | 'natural' | 'freeOpen' | 'freeClosedWarm' | 'freeClosedCold' | 'paidOpen' | 'paidClosedCold' |
	'paidClosedWarm' | 'outsideTerritory' | 'onTerritory' | 'underground' | 'roof';

//  -----------------------------------------------------------------------------------

type TLux = {}

//  -----------------------------------------------------------------------------------
type TEntry = {
	type?: string,
	note?: string,
	anons?: string
}
type TAllEntryTypes = 'none' | 'reception' | 'security' | 'postControl' | 'alarm' | 'video' | 'concierge' |
	'secureDoor' | 'ams';
//  -----------------------------------------------------------------------------------

type TFeatures = {
	type: string
	note: string,
	anons: string
}
type allFeatureTypes = 'none' | 'cleaning' |	'engineering' |	'independedPower' |	'anyInternet';

//  -----------------------------------------------------------------------------------
type TRealtyAddress = {
	id: string,
	lat: number,
	lng: number,
	route?: string
	countryId?: string,
	regionId?: string,
	fullAddress?: string,
	gd: TGeoDecoding;
	subwayStations: TSubwayStation[],
	highways: THighways[]
}

type TGeoDecoding = {
	house?: string,
	route?: string,
	sublocality?: string,
	locality?: string,
	administrativeArea2?: string,
	administrativeArea1?: string,
	country: string,
	postalCode: string
}

type TSubwayStation = {
	id: string,
	name: string,
	lineId: string,
	lineName: string,
	lineNumber: string,
	distance: number
}

type THighways = {
	id: string
	name?: string
	idString?: string
	idNum?: number
	prefix?: string
	lat: number
	lng: number
	countryId?: string
	regionId?: string
	distance?: number
}

//  -----------------------------------------------------------------------------------

export type TEntityMedia = {
	hash: string,
	type: 'privateDocument' | 'other' | 'mainImage' | 'commonImage' | 'planImage' | 'video' | 'flash' | 'vector' | 'publicDocument',
	groupName: string,
	groupId: string,
	name: string,
	description: string,
	order: number,
	isPrimary: boolean
}

// **********************************************************************
// **********************************************************************


export type TRealtyObject = {
	id: string,
	webId?: number,

	markets: string,

	info: TRealtyObjectInfo,
	lessee: TLessee,
	medias: TEntityMedia[]
	realtyOffers: TRealtyOffer[]
}

export type TMarketsTypes = 'none' | 'offices' | 'warehouses' | 'retail' | 'apartments' | 'flats' | 'countryHouses';
//  -----------------------------------------------------------------------------------

type TRealtyObjectInfo = {
	features: string,
	squareTotal: number,
	squareOffer: number,
	squareMin: number,
	floor: number,
	floorsCount: number,
	roomsCount: number,
	floorsHeight: number,
	roomNumber: string,
	state: 'unknown' |	'ready' |	'cosmetic' |	'clean',
	spaceLayout: 'undefined' | 'other' | 'rooms' | 'open' | 'mixed',
	purposes: string,
	currentPurpose: 'none' | 	'office' | 	'workSpace' | 	'psn' | 	'bank' | 	'cafe' | 	'restaurant'
		| 'canteen' | 	'fastFood' | 	'fitnes' | 	'retail' | 	'showRoom' | 	'salesOffice'
		| 'pharmacy' | 	'gasStation' | 	'medicalService' | 	'beautySalon' | 'openGround'
		| 'warehouse' | 	'safeKeeping' | 'production' | 'autoService' |  'apartments'
		| 'flat' | 	'room' | 	'cottage' | 'townhouse' | 'groundArea',
	waterPoint: 'none' | 'missing' | 'present' | 'inside' | 'onFloor' | 'inBuilding' | 'near',
	waterPointCount: number,
	parking: string,
	parkingCarPlaces: number,
	parkingNote: string,
	power: number,
	note: string,
}

export type RealtyObjectInfoFeatures = 'none' | 'noWindows' | 'ownEntrance' | 'wholeBuilding' | 'noLift' | 'personalLift' | 'socleFloor' | 'mansard' | 'loggia';


type TLessee = {
	occupied: boolean,
	occupiedAt: Date,
	releaseAt: Date,
	longDuration: boolean,
	companyName: string,
	companyDescription: string,
	incomeInMonth: number,
	note: string,
}

// **********************************************************************
// **********************************************************************

export type TRealtyOffer = {
	id: string,
	status: 'off' | 'notModerated' | 'active',
	objectId: string,
	operation: 'none' | 'rent' | 'sell',
	market: EMarkets,
	forCustomer: TCustomer
}

export type TCustomer = {
	taxType: 'none' | 'usn' | 'nds',
	boma?: number,
	priceMeter?: number,
	priceIncludes: string
	priceExcludes: string
	offerContractType: 'none' | 'sell' | 'directRent' | 'subRent'
	depositeValue: number,
	depositeType: 'none' | 	'amount' | 	'month' | 	'percent',
	rentDurationValue: number,
	rentDurationType: 'none' | 'days' | 'months' | 'years' | 'tillDate',
	rentDurationDate: string,
	note?: string
}

export type TPriceAdditional = 'operational' | 'utilities' | 'water' | 'electricity' | 'security' | 'parking';
