import {IInfoBlockValidator} from "../entities/entities";
import {TBlockError, TInputData, TRealtyObject, TRealtyOffer} from "../entities/inputData";
import {InfoBlockValidator} from "./InfoBlockValidator";
import {InMemoryIDBRepository} from "../InMemoryIDBRepository";

export class AreaCommercialValidator extends InfoBlockValidator implements IInfoBlockValidator {
	inputData: TInputData
	buildingId: string
	areaId: string
	offerId: string

	constructor(inputData: TInputData, buildingId, areaId, offerId) {
		super();
		this.inputData = inputData;
		this.buildingId = buildingId;
		this.areaId = areaId;
		this.offerId = offerId;
	}

	getErrors(): TBlockError[] | null {
		const area: TRealtyObject = this._getRealtyObjectById(this.buildingId, this.areaId);
		const offer: TRealtyOffer = this._getRealtyOfferById(this.buildingId, this.areaId, this.offerId);
		const resultErrors: TBlockError[] = [];
		let currentError: TBlockError = null;

		if(!area || !offer) {
			return [{
				dataType: "inputData",
				property: 'data',
				message: 'ID помещения или предложения указаны неверно'
			}]
		}

		if(offer.operation !== 'rent' && offer.operation !== 'sell') {
			currentError = {
				dataType: "offer",
				property: 'operation',
			};
			resultErrors.push(currentError)
		}

		if(area.info.spaceLayout !== 'mixed'
			&& area.info.spaceLayout !== 'open'
			&& area.info.spaceLayout !== 'rooms') {

			currentError = {
				dataType: "object",
				property: 'info.spaceLayout',
			};
			resultErrors.push(currentError)
		}

		if(typeof area.info.floor === "undefined") {
			currentError = {
				dataType: "object",
				property: 'info.floor',
			};
			resultErrors.push(currentError)
		}

		if(!offer.forCustomer.priceMeter) {
			currentError = {
				dataType: "offer",
				property: 'forCustomer.priceMeter',
			};
			resultErrors.push(currentError)
		}

		if(!area.info.squareOffer) {
			currentError = {
				dataType: "object",
				property: 'info.squareOffer',
			};
			resultErrors.push(currentError)
		}

		if(!offer.forCustomer.priceMeter) {
			currentError = {
				dataType: "offer",
				property: 'forCustomer.priceMeter',
			};
			resultErrors.push(currentError)
		}

		if(area.info.state !== 'unknown'
			&& area.info.state !== 'clean'
			&& area.info.state !== 'cosmetic'
			&& area.info.state !== 'ready') {

			currentError = {
				dataType: "object",
				property: 'info.state',
			};
			resultErrors.push(currentError)
		}

		return resultErrors.length > 0 ? resultErrors : null;
	}
}
