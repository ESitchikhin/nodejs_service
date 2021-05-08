import {PDFInfoBlock} from "./PDFInfoBlock";
import {TMedia} from "../../entities/storedData";
import path from "path";
import axios, {AxiosRequestConfig} from "axios";
import {getStringWidth, randomString} from "../../../utils/string-utils";
import fs from "fs";
import sharp from "sharp";
import {logger} from "../../../utils/logger";

export type TPhotoPageParams = {
	photos: TMedia[],
}

export abstract class PDFPhotos extends PDFInfoBlock {
	photos: TMedia[];
	isGreyscale: boolean

	async getParams(): Promise <TPhotoPageParams> {
		const photos: TMedia[] = [];
		const requestConfig: AxiosRequestConfig = {
			method: 'get',
			baseURL: process.env.MEDIA_SERVICE,
			url: '',
			responseType: 'stream',
		}
		for(const photo of this.photos) {
			let photoFile =`/static/img/tmp/b-${randomString(8)}.jpg`;
			const fullPath = path.join(process.cwd(), photoFile);
			const processedFile =`/static/img/tmp/b-proc-${randomString(8)}.jpg`;
			const processedFullPath = path.join(process.cwd(), processedFile);

			requestConfig.url = photo.url;

			try {
				const response = await axios(requestConfig);
				await response.data.pipe(fs.createWriteStream(fullPath));
				let i = 0;
				while (!response.data.complete && i < 20) {
					i = await new Promise(resolve => setTimeout(() => resolve(i + 1), 50));
				}
				if(this.isGreyscale) {
					await sharp(fullPath).greyscale().toFile(processedFullPath);
					photoFile = processedFile
				}
				photos.push({
					url: photoFile,
					name: photo.name
				});
			} catch (err) {
				logger.errorLog(err);
			}
		}

		return  {
			photos,
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();
		const photoMargin = 10;
		const local2Width = doc.page.width / 2 - photoMargin / 2;
		const local3Height = doc.page.height / 2 - photoMargin / 2;


		// Делаем первый лист
		let i = 0;
		switch (pageParams.photos.length % 4) {
			case 0:
				break;
			case 1:
				doc.image(path.join(process.cwd(), pageParams.photos[i].url), 0, 0, {
					fit: [doc.page.width, doc.page.height],
					align: 'center',
					valign: 'center'
				});
				this.createDescription(doc, pageParams.photos[i].name, 0, 0, doc.page.width, doc.page.height);
				i = 1;
				break;
			case 2:

				doc.image(path.join(process.cwd(), pageParams.photos[i].url), 0, 0, {
					fit: [local2Width, doc.page.height],
					align: 'center',
					valign: 'center'
				});
				this.createDescription(doc, pageParams.photos[i].name, 0, 0, local2Width, doc.page.height);

				doc.image(path.join(process.cwd(), pageParams.photos[i + 1].url), local2Width + photoMargin, 0, {
					fit: [local2Width, doc.page.height],
					align: 'center',
					valign: 'center'
				});
				this.createDescription(doc, pageParams.photos[i + 1].name, local2Width + photoMargin, 0, local2Width, doc.page.height);

				i = 2;
				break;
			case 3:
				doc.image(path.join(process.cwd(), pageParams.photos[i].url), 0, 0, {
					fit: [local2Width, doc.page.height],
					align: 'center',
					valign: 'center'
				});
				this.createDescription(doc, pageParams.photos[i].name, 0, 0, local2Width, doc.page.height);

				doc.image(path.join(process.cwd(), pageParams.photos[i + 1].url), local2Width + photoMargin, 0, {
					fit: [local2Width, local3Height],
					align: 'center',
					valign: 'center'
				});
				this.createDescription(doc, pageParams.photos[i + 1].name, local2Width + photoMargin, 0, local2Width, local3Height);

				doc.image(path.join(process.cwd(), pageParams.photos[i + 2].url), local2Width + photoMargin, local3Height + photoMargin, {
					fit: [local2Width, local3Height],
					align: 'center',
					valign: 'center'
				});
				this.createDescription(doc, pageParams.photos[i + 2].name, local2Width + photoMargin, local3Height + photoMargin, local2Width, local3Height);

				i = 3;
				break;
		}

		// Делаем остальные листы по 4 фото
		for(; i < pageParams.photos.length; i = i + 4) {
			if(i !== 0) {
				doc.addPage();
			}

			doc.image(path.join(process.cwd(), pageParams.photos[i].url), 0, 0, {
				fit: [local2Width, local3Height],
				align: 'center',
				valign: 'center'
			});
			this.createDescription(doc, pageParams.photos[i].name, 0, 0, local2Width, local3Height);

			doc.image(path.join(process.cwd(), pageParams.photos[i + 1].url), local2Width + photoMargin, 0, {
				fit: [local2Width, local3Height],
				align: 'center',
				valign: 'center'
			});
			this.createDescription(doc, pageParams.photos[i + 1].name, local2Width + photoMargin, 0, local2Width, local3Height);

			doc.image(path.join(process.cwd(), pageParams.photos[i + 2].url), 0, local3Height + photoMargin, {
				fit: [local2Width, local3Height],
				align: 'center',
				valign: 'center'
			});
			this.createDescription(doc, pageParams.photos[i + 2].name, 0, local3Height + photoMargin, local2Width, local3Height);

			doc.image(path.join(process.cwd(), pageParams.photos[i + 3].url), local2Width + photoMargin, local3Height + photoMargin, {
				fit: [local2Width, local3Height],
				align: 'center',
				valign: 'center'
			});
			this.createDescription(doc, pageParams.photos[i + 3].name, local2Width + photoMargin, local3Height + photoMargin, local2Width, local3Height);

		}

		return doc;
	}

	createDescription(doc, text, imageX, imageY, imageWidth, imageHeight) {
		if(text) {
			const xDescPadding = 16;
			const yDescPadding = 16;
			const descLineHeight = 21;
			const descFontSize = 18;
			const textWidth = 2 * xDescPadding + doc.fontSize(descFontSize).font('Regular').widthOfString(text);
			const descWidth = textWidth < imageWidth ? textWidth : imageWidth;
			const descHeight = 2 * yDescPadding + descLineHeight;


			doc.rect(imageX, imageY + imageHeight - descHeight, descWidth, descHeight)
				.fillOpacity(0.5)
				.fill('#434343')
				.fontSize(descFontSize)
				.fillOpacity(1)
				.fillColor('white')
				.font('Regular')
				.text(text,
					imageX + xDescPadding,
					imageY + imageHeight - descHeight + yDescPadding, {
						width: descWidth,
						height: descLineHeight,
						lineBreak: false,
					});
		}
	}

}
