'use strict';

class serviceRegistry {
    constructor() {
        this._services = [];
        this._timeout = 30;
    }

    add(intent, ip, port) {
        var key = intent + ip + port;

        if(!this._services[key]) {
            this._services[key] = {};
            this._services[key].timestamp = Math.floor(new Date()/1000);
            this._services[key].ip = ip;
            this._services[key].intent = intent;
            this._services[key].port = port;
            this._cleanup();
            console.log('added service for intent ' + intent + ' on ' + ip + ':' + port);
            return;
        }

        this._services[key].timestamp = Math.floor(new Date()/1000);
        console.log('updated service for intent' + intent + 'on ' + ip + ':' + port);
    }

    remove(intent, ip, port) {
        var key = intent + ip + port;

        delete this._services[key];
    }

    get(intent) {
        this._cleanup();
        for(var key in this._services) {
            if(this._services[key].intent == intent) {
                return this._services[key];
            }
        }
        return null;
    }

    _cleanup() {
        var now = Math.floor(new Date()/1000);

        for(var key in this._services) {
            if(this._services[key].timestamp + this._timeout < now) {
                console.log('Removed Service for intent' + this._services[key].intent);
                delete this._services[key];
            }
        }
    }
}

module.exports = serviceRegistry;