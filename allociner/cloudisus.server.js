//////////////////////////////////////////////////////////
//
// The cloudisus.com server.
//
// Michael Hausenblas, 2012


var sys = require("sys");
var http = require("http"); 
var url = require("url");
var path = require("path");
var querystring = require("querystring");
var config = require('./cloudisus.config');
var allociner = require('./cloudisus.allociner');


http.createServer(function(req, res) {
	var furl = url.parse(req.url).pathname;
	
	// Cloud Is Us API URI space - routing of paths to function calls
	console.log("CLOUDISUS handling " + req.url);
	
	switch (furl) { 
		case "/":
			allociner.serve("index.html", "text/html", req, res);
			break;
		case  "/ingest":
			allociner.ingest(SERVER_HOSTNAME, req, res, req.url);
			break;
		case "/query":
			allociner.query(SERVER_HOSTNAME, req, res, req.url);
			break;
		default:
			allociner.dunno(res);
	}
}).listen(SERVER_PORT, SERVER_HOSTNAME);

console.log("CLOUDISUS - running on server " + SERVER_HOSTNAME + ", listening on port " + SERVER_PORT);