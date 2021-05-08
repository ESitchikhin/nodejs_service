import {PDFInfoBlock} from "./PDFInfoBlock";
import {
	IBuildingPhoto,
	TOptionsIBCreator
} from "../../entities/entities";
import {TBuilding} from "../../entities/storedData";
import {PDFPhotos} from "./PDFPhotos";

export class PDFBuildingPhoto extends PDFPhotos implements IBuildingPhoto {

	constructor(options: TOptionsIBCreator, buildingData: TBuilding, isGreyscale) {
		super();
		this.photos = buildingData.buildingPhotos;
		this.isGreyscale = isGreyscale;
	}

}
