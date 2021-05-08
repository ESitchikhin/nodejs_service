import {IBlocksGenerator} from "./entities/entities";
import {TBlock, TBlockError, TInputData} from "./entities/inputData";

export default class ReoBlocksGenerator implements IBlocksGenerator {
	inputData: TInputData

	constructor(inputData: TInputData) {
		this.inputData = inputData;
	}

	getInfoBlocks(): TBlock[] {
		const blocks: TBlock[] = [];

		if(Array.isArray(this.inputData.data)) {
			blocks.push({
				blockId: 'header',
				realtyId: null,
				realtyObjectId: null,
				realtyOfferId: null,
				isOptional: false,
				name: 'Заголовок презентации',
				svg: undefined,
			});

			this.inputData.data.forEach(realty => {
				const realtyId = realty.id;
				const objects = realty.realtyObjects;

				blocks.push({
					blockId: 'building_header',
					realtyId,
					realtyObjectId: null,
					realtyOfferId: null,
					isOptional: false,
					name: 'Заголовок объекта',
					svg: undefined,
				});
				blocks.push({
					blockId: 'building_location',
					realtyId,
					realtyObjectId: null,
					realtyOfferId: null,
					isOptional: true,
					name: 'Расположение объекта',
					svg: undefined,
				});
				blocks.push({
					blockId: 'building_info',
					realtyId,
					realtyObjectId: null,
					realtyOfferId: null,
					isOptional: true,
					name: 'Информация об объекте',
					svg: undefined,
				});
				blocks.push({
					blockId: 'building_photo',
					realtyId,
					realtyObjectId: null,
					realtyOfferId: null,
					isOptional: true,
					name: 'Фотографии объекта',
					svg: undefined,
				});

				objects.forEach(realtyObject => {
					const realtyObjectId = realtyObject.id;
					const offer = realtyObject.realtyOffers;
					let realtyOfferId = '';

					offer.forEach(realtyOffer => {
						realtyOfferId = realtyOffer.id;
						blocks.push({
							blockId: 'area_commercial',
							realtyId,
							realtyObjectId,
							realtyOfferId,
							isOptional: false,
							name: 'Коммерческое предложение помещения',
							svg: undefined,
						});

					});
					blocks.push({
						blockId: 'area_photo',
						realtyId,
						realtyObjectId,
						realtyOfferId,
						isOptional: true,
						name: 'Фотографии помещения',
						svg: undefined,
					});
					blocks.push({
						blockId: 'area_schema',
						realtyId,
						realtyObjectId,
						realtyOfferId,
						isOptional: true,
						name: 'Планировка помещения',
						svg: undefined,
					});
				});
			});

			blocks.push({
				blockId: 'broker_contacts',
				realtyId: null,
				realtyObjectId: null,
				realtyOfferId: null,
				isOptional: false,
				name: 'Контакты брокера',
				svg: undefined,
			});
		}

		return blocks;
	}
}
