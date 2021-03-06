import {PDFInfoBlock} from "./PDFInfoBlock";
import {
	IBaseHeader,
	IBuildingHeader,
	IBuildingInfo,
	IBuildingLocation,
	TCharacteristic,
	TOptionsIBCreator
} from "../../entities/entities";
import {TBuilding, TFeature} from "../../entities/storedData";
import SVGtoPDF from 'svg-to-pdfkit';
import path from "path";
import {getStringWidth, randomString, splitString, toCase} from "../../../utils/string-utils";
import axios, {AxiosRequestConfig} from "axios";
import fs from "fs";
import sharp from "sharp";
import {TAllInfrastructures} from "../../entities/inputData";
import {unitFormat} from "../../../utils/unit-format";
type TParamsCharacteristic = {
	icon?: string
	paramArray: string[],
	valueArray: string[],
}

type TPageParams = {
	headerTitle: string,
}

export class PDFBaseHeader extends PDFInfoBlock implements IBaseHeader {
	name: string | null;


	constructor(options: TOptionsIBCreator, name, logoSvg) {
		super();
		this.name = name;

	}

	async getParams(): Promise <TPageParams> {
		return {
			headerTitle: `Коммерческое предложение по ${this.name} недвижимости`,
		}
	}

	async generatePDFDocument(doc: PDFKit.PDFDocument | null): Promise<PDFKit.PDFDocument> {
		const pageParams = await this.getParams();

		const logo = '<svg viewBox="0 0 211 153" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
			'<path d="M4.56947 152.159H0L0.0365558 129.861L11.247 129.873C17.0959 129.885 18.1195 134.274 18.1073 136.176C18.1073 138.639 16.9131 140.748 14.732 141.479C16.5232 142.284 17.4859 142.991 17.4737 147.136C17.4737 150.391 17.498 151.196 18.4607 151.561V152.171L13.3672 152.159C13.0626 151.086 12.892 149.952 12.892 147.648C12.892 144.612 12.7214 143.442 9.32173 143.442L4.56947 143.43V152.159ZM4.59384 139.699L9.97973 139.711C12.368 139.711 13.5256 138.858 13.5256 136.676C13.5256 135.481 12.9895 133.726 10.2844 133.726L4.59384 133.713V139.699Z" fill="#48A234"/>\n' +
			'<path d="M37.8474 129.922V133.762L26.1861 133.738L26.1739 138.346L36.8604 138.37L36.8482 142.21L26.1617 142.186L26.1495 148.355L38.2982 148.379L38.2861 152.219L21.5679 152.195L21.6044 129.897L37.8474 129.922Z" fill="#48A234"/>\n' +
			'<path d="M53.4446 129.946L61.1335 152.256L56.1619 152.244L54.7484 147.636L46.6574 147.624L45.1099 152.232L40.2967 152.22L48.144 129.934L53.4446 129.946ZM47.8881 143.784L53.7614 143.796L50.776 134.981H50.7151L47.8881 143.784Z" fill="#48A234"/>\n' +
			'<path d="M68.4812 148.428L79.448 148.44V152.281L63.9117 152.256L63.9483 129.958L68.5178 129.971L68.4812 148.428Z" fill="#48A234"/>\n' +
			'<path d="M89.1962 152.305L84.6267 152.293L84.6633 133.836L78.0345 133.823L78.0467 129.983L95.8859 130.007L95.8737 133.848L89.2449 133.836L89.1962 152.305Z" fill="#48A234"/>\n' +
			'<path d="M102.173 130.032L106.694 139.748L111.044 130.056L116.26 130.068L108.875 143.942L108.863 152.354L104.294 152.342L104.306 143.93L96.9703 130.032H102.173Z" fill="#48A234"/>\n' +
			'<path d="M128.177 140.358L137.352 140.37L137.328 152.378H134.269L133.819 149.586C132.722 150.964 130.967 152.963 126.97 152.951C121.67 152.939 116.893 149.099 116.905 141.26C116.918 135.176 120.22 129.471 127.592 129.483C134.318 129.495 137.035 133.957 137.279 137.017L132.71 137.005C132.71 136.115 131.174 133.409 127.933 133.409C124.655 133.409 121.511 135.579 121.499 141.26C121.487 147.368 124.85 149.001 127.97 149.013C129.005 149.013 132.369 148.587 133.307 144.112L128.189 144.1L128.177 140.358Z" fill="#008556"/>\n' +
			'<path d="M146.199 130.105L146.174 144.6C146.174 147.697 147.929 149.05 150.074 149.062C153.218 149.062 154.497 147.538 154.497 144.832L154.521 130.117L159.091 130.129L159.066 144.564C159.054 150.428 155.691 153 150.147 153C146.418 153 141.581 151.513 141.593 144.844L141.617 130.105H146.199Z" fill="#008556"/>\n' +
			'<path d="M167.889 152.427H163.319L163.356 130.129H167.925L167.889 152.427Z" fill="#008556"/>\n' +
			'<path d="M172.166 130.141L181.865 130.154C189.286 130.166 190.821 136.554 190.809 140.796C190.797 145.551 188.884 152.463 181.646 152.451L172.129 152.439L172.166 130.141ZM176.613 148.611L181.097 148.623C184.814 148.623 186.106 144.795 186.106 141.138C186.118 134.567 183.023 134.006 181.061 134.006L176.638 133.994L176.613 148.611Z" fill="#008556"/>\n' +
			'<path d="M210.549 130.214V134.055L198.888 134.03L198.876 138.639L209.574 138.651L209.562 142.491L198.864 142.479L198.851 148.648L211 148.672V152.512L194.282 152.488L194.318 130.19L210.549 130.214Z" fill="#008556"/>\n' +
			'<path d="M137.401 140.284H128.201V144.185H133.819V152.463H137.425V140.284H137.401Z" fill="#48A234"/>\n' +
			'<path d="M155.009 85.2898H154.631L106.097 113.269L105.792 113.707L56.5883 85.2898V28.4299L56.9782 28.3812L105.719 0.243824L105.792 0L155.009 28.4299V85.2898Z" fill="#C0D886"/>\n' +
			'<path d="M141.836 67.1005V36.1957L105.829 15.3975V0L56.5883 28.4421L70.0164 36.1957L96.7387 20.7495L132.649 41.4258V72.2695L141.836 67.1005Z" fill="#008054"/>\n' +
			'<path d="M69.8093 46.8753V77.7801L105.78 98.5539L105.829 113.708L155.021 85.2533L141.861 77.6582L115.09 93.1776L79.1432 72.4403V41.499L69.8093 46.8753Z" fill="#008054"/>\n' +
			'<path d="M79.1555 41.4987L96.5926 31.4288L109.972 39.1336L92.5471 49.2036L79.1555 41.4987Z" fill="#008054"/>\n' +
			'<path d="M92.547 49.1793L109.923 39.1215V54.6653L92.547 64.6012V49.1793Z" fill="#4DA32F"/>\n' +
			'<path d="M105.853 72.2694L123.351 62.1751V77.658L105.853 87.8864V72.2694Z" fill="#4DA32F"/>\n' +
			'<path d="M92.5225 64.589L109.923 54.5557L123.303 62.2117L105.878 72.2817L92.5225 64.589Z" fill="#008054"/>\n' +
			'<path d="M96.5681 31.4168L123.315 46.8021V77.6947L132.685 72.2696V41.377L96.7022 20.7251L69.992 36.1836L56.5883 28.4178V85.2776L105.805 113.72H105.841V98.4807L69.8702 77.7556V46.8509L96.5681 31.4168Z" fill="#7BBB58"/>\n' +
			'</svg>'

		const logoWidth = 211;
		const logoHeight = 153;

		const xLogo = doc.page.width / 2 - logoWidth / 2;
		const yLogo = doc.page.height / 2 - logoHeight / 2;

		doc.image(path.join(process.cwd(), '/static/img/pattern.png'), 0, 0, {height: doc.page.height, width: 507});

		SVGtoPDF(doc, logo, xLogo, yLogo, {
				width: logoWidth,
				height: logoHeight
			});

		const widthText = 270;
		const yText = yLogo + logoHeight + 88;
		const xText = doc.page.width / 2 - widthText / 2

		const gradientHeader = doc.linearGradient(xText, yText, xText + widthText, yText)
			.stop(0, '#008054')
			.stop(1, '#B4D88B');

		doc.fontSize(18)
			.fill(gradientHeader)
			.font('Bold')
			.text(pageParams.headerTitle, xText, yText, {
				width: widthText,
				align: 'center',
				lineGap: 4
			});


		return doc;
	}

}
