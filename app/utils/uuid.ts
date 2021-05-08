/**
 * UUID - xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string
{
	let d = Date.now();
	if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
		d += performance.now(); // use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const rand = Math.random() * 16;
		const r = (d + rand) % 16 | 0;
		const y = (r & 0x3 | 0x8);
		d = Math.floor(d / 16);
		return (c === 'x' ? r : y).toString(16);
	});
}
