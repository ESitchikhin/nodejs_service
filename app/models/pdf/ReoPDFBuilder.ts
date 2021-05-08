import {
	EBlockNames, IAreaCommercial, IAreaPhoto, IAreaSchema, IBaseBrokerContacts, IBaseHeader,
	IBlocksBuilder, IBuildingInfo, IBuildingLocation, IBuildingPhoto,
	IHTMLInfoBlock,
	IInfoBlockDataRepository, IPDFInfoBlock,
	TRequestedBlock
} from "../entities/entities";

import path from "path";

import {PDFBaseHeader} from "./infoblocks/PDFBaseHeader";
import {PDFBuildingHeader} from "./infoblocks/PDFBuildingHeader";
import {PDFBuildingLocation} from "./infoblocks/PDFBuildingLocation";
import {PDFBuildingInfo} from "./infoblocks/PDFBuildingInfo";
import {PDFBuildingPhoto} from "./infoblocks/PDFBuildingPhoto";
import {PDFAreaCommercial} from "./infoblocks/PDFAreaCommercial";
import {PDFAreaPhoto} from "./infoblocks/PDFAreaPhoto";
import {PDFAreaSchema} from "./infoblocks/PDFAreaSchema";
import {PDFBaseBrokerContacts} from "./infoblocks/PDFBaseBrokerContacts";


export class ReoPDFBuilder implements IBlocksBuilder {
	template: string;
	data: IInfoBlockDataRepository;

	constructor(currentTemplate: string, data: IInfoBlockDataRepository) {
		this.template = currentTemplate;
		this.data = data;
	}


	public getInfoBlock(requestedBlock: TRequestedBlock): IPDFInfoBlock | null {
		let currentInfoBlock: IPDFInfoBlock | IHTMLInfoBlock;

		switch (requestedBlock.name) {
			case EBlockNames.Header: currentInfoBlock = this.getHeaderInstance(); break;
			case EBlockNames.BuildingHeader: currentInfoBlock = this.getBuildingHeaderInstance(requestedBlock.options.building); break;
			case EBlockNames.BuildingLocation: currentInfoBlock = this.getBuildingLocationInstance(requestedBlock.options.building); break;
			case EBlockNames.BuildingInfo: currentInfoBlock = this.getBuildingInfoInstance(requestedBlock.options.building); break;
			case EBlockNames.BuildingPhoto: currentInfoBlock = this.getBuildingPhotoInstance(requestedBlock.options.building); break;
			case EBlockNames.AreaCommercial: currentInfoBlock = this.getAreaCommercialInstance(requestedBlock.options.building, requestedBlock.options.area); break;
			case EBlockNames.AreaPhoto: currentInfoBlock = this.getAreaPhotoInstance(requestedBlock.options.building, requestedBlock.options.area); break;
			case EBlockNames.AreaSchema: currentInfoBlock = this.getAreaSchemaInstance(requestedBlock.options.building, requestedBlock.options.area); break;
			case EBlockNames.BrokerContacts: currentInfoBlock = this.getBrokerContactsInstance(); break;
		}
		return ('getPDFDocument' in currentInfoBlock) ? currentInfoBlock : null;
	}


	// Базовые инфо-блоки документа
	public getHeaderInstance(): IPDFInfoBlock {
		return new PDFBaseHeader({
			filename:  null,
			content: null,
		}, this.data.getPresentationName(), this.data.getBaseLogoLink());
	}

	public getBuildingHeaderInstance(building: string): IPDFInfoBlock {
		return new PDFBuildingHeader({
				filename: null,
				content: null,
			},
			this.data.getBuildingData(building)
		);
	}

	public getBuildingLocationInstance(building: string): IPDFInfoBlock {
		return new PDFBuildingLocation({
				filename: null,
				content: null,
			},
			this.data.getBuildingData(building)
		);
	}

	public getBuildingInfoInstance(building: string): IPDFInfoBlock {
		return new PDFBuildingInfo({
				filename: null,
				content: null,
			},
			this.data.getBuildingData(building)
		);
	}


	public getBuildingPhotoInstance(building: string): IPDFInfoBlock {
		return new PDFBuildingPhoto({
				filename: null,
				content: null,
			},
			this.data.getBuildingData(building), this.data.getGreyscalePhotoFlag()
		);
	}


	public getAreaCommercialInstance(building: string, area: string): IPDFInfoBlock {
		return new PDFAreaCommercial({
				filename: path.join(this.template, 'area-commercial.ejs'),
				content: null,
			},
			this.data.getAreaData(building, area)
		);
	}


	public getAreaPhotoInstance(building: string, area: string): IPDFInfoBlock {
		return new PDFAreaPhoto({
				filename: null,
				content: null,
			},
			this.data.getAreaData(building, area), this.data.getGreyscalePhotoFlag()
		);
	}


	public getAreaSchemaInstance(building: string, area: string): IPDFInfoBlock {
		return new PDFAreaSchema({
				filename: null,
				content: null,
			},
			this.data.getAreaData(building, area)
		);

	}


	public getBrokerContactsInstance(): IPDFInfoBlock {
		return new PDFBaseBrokerContacts({
				filename: null,
				content: null,
			},
			this.data.getBrokerData()
		);
	}

}
