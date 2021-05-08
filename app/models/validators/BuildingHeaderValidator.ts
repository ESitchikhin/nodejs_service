import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty} from "../entities/inputData";
import {InfoBlockValidator} from "./InfoBlockValidator";

export class BuildingHeaderValidator extends InfoBlockValidator implements IInfoBlockValidator {
	inputData: TInputData
	buildingId: string

	constructor(inputData: TInputData, buildingId) {
		super()
		this.inputData = inputData;
		this.buildingId = buildingId;
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

		if(!realty.prefix) {
			currentError = {
				dataType: "realty",
				property: 'prefix',
			}
			resultErrors.push(currentError);
		}

		if(!realty.name) {
			currentError = {
				dataType: "realty",
				property: 'name',
			}
			resultErrors.push(currentError);
		}

		resultErrors.push(...this._keyFeatureValidating(realty));
		resultErrors.push(...this._locationValidating(realty));

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
