import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealty} from "../entities/inputData";
import {InMemoryIDBRepository} from "../InMemoryIDBRepository";
import {InfoBlockValidator} from "./InfoBlockValidator";

export class BuildingPhotoValidator extends InfoBlockValidator implements IInfoBlockValidator {
	inputData: TInputData
	buildingId: string

	constructor(inputData: TInputData, id) {
		super()
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

		const photos = InMemoryIDBRepository._setPhotos(realty.medias);
		if(photos.length < 3) {
			currentError = {
				dataType: "realty",
				property: 'medias',
				message: 'слишком мало фото, должно быть не менее 3-х'
			}
			resultErrors.push(currentError);
		}

		return resultErrors.length > 0 ? resultErrors : null;
	}

}
