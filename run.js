'use strict';
var config = require('../config');

var service = require('../server/service');
var http = require('http');
var server = http.createServer(service);
var slackClient = require('../server/slackclient');
var io = require('socket.io')(server);

var noOfUsers = 0;

io.on('connection', function(socket){
    noOfUsers += 1;
    console.log('No of participants: ', noOfUsers);
    socket.on('disconnect', function() {
        noOfUsers -= 1;
        console.log('No of participants: ', noOfUsers);
        socket.emit('chat message', 'No of participants :' + noOfUsers);
    });
    socket.on('message', function(msg) {
        console.log('got message: '+ msg.text);
        socket.emit('returnMessage', 'got your msg: ' + msg.text);
    });
    socket.on('chat message', function(msg) {
        socket.emit('chat message', msg);
    });
    socket.on('login', function(user){
        console.log('got user connected: '+ user.text);
        socket.emit('login', user + ' connected');
    });
});


var slackToken = config.slackToken;
var slackLogLevel = 'verbose';

var witToken = config.witToken;
var witClient = require('../server/witclient.js')(witToken);

var serviceRegistry = service.get('serviceRegistry');

var rtm = slackClient.init(slackToken, slackLogLevel, witClient, serviceRegistry);
rtm.start();

slackClient.addAuthenticatedHandler(rtm, () => server.listen(3000));

server.on('listening', function(){
    console.log('bLAZE is listening on '+ server.address().port + "in " + service.get('env')  + "address: " + server.address().address );
});