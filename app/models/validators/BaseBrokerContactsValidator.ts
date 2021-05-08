import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData} from "../entities/inputData";

export class BaseBrokerContactsValidator implements IInfoBlockValidator {
	inputData: TInputData

	constructor(inputData: TInputData) {
		this.inputData = inputData;
	}

	getErrors(): TBlockError[] | null {
		const broker = this.inputData.broker;
		const resultErrors: TBlockError[] = [];
		const currentError: TBlockError = null;
		const pattern  = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

		if(!broker) {
			return [{
				dataType:"broker",
				property: '',
				message: 'Данные не переданы'
			}]
		}

		/*if(!broker.phone || broker.phone.length > 18) {
			currentError = {
				dataType:"broker",
				property: 'phone',
			};
			resultErrors.push(currentError)
		}

		if(!broker.name || broker.name.length > 150) {
			currentError = {
				dataType:"broker",
				property: 'name',
			};
			resultErrors.push(currentError)
		}*/

		/*if(!broker.email || broker.email.length > 60 || !pattern.test(broker.email.toLowerCase())) {
			currentError = {
				dataType:"broker",
				property: 'email',
			};
			resultErrors.push(currentError)
		}*/
		return resultErrors.length > 0 ? resultErrors : null;
	}
}
