import {EBlockNames, IInfoBlockValidator, IValidator, TValidationResult} from "./entities/entities";
import {TBlock, TBlockError, TInputData} from "./entities/inputData";
import {BaseHeaderValidator} from "./validators/BaseHeaderValidator";
import {BuildingHeaderValidator} from "./validators/BuildingHeaderValidator";
import {BuildingLocationValidator} from "./validators/BuildingLocationValidator";
import {BuildingInfoValidator} from "./validators/BuildingInfoValidator";
import {BuildingPhotoValidator} from "./validators/BuildingPhotoValidator";
import {AreaCommercialValidator} from "./validators/AreaCommercialValidator";
import {AreaPhotoValidator} from "./validators/AreaPhotoValidator";
import {AreaSchemaValidator} from "./validators/AreaSchemaValidator";
import {BaseBrokerContactsValidator} from "./validators/BaseBrokerContactsValidator";

//  -----------------------------------------------------------------------------------
// |
// | Реализация валидатора входных данных для шаблона Real_estate_offer
// | Валидатор принимает список запрошенных инфоблоков и возвращает TBLockErrors
// |
//  -----------------------------------------------------------------------------------

export default class ReoValidator implements IValidator {

	public validate(blocks: TBlock[], inputData:TInputData): TValidationResult | null {
		const blocksWithErrors: TBlock[] = [];
		let failure: boolean = false;
		if(!blocks || blocks.length === 0) {
			return {
				failure: true,
				blocksWithErrors: []
			}
		}


		for(let i = 0; i < blocks.length; i++) {
			const ids = {
				template: blocks[i].blockId,
				building: blocks[i].realtyId,
				area: blocks[i].realtyObjectId,
				offer: blocks[i].realtyOfferId,
			};

			const currentInfoBlockValidator = ReoValidator.getInfoBlockValidator(ids, inputData);
			let errors: TBlockError[] | null = null;
			try {
				errors = currentInfoBlockValidator.getErrors();
			}
			catch (e) {
				errors = [{
					dataType: 'inputData',
					property: 'none',
					message: 'входные данные заданы неверно'
				}]
			}

			const resultBlock: TBlock = {
				...blocks[i],
				errors
			};
			if(resultBlock.errors) {
				failure = true;
			}
			blocksWithErrors.push(resultBlock);
		}

		return {
			failure,
			blocksWithErrors,
		};
	}

	//  -----------------------------------------------------------------------------------
	// |
	// | Валидаторы структуры ых давнных
	// |
	//  -----------------------------------------------------------------------------------


	//  -----------------------------------------------------------------------------------
	// |
	// | Приватные и статичные методы Валидатора (фабричный метод)
	// | на рефакторинге (если такой будет) нужно перенести в отдельных класс-билдер
	// |
	//  -----------------------------------------------------------------------------------

	private static getInfoBlockValidator(ids: { template: string, building: string, area: string, offer: string, },
	                                     inputData: TInputData) {
		let currentInfoBlock: IInfoBlockValidator;

		switch (ids.template) {
			case EBlockNames.Header: currentInfoBlock = ReoValidator.getHeaderInstance(inputData); break;
			case EBlockNames.BuildingHeader: currentInfoBlock = ReoValidator.getBuildingHeaderInstance(inputData, ids.building); break;
			case EBlockNames.BuildingLocation: currentInfoBlock = ReoValidator.getBuildingLocationInstance(inputData, ids.building); break;
			case EBlockNames.BuildingInfo: currentInfoBlock = ReoValidator.getBuildingInfoInstance(inputData, ids.building); break;
			case EBlockNames.BuildingPhoto: currentInfoBlock = ReoValidator.getBuildingPhotoInstance(inputData, ids.building); break;
			case EBlockNames.AreaCommercial: currentInfoBlock = ReoValidator.getAreaCommercialInstance(inputData, ids.building, ids.area, ids.offer); break;
			case EBlockNames.AreaPhoto: currentInfoBlock = ReoValidator.getAreaPhotoInstance(inputData, ids.building, ids.area, ids.offer); break;
			case EBlockNames.AreaSchema: currentInfoBlock = ReoValidator.getAreaSchemaInstance(inputData, ids.building, ids.area, ids.offer); break;
			case EBlockNames.BrokerContacts: currentInfoBlock = ReoValidator.getBrokerContactsInstance(inputData); break;
		}
		return currentInfoBlock;
	}

	private static getHeaderInstance(inputData): IInfoBlockValidator {
		return new BaseHeaderValidator(inputData);
	}

	private static getBuildingHeaderInstance(inputData, buildingId): IInfoBlockValidator {
		return new BuildingHeaderValidator(inputData, buildingId);
	}

	private static getBuildingLocationInstance(inputData, buildingId): IInfoBlockValidator {
		return new BuildingLocationValidator(inputData, buildingId);
	}

	private static getBuildingInfoInstance(inputData, buildingId): IInfoBlockValidator {
		return new BuildingInfoValidator(inputData, buildingId);
	}

	private static getBuildingPhotoInstance(inputData, buildingId): IInfoBlockValidator {
		return new BuildingPhotoValidator(inputData, buildingId);
	}

	private static getAreaCommercialInstance(inputData, buildingId, areaId, offerId): IInfoBlockValidator {
		return new AreaCommercialValidator(inputData, buildingId, areaId, offerId);
	}

	private static getAreaPhotoInstance(inputData, buildingId, areaId, offerId): IInfoBlockValidator {
		return new AreaPhotoValidator(inputData, buildingId, areaId, offerId);
	}

	private static getAreaSchemaInstance(inputData, buildingId, areaId, offerId): IInfoBlockValidator {
		return new AreaSchemaValidator(inputData, buildingId, areaId, offerId);
	}

	private static getBrokerContactsInstance(inputData): IInfoBlockValidator {
		return new BaseBrokerContactsValidator(inputData);
	}
}
