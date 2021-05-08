import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty} from "../entities/inputData";

export class BaseHeaderValidator implements IInfoBlockValidator {
	inputData: TInputData

	constructor(inputData: TInputData) {
		this.inputData = inputData;
	}

	getErrors(): TBlockError[] | null {
		const realties: TRealty[] = this.inputData.data;
		const resultErrors: TBlockError[] = [];
		let currentError: TBlockError = null;

		if(!realties.length) {
			currentError = {
				dataType:"realty",
				property: 'data',
				message: 'Не задано ни одного объекта'
			};
			resultErrors.push(currentError)
		}

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
