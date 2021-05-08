import {TCharacteristic} from "./entities";
import {TAllInfrastructures, TCustomer} from "./inputData";


// **********************************************************************
// *
// * Объект хранилища данных
// *
// **********************************************************************


export type TStoredData = {
	isGreyscalePhotos: boolean,
	isNdsInclude: boolean,
	baseHeaderData: {
		name: string | undefined,
		logoLink: string | undefined,
	},
	baseBrokerContacts: TBrokerData
	buildings: {[key: string]: TBuilding}
}

export type TBrokerData = {
	avatarUrl: string | undefined,
	fio: string
	email: string
	personalPhone: string | undefined,
	desc: string
}

export type TFeature = {
	name: string,
	svgSuffixWhite?: string,
	svgSuffixBlack?: string,
	svgSuffixOffset?: number,
	svgSuffixMarginTop?: number,
	desc: string,
	width: number,
	order: number,
}



//  -----------------------------------------------------------------------------------
export type TBuilding = {
	buildingHeader: {
		prefix: string
		name: string,
		features: TFeature[],
	},
	buildingLocation: {
		location: string,
		isSubway: boolean,
		subwayStations: string | null,
		roads: string | null,
		distance: number,
		description: string;
		infrastructure: {key: TAllInfrastructures, svg: string}[],
		map: {
			lat: number,
			lng: number
		},
	},
	buildingInfo: {
		keyFeatures: TFeature[],
		characteristics: TCharacteristic[],
	},
	buildingPhotos: TMedia[],
	buildingPrimaryPhoto: {
		name: string,
		url: string
	}
	areas: {[key: string]: TArea}
}


//  -----------------------------------------------------------------------------------
export type TArea = {
	areaCommercial: {
		isNdsInclude: boolean,
		operationType: string,
		purpose: string,
		layout: string,
		terms: TCommercialTerms[],
		params: TCommercialParam[],
		areaFeatures: string[],
		state: string,
		occupiedState: string,
		floor: string,
		pricePerMonth: string,
		priceTotal: string,
		pricePerSquare: string,
	},
	areaPhotos: TMedia[],
	areaPrimaryPhoto: {
		name: string,
		url: string
	},
	areaSchema: TMedia
}

export type TCommercialParam = {
	svg: '',
	name: 'floorHeight' | 'power' | 'square',
	value: string,
	description: string,
	position: number
}
export type TCommercialTerms = {
	name: string,
	params: string[],
	additional?: string,
}

//  -----------------------------------------------------------------------------------
export type TMedia = {
	name: string,
	url: string,
	width?: number,
	height?: number,
}
