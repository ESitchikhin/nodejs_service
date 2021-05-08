import {IHTMLInfoBlock, IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty} from "../entities/inputData";

export abstract class InfoBlockValidator {
	abstract inputData: TInputData

	protected _getRealtyById(realtyId: string): TRealty | null {
		for(const buildingNumber in this.inputData.data) {
			if(this.inputData.data[buildingNumber].id === realtyId) {
				return this.inputData.data[buildingNumber];
			}
		}
		return null;
	}

	protected _getRealtyObjectById(realtyId: string, realtyObjectId: string) {
		for(const buildingNumber in this.inputData.data) {
			if(this.inputData.data[buildingNumber].id === realtyId) {
				for (const areaNumber in this.inputData.data[buildingNumber].realtyObjects) {
					if (this.inputData.data[buildingNumber].realtyObjects[areaNumber].id === realtyObjectId) {
						return this.inputData.data[buildingNumber].realtyObjects[areaNumber];
					}
				}
			}
		}
		return null;
	}

	protected _getRealtyOfferById(realtyId: string, realtyObjectId: string, realtyOfferId: string) {
		for(const buildingNumber in this.inputData.data) {
			if(this.inputData.data[buildingNumber].id === realtyId) {
				for (const areaNumber in this.inputData.data[buildingNumber].realtyObjects) {
					if (this.inputData.data[buildingNumber].realtyObjects[areaNumber].id === realtyObjectId) {
						for(const offerNumber in this.inputData.data[buildingNumber].realtyObjects[areaNumber].realtyOffers) {
							if (this.inputData.data[buildingNumber].realtyObjects[areaNumber].id === realtyObjectId) {
								return this.inputData.data[buildingNumber].realtyObjects[areaNumber].realtyOffers[offerNumber];
							}
						}
					}
				}
			}
		}
		return null;
	}

	protected _locationValidating(realty: TRealty): TBlockError[] {
		const resultErrors: TBlockError[] = [];
		let currentError: TBlockError = null;

		if(!realty.address.fullAddress) {
			currentError = {
				dataType: "realty",
				property: 'address.fullAddress',
			}
			resultErrors.push(currentError);
		}

		if(!(realty.address.subwayStations && realty.address.subwayStations.length > 0)
			&& !(realty.address.highways && realty.address.highways.length > 0)) {
			currentError = {
				dataType: "realty",
				property: 'address.highways',
				message: 'Если не заданы станции метро, то должен быть задан хотя бы один проспект'
			}
			resultErrors.push(currentError);
		}

		if(realty.address.subwayStations) {
			realty.address.subwayStations.forEach((station, index) => {
				if(!station.name) {
					currentError = {
						dataType: "realty",
						property: 'address.subwayStations[' + index.toString() + '].name',
					}
					resultErrors.push(currentError);
				}
				if(!station.lineName) {
					currentError = {
						dataType: "realty",
						property: 'address.subwayStations[' + index.toString() + '].lineName',
					}
					resultErrors.push(currentError);
				}
				if(!station.distance) {
					currentError = {
						dataType: "realty",
						property: 'address.subwayStations[' + index.toString() + '].distance',
					}
					resultErrors.push(currentError);
				}
			});
		}

		if(realty.address.highways) {
			realty.address.highways.forEach((highway, index) => {
				if(!highway.name) {
					currentError = {
						dataType: "realty",
						property: 'address.highways[' + index.toString() + '].name',
					}
					resultErrors.push(currentError);
				}
				if(!highway.distance) {
					currentError = {
						dataType: "realty",
						property: 'address.highways[' + index.toString() + '].distance',
					}
					resultErrors.push(currentError);
				}
			});
		}

		return resultErrors;
	}

	protected _keyFeatureValidating(realty: TRealty): TBlockError[] {
		const resultErrors: TBlockError[] = [];
		let currentError: TBlockError = null;
		if(!realty.buildingClassLetter) {
			currentError = {
				dataType: "realty",
				property: 'buildingClassLetter',
			}
			resultErrors.push(currentError);
		}

		if(!realty.taxSvcNumber) {
			currentError = {
				dataType: "realty",
				property: 'taxSvcNumber',
			}
			resultErrors.push(currentError);
		}

		if(!realty.building.squareTotal) {
			currentError = {
				dataType: "realty",
				property: 'building.squareTotal',
			}
			resultErrors.push(currentError);
		}

		if(!realty.building.buildYear) {
			currentError = {
				dataType: "realty",
				property: 'building.buildYear',
			}
			resultErrors.push(currentError);
		}
		return resultErrors;
	}

}
