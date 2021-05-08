import {PDFInfoBlock} from "./PDFInfoBlock";
import {
	IAreaPhoto,
	TOptionsIBCreator
} from "../../entities/entities";
import {TArea} from "../../entities/storedData";
import {PDFPhotos} from "./PDFPhotos";

export class PDFAreaPhoto extends PDFPhotos implements IAreaPhoto {

	constructor(options: TOptionsIBCreator, areaData: TArea, isGreyscale) {
		super();
		this.photos = areaData.areaPhotos;
		this.isGreyscale = isGreyscale;
	}

}
