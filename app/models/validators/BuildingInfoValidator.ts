import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty} from "../entities/inputData";
import {InfoBlockValidator} from "./InfoBlockValidator";
import {InMemoryIDBRepository} from "../InMemoryIDBRepository";

export class BuildingInfoValidator extends InfoBlockValidator implements IInfoBlockValidator {
	inputData: TInputData
	buildingId: string

	constructor(inputData: TInputData, id) {
		super();
		this.inputData = inputData;
		this.buildingId = id;
	}

	getErrors(): TBlockError[] | null {
		const realty: TRealty = this._getRealtyById(this.buildingId);
		const resultErrors: TBlockError[] = [];
		let currentError: TBlockError = null;

		if(!realty) {
			return [{
				dataType: "inputData",
				property: 'data',
				message: 'ID объекта задано неверно'
			}]
		}

		if(!realty.building.floors) {
			currentError = {
				dataType: "realty",
				property: 'building.floors',
			}
			resultErrors.push(currentError);
		}

		const info = InMemoryIDBRepository._setBuildingInfo(realty);
		if(info.characteristics.length > 0 && info.characteristics.length < 3) {
			currentError = {
				dataType: "realty",
				property: 'inner',
				message: 'слишком мало характеристик, должно быть не менее 3'
			}
			resultErrors.push(currentError);
			currentError = {
				dataType: "realty",
				property: 'land',
				message: 'слишком мало характеристик, должно быть не менее 3'
			}
			resultErrors.push(currentError);
			currentError = {
				dataType: "realty",
				property: 'entry',
				message: 'слишком мало характеристик, должно быть не менее 3'
			}
			resultErrors.push(currentError);
			currentError = {
				dataType: "realty",
				property: 'communicate',
				message: 'слишком мало характеристик, должно быть не менее 3'
			}
			resultErrors.push(currentError);
			currentError = {
				dataType: "realty",
				property: 'parking',
				message: 'слишком мало характеристик, должно быть не менее 3'
			}
			resultErrors.push(currentError);
			currentError = {
				dataType: "realty",
				property: 'lift',
				message: 'слишком мало характеристик, должно быть не менее 3'
			}
			resultErrors.push(currentError);
		}

		resultErrors.push(...this._keyFeatureValidating(realty));

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
