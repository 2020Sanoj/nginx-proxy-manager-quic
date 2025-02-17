const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const compression = require('compression');
const log = require('./logger').express;

/**
 * App
 */
const app = express();
app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Gzip
app.use(compression());

/**
 * General Logging, BEFORE routes
 */

app.disable('x-powered-by');
app.enable('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.enable('strict routing');

app.use(require('./lib/express/jwt')());
app.use('/', require('./routes/main'));

// production error handler
// no stacktraces leaked to user
// eslint-disable-next-line
app.use(function (err, req, res, next) {
	const payload = {
		error: {
			code: err.status,
			message: err.public ? err.message : 'Internal Error',
		},
	};

	if ((req.baseUrl + req.path).includes('nginx/certificates')) {
		payload.debug = {
			stack: typeof err.stack !== 'undefined' && err.stack ? err.stack.split('\n') : null,
			previous: err.previous,
		};
	}

	// Not every error is worth logging - but this is good for now until it gets annoying.
	if (typeof err.stack !== 'undefined' && err.stack) {
		if (typeof err.public === 'undefined' || !err.public) {
			log.warn(err.message);
		}
	}

	res.status(err.status || 500).send(payload);
});

module.exports = app;
