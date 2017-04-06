// Client ID and API key from the Developer Console
var CLIENT_ID = '96563500577-ha6pjqju1jk2ekudbbfnn4r6juaq05rg.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    });
}

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
        if (toAdd != undefined) {
            ret.push(toAdd);
        }
    }
    return ret;
}

//processing logic to perform for each message
function forEachMessage(message) {
    gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': message.id
    }).then(function(res) {
        res.result.payload.parts
        var headers = res.result.payload.headers;
        //console.log(headers);
        var to = []
        for (k = 0; k < headers.length; k++) {
            var header = headers[k];
            if (header.name == "To" || header.name == "cc") {
                to += splitStringAddElementsToArray(header.value);
            }
            // if (header.name == "Cc") {
            //     to += splitStringAddElementsToArray(header.value);
            // }
        }
        console.log(to);
    });
}

//method for gathering the messages and sending them off for analysis
function performAnalytics() {
    gapi.client.gmail.users.messages.list({
        'userId': 'me'
    }).then(function(response) {
        var messages = response.result.messages;
        for (i = 0; i < messages.length; i++)
        {
            var message = messages[i];
            forEachMessage(message);
        }
    });
}

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        //listLabels();
        performAnalytics();
    } 
    else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
*  Sign in the user upon button click.
*/
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
* Append a pre element to the body containing the given message
* as its text node. Used to display the results of the API call.
*
* @param {string} message Text to be placed in pre element.
*/
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

/**
* Print all Labels in the authorized user's inbox. If no labels
* are found an appropriate message is printed.
*/
function listLabels() {
    gapi.client.gmail.users.labels.list({
        'userId': 'me'
    }).then(function(response) {
        var labels = response.result.labels;
        appendPre('Labels:');

        if (labels && labels.length > 0) {
            for (i = 0; i < labels.length; i++) {
                var label = labels[i];
                appendPre(label.name)
            }
        } 
        else {
            appendPre('No Labels found.');
        }
    });
}
