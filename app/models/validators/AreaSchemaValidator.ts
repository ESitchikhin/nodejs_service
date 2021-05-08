import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealtyObject} from "../entities/inputData";
import {InfoBlockValidator} from "./InfoBlockValidator";
import {InMemoryIDBRepository} from "../InMemoryIDBRepository";

export class AreaSchemaValidator extends InfoBlockValidator implements IInfoBlockValidator {
	inputData: TInputData
	buildingId: string
	areaId: string
	offerId: string

	constructor(inputData: TInputData, buildingId, areaId, offerId) {
		super()
		this.inputData = inputData;
		this.buildingId = buildingId;
		this.areaId = areaId;
		this.offerId = offerId;
	}

	getErrors(): TBlockError[] | null {
		const area: TRealtyObject = this._getRealtyObjectById(this.buildingId, this.areaId);
		const resultErrors: TBlockError[] = [];
		let currentError: TBlockError = null;

		if(!area) {
			return [{
				dataType: "inputData",
				property: 'data',
				message: 'ID помещения задано неверно'
			}]
		}

		const schema = InMemoryIDBRepository._setSchemaImage(area.medias);
		if(schema.url.length === 0) {
			currentError = {
				dataType: "object",
				property: 'medias',
				message: 'схема помещения не задана'
			}
			resultErrors.push(currentError);
		}

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
