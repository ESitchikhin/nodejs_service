import {formatLocale} from 'd3';

type TUnits = {
	unit?: string,
	unit1?: string,
	unit2?: string
}

export function unitFormat(units: TUnits, type: 'base' | 'backward' = 'base') {
	let format = '';
	const printUnit = units.unit ? units.unit : '';
	const printUnit1 = units.unit1 ? units.unit1 : '1';
	const printUnit2 = units.unit2 ? units.unit2 : '';

	switch (type) {
		case 'base':
			format = printUnit ? ' ' + printUnit : '';
			break;
		case 'backward':
			format = ` ${printUnit1}/${printUnit2}`;
			break;
	}

	return formatLocale({
		decimal: ",",
		thousands: "\xa0",
		grouping: [3],
		currency: ['', format],
	}).format('$,');
}
