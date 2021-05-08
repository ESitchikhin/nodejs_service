import http from 'http';
import https from 'https';

export function apiGet(
	host: string,
	path: string,
	headers: http.IncomingHttpHeaders,
	query: any,
	callback?: (err: {code: number, message: string} | string | null, response?: http.ServerResponse) => void) {

	const reqOptions = {
		method: 'GET',
		hostname: host,
		path,
		port: 443,
		headers: headers ? headers : {
			'Content-Type': 'application/json'
		}
	};

	const req = https.request(reqOptions, function (res) {
		let body = '';

		// http-error
		if (res.statusCode !== 200)
			return callback({
				code: res.statusCode,
				message: 'HTTP ERROR: bad status code'
			});

		// ok
		else {
			res.on('data', function (chunk) { body += chunk; });
			res.on('end', function () { callback(null, JSON.parse(body)); });
		}
	});

	// handle request error
	req.on('error', function (err) {
		callback({
			code: -1,
			message: 'REQUEST ERROR: ' + err.message
		});
	});

	// send request body
	// utf8 is by default
	req.write(JSON.stringify(query));
	req.end();
}

export function apiGetPromise(host: string, path: string, headers: http.IncomingHttpHeaders, query: any) {
	return new Promise((resolve, reject) => {
		this.reqSend(host, path, headers, query, (err, res) => {
			if(err) return reject(err);
			return resolve(res);
		})
	});
}
