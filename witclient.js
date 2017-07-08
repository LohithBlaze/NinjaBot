'use strict';

var request = require('superagent');
var Wit = require('node-wit').Wit;
var log = require('node-wit').log;
var deferred = require('deferred');

function handleWitResponse(res) {
    return res.entities;
}


const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

var getAllEntityValue = function (entities, entity) {
  var val = "";
  if(entities && entities[entity]) {
  for(var i=0;i<entities.email.length; i = i + 2) {
    val += entities.email[i].value + ", ";
    }
  }
  if (!val && val === "") {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    console.log(request.context);
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
        console.log('user said...', request.text);
        console.log('sending...', JSON.stringify(response));
        if (global.projects) {
          response.text = response.text + " " + global.projects;
          console.log('sending...', JSON.stringify(response));
          delete global.projects;
        }

        if(global.searchResults) {
          response.text = response.text + " " + global.searchResults;
          console.log('sending...', JSON.stringify(response));
          delete global.searchResults;
        }

        if(global.builds) {
          response.text = response.text + " " + global.builds;
          console.log('sending...', JSON.stringify(response));
          delete global.builds;
        }

        if(global.myDefects) {
          response.text = response.text + " " + global.myDefects;
          console.log('sending...', JSON.stringify(response));
          delete global.myDefects;
        }

        if(global.clInfo) {
          response.text = response.text + " " + global.clInfo;
          console.log('sending...', JSON.stringify(response));
          delete global.clInfo;
        }
        
        //var witResponse = handleWitResponse(null, context);

        global.cb(null, response);
        return resolve();
    });
  },
  teamCityStart({context,entities}) {
    return new Promise(function(resolve, reject) {
      const buildName = firstEntityValue(entities, 'buildName');
      const emailList = getAllEntityValue(entities, 'email');

      if (buildName) {
        context.buildName = buildName;
      }
      else {
        context.missingBuildName = true;
      }
      //delete context.emailList;
      if (emailList) {
        context.email = emailList;
      }
      else {
        context.missingEmailList = true;
      }

      console.log(context.email);

      if(context.buildName && context.email && entities.intent[0].value === "teamCityStart") {
      request
      .post('http://10.198.159.12:8000/api/startbuild/')
      .set('Content-Type', 'application/json')
      .send({email_list: context.email, project: context.buildName})
      .end((err, req, res) => {
        if(err) return global.cb(err, null);

            //if(res.statusode != 200) return global.cb('Expected status 200 but got ' + res.statusCode);
            console.log(req);
            //console.log(res);
      });
      }

      

      return resolve(context);
  });
  },
  teamCityList({context,entities}) {
    return new Promise(function(resolve, reject) {
      
      if(entities.intent[0].value === "teamCityList") {
      request.get('http://10.198.159.12:8000/api/projects/')
      .end((err, res) => {
        if(err) return cb(err);

            //if(res.statusCode != 200) return cb('Expected status 200 but got ' + res.statusCode);

            
            if(res.body.projects) {
              global['projects'] = res.body.projects.toString();
            }
            else {
              delete global['projects'];
            }
            //console.log(res);
      });
      }
      return resolve(context);
  });
 },
  SearchWiki({context,entities}) {
    return new Promise(function(resolve, reject) {
      const searchString = firstEntityValue(entities, 'searchString');

      var dfd = deferred();
      if (searchString) {
        context.searchString = searchString;
      }
      else {
        context.missingSearchString = true;
      }

      if(context.searchString ) {
        request.post('http://10.198.159.12:8000/api/wiki/search')
        .set('Content-Type', 'application/json')
        .send({query_string:searchString, filters:'{}'})
        .end((err, res) => {
          if(err) return cb(err);


          global.searchResults = "";
          if(res.body) {
            res.body.results.forEach(function(currentValue, index){
              global.searchResults += " " + currentValue.title + "\n" + currentValue.url + "\n";
            });
          }
        });


        global.searchResults = "";

        request.get('http://10.198.159.12:8000/api/sf/?action=searcharticles&search_string=' + searchString)
        .end((err, res) => {
          if(err) {
            dfd.reject();
            return cb(err);
          }

          if(res.body) {
            if(res.body.results.records.length > 0) {
                res.body.results.records.forEach(function(currentValue, index){
                  global.searchResults += "\n" + currentValue.Title + "\n" + "https://shoretel.my.salesforce.com/" + currentValue.Id + "\n";
                });
                dfd.resolve();
              }
            else {
              global.searchResults += "0";
              dfd.resolve();
            }
          }
            });
          dfd.promise.done(function(){ 
           return resolve(context);
        });
      }
      
  });
 },
aceExecute({context,entities}) {
    return new Promise(function(resolve, reject) {
      var buildNumber = firstEntityValue(entities, 'mhnBuild');
      var emailList = getAllEntityValue(entities, 'email');

      if(buildNumber) {
        buildNumber = buildNumber.replace(/~/g, ".");
        context.mhnBuild = buildNumber;
      }
      else {
        context.missingMHNBuild = true;
      }
      
      if(emailList) {
        context.email = emailList;
      }
      else {
        context.missingEmail = true;
      }

      if(context.mhnBuild && context.emailList) {
      request.post('http://10.198.159.12:8000/api/ace/run')
      .set('Content-Type', 'application/json')
      .send({email_list:emailList, build:buildNumber})
      .end((err, res) => {
        if(err) return cb(err);
        
        console.log(res.body);

      });
      }

      return resolve(context);
    });
 },
 GetAllBCOBuilds({context,entities}) {
   var dfd = deferred();
    return new Promise(function(resolve, reject) {

      request.get('http://10.198.159.12:8000/api/builds')
      .end((err, res) => {
        if(err)  return cb(err, null);

        global.builds = "";
        if(res.body) {
          res.body.builds.forEach(function(currentValue, index){
            global.builds += currentValue + " " + "\n";
          });
          dfd.resolve();
        }
      });
      dfd.promise.done(function(){
        return resolve(context);
      });
    });
 },
 getMyDefects({context,entities}) {
   var dfd = deferred();
    return new Promise(function(resolve, reject) {

      request.get('http://10.198.159.12:8000/api/sf/?action=myopendefects')
      .end((err, res) => {
        if(err) {
          return cb(err, null);
          dfd.reject();
        }

        global.myDefects = "";
        if(res.body) {
          res.body.results.records.forEach(function(currentValue, index){
            global.myDefects += currentValue.Abstract__c + " " + currentValue.Name + " " +   "https://shoretel.my.salesforce.com/" + currentValue.Id + " ";
          });
          dfd.resolve();
        }
      });
      dfd.promise.done(function(){
        return resolve(context);
      });
    });
 },

 getDefectByID({context,entities}) {
   var dfd = deferred();
   //global.clInfo = {};
    return new Promise(function(resolve, reject) {
      var defectNumber = firstEntityValue(entities, 'defectNumber');

      if(defectNumber) {
        context.defectNumber = defectNumber;
      }
      else {
        context.missingDefectNumber = true;
      }
      if(defectNumber) {
      request.get('http://10.198.159.12:8000/api/sf/?action=getcl&search_string=' + defectNumber)
      .end((err, res) => {
        if(err) {
          return cb(err, null);
          dfd.reject();
        }
        global.clInfo = "";
        if(res.body){
          res.body.results.records.forEach(function(currentValue, index){
            global.clInfo += "CL: " + currentValue.Change_List__c + " " + currentValue.Defect_Abstract__c + " " + "\n"  +"https://shoretel.my.salesforce.com/" + currentValue.Id + " " + "Status: " + currentValue.Status__c + "\n";
          });
          if(!global.clInfo) {
            global.clInfo = "No information for this CL";
          }
          dfd.resolve();
        }
      });
    }
    else {
      dfd.resolve();
    }
    
    dfd.promise.done(function(){
        return resolve(context);
      });

  });
 }


};

const sessions = {};

const findOrCreateSession = (id) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].id === id) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {id: id, context: {}};
  }
  return sessionId;
};

var wit = null;

module.exports = function witClient(token) {

    if (!wit) {
        wit = new Wit({
            accessToken: token,
            actions,
            logger: new log.Logger(log.INFO)
        });
    }
    
    var ask = function ask(message, cb) {
        global.cb = cb;
        // wit.message(message, {})
        // .then((data) => {
        //     var witResponse = handleWitResponse(data);
        //     //return cb(null, witResponse);
        // })
        // .catch(console.error);

        var sessionId = findOrCreateSession('session1');
        wit.runActions(sessionId, message, sessions[sessionId].context)
        .then((context) => {
            //var witResponse = handleWitResponse(data);
           // console.log(context);
            // cb(null, context);
            // console.log(context);
            // console.log('Waiting for next user messages');
        })
        .catch(console.error);

        // request.get('https://api.wit.ai/message')
        // .set('Authorization', 'Bearer ' + token)
        // .query({v: '20170511'})
        // .query({q: message})
        // .end((err, res) => {
        //     if(err) return cb(err);

        //     if(res.statusCode != 200) return cb('Expected status 200 but got ' + res.statusCode);

        //     var witResponse = handleWitResponse(res.body);
        //     console.log(witResponse);
        //     return cb(null, witResponse);
        // })
    }

    return {
        ask: ask
    }
}