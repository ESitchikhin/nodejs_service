import {IPDFInfoBlock} from "../../entities/entities";
import PDFDocument from "pdfkit";
import path from "path";

export abstract class PDFInfoBlock implements IPDFInfoBlock {

	abstract async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument>;
	abstract async getParams(): Promise <any>;

	async getPDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		if(!doc) {
			doc = new PDFDocument({
				layout: 'landscape',
				size: 'A4',
				margin: 0,
				autoFirstPage: false,
			});
		}
		doc.addPage();
		return await this.generatePDFDocument(doc);
	}

}
