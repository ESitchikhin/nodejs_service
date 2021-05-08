import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty, TRealtyObject} from "../entities/inputData";
import {InMemoryIDBRepository} from "../InMemoryIDBRepository";
import {InfoBlockValidator} from "./InfoBlockValidator";

export class AreaPhotoValidator extends InfoBlockValidator implements IInfoBlockValidator {
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

		const photos = InMemoryIDBRepository._setPhotos(area.medias);
		if(photos.length < 3) {
			currentError = {
				dataType: "object",
				property: 'medias',
				message: 'слишком мало фото, должно быть не менее 3-х'
			}
			resultErrors.push(currentError);
		}

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
