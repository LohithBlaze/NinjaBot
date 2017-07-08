'use strict';

var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var rtm = null;
var nlp = null;
var registry = null;

function handleOnAuthentication(rtmStartData) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
}

function addAuthenticatedHandler(rtm, handler) {
    rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, handler);
}

function handleOnMessage(message) {
    console.log(message);
    //console.log(JSON.stringify(message));
    
    nlp.ask(message.text, (err, res) => {
        if (err) {
            console.log(err);
            return;
        }

        try {
            // if (!res.intent || !res.intent[0] || !res.intent[0].value) {
            //     throw new Error('Could not extract intent');
            // }
            // var intent = require('../intents/' + res.intent[0].value + 'Intent');
            return rtm.sendMessage(res.text, message.channel);
            // intent.process(res, registry, function (error, response) {
            //     if (error) {
            //         console.log(error.message);
            //         return;
            //     }
            //     return rtm.sendMessage(response, message.channel);
            // });
        } catch (err) {
            console.log(err);
            console.log(res);
            rtm.sendMessage('Sorry, I dont know what you are talking about!', message.channel);
        }
    });
}

module.exports.init = function slackClient(token, slacklogLevel, nlpCLient, serviceRegistry) {
    rtm = new RtmClient(token, {logLevel: slacklogLevel});
    nlp = nlpCLient;
    registry = serviceRegistry;
    addAuthenticatedHandler(rtm, handleOnAuthentication);
    rtm.on(RTM_EVENTS.MESSAGE, handleOnMessage);
    return rtm;
};

module.exports.addAuthenticatedHandler = addAuthenticatedHandler;