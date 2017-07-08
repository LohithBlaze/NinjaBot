'use strict';
var express = require('express');
var service = express();
var serviceRegistry = require('./serviceRegistry');


var ServiceRegistry  = new serviceRegistry();

service.set('serviceRegistry', ServiceRegistry);

service.put('/service/:intent/:port', (req, res, next) => {
    var serviceIntent = req.params.intent;
    var servicePort = req.params.port;

    var serviceIP = req.connection.remoteAddress.includes('::') ? '[' + req.connection.remoteAddress + ']' : req.connection.remoteAddress;
    ServiceRegistry.add(serviceIntent, serviceIP, servicePort);
    res.json({result: serviceIntent + 'at' + serviceIP + ':' + servicePort});
});

module.exports = service;