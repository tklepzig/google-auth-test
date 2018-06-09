$ openssl genrsa -out localhost.key 2048
$ openssl req -new -x509 -key localhost.key -out localhost.cert -days 3650 -subj /CN=localhost

#!/usr/bin/env node

var https = require('https');
var fs = require('fs');
var express = require('express');

var options = {
    key: fs.readFileSync( './localhost.key' ),
    cert: fs.readFileSync( './localhost.cert' ),
    requestCert: false,
    rejectUnauthorized: false
};

var app = express();
var port = process.env.PORT || 443;
var server = https.createServer( options, app );

server.listen( port, function () {
    console.log( 'Express server listening on port ' + server.address().port );
} );