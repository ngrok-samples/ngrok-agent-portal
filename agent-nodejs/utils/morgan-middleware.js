const morgan = require("morgan");
const logger = require("./logger");
const chalk = require('chalk');

morgan.token('body', req => {
    return JSON.stringify(req.body);
})

const morganRequestMiddleware = morgan(
    function(tokens, req, res) {
        return [
            chalk.yellow.bold(tokens.method(req, res)),
            chalk.white(tokens.url(req, res)),
            chalk.white(tokens['remote-addr'](req, res)),
            chalk.green(tokens['body'](req, res)),
        ].join(' ');
    }, {
        immediate: true,
        stream: {
            write: (message) => {
                logger.http(message.trim());
            }
        }
    });

const morganResponseMiddleware = morgan(
    function(tokens, req, res) {
        return [
            chalk.yellow.bold(tokens.method(req, res)),
            chalk.white(tokens.url(req, res)),
            chalk.cyan(tokens.status(req, res)),
            chalk.white(tokens.res(req, res, 'content-length')),
            chalk.white(tokens['response-time'](req, res), 'ms'),
            chalk.white(tokens['remote-addr'](req, res)),
            chalk.green(tokens['body'](req, res)),
        ].join(' ');
    }, {
        immediate: false,
        stream: {
            write: (message) => {
                logger.http(message.trim());
            }
        }
    });

const addMorganMiddleware = (app) => {
    app.use(morganRequestMiddleware);
    app.use(morganResponseMiddleware);
}

module.exports = addMorganMiddleware;
