require('dotenv').config();
var bunyan = require('bunyan');

var log = {
    development: () => {
        return bunyan.createLogger({name: 'blaze-development', level: 'debug'});
    },
    production: () => {
        return bunyan.createLogger({name: 'blaze-production', level: 'info'});
    },
    test: () => {
        return bunyan.createLogger({name: 'blaze-test', level: 'fatal'});
    }
};

module.exports = {
    witToken: process.env.WIT_TOKEN,
    slackToken: process.env.SLACK_TOKEN,
    log: (env) => {
        if(env) return log[env]();
        return log[process.env.NODE_ENV || 'development']();
    }
};