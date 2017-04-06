var toDict = {} // { email address : count }

//remove everything except valid email addresses
function stripEmailAddress(email) {
    var re = /[\w|\-|\.]+@([\w]+\.)+[\w]+/;
    var result = email.match(re);
    if (result == null || result == undefined) {
        return undefined;
    }
    else if (result.length == 0) {
        return result;
    }
    else {
        return result[0];
    }
    //return [0]; //Hack, only take the first match (since there should only be one)
}

function splitStringAddElementsToArray(string, delimiter = ',') {
    var parts = string.split(delimiter);
    var ret = [];
    for (i = 0; i < parts.length; i++)
    {
        var toAdd = stripEmailAddress(parts[i]);
        if (toAdd != undefined && toAdd.length > 0) {
            ret.push(toAdd); //TODO: still getting empty messages here for some reason
        }
    }
    return ret;
}

function assignKey(obj, key) {
  typeof obj[key] === 'undefined' ? obj[key] = 1 : obj[key]++;
}

/*  Determines who the message was sent to
    A per message analytic function
*/
function parseTo(message) {
    var headers = message.payload.headers;
    var to = []
    for (k = 0; k < headers.length; k++) {
        var header = headers[k];
        if (header.name == "To" || header.name == "Cc") {
            var parts = splitStringAddElementsToArray(header.value);
            for (j = 0; j < parts.length; j++) {
                var part = parts[j];
                assignKey(toDict, part);
            }
            to += parts;
        }
    }
    //console.log(toDict);
    //console.log(to);
}

//processing logic to perform for each message
function forEachMessage(message) {
    gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': message.id
    }).then(function(res) {
        parseTo(res.result);
    });
}

/*
    Entry point for analytics
    Handler to gather the messages and send them off for analysis
*/
function performAnalytics() {
    //TODO: make multiple calls here to get all the messages (not just the first batch)
    var token = '';
    var MAX_PAGES = 50;
    for (i = 0; i < MAX_PAGES; i++) {
        gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'pageToken': token
        }).then(function(response) {
            var messages = response.result.messages;
            for (i = 0; i < messages.length; i++)
            {
                var message = messages[i];
                forEachMessage(message);
            }
            token = response.pageToken;
        }).then(function(response) {
            console.log(toDict);
        });
    }
    
}