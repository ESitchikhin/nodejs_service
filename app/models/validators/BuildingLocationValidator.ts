import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty} from "../entities/inputData";
import {InfoBlockValidator} from "./InfoBlockValidator";

export class BuildingLocationValidator extends InfoBlockValidator implements IInfoBlockValidator {
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

		if(!realty.address.lat) {
			currentError = {
				dataType: "realty",
				property: 'address.lat',
			}
			resultErrors.push(currentError);
		}

		if(!realty.address.lng) {
			currentError = {
				dataType: "realty",
				property: 'address.lng',
			}
			resultErrors.push(currentError);
		}


		if(realty.outer.anons.length > 255) {
			currentError = {
				dataType: "realty",
				property: 'outer.anons',
				message: 'слишком длинное описание, должно быть от 50 до 255 символов'
			}
			resultErrors.push(currentError);
		}

		if(realty.outer.anons.length < 50) {
			currentError = {
				dataType: "realty",
				property: 'outer.anons',
				message: 'слишком короткое описание, должно быть от 50 до 255 символов'
			}
			resultErrors.push(currentError);
		}

		resultErrors.push(...this._locationValidating(realty));

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
