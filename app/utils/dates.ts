type Format = 0 | 1 | 2| 3 | '-' | '.' | 'time' | 'full_time';

export function formattedDate (date: Date, format: Format): string {
	let month = '' + (date.getMonth() + 1);
	let day = '' + date.getDate();
	const year = date.getFullYear();

	let hours = '' + date.getHours();
	let minutes = '' + date.getMinutes();
	let seconds = '' + date.getSeconds();
	const milliseconds = '' + date.getMilliseconds();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	if (hours.length < 2) hours = '0' + hours;
	if (minutes.length < 2) minutes = '0' + minutes;
	if (seconds.length < 2) seconds = '0' + seconds;

	let result = '';

	switch(format) {
		case 0 :
		case '-':
			result = [year, month, day].join('-');
			break;
		case 1:
		case '.':
			result = [day, month, year].join('.');
			break;
		case 2:
		case 'time':
			result = [day, month, year].join('.') + ' ' + [hours, minutes].join(':');
			break;
		case 3:
		case 'full_time':
			result = [day, month, year].join('.') + ' ' + [hours, minutes, `${seconds}.${milliseconds}`].join(':');
			break;
		default:
			result = date.toDateString();
			break;
	}

	return result;
}
