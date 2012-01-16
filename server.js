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
var allociner = require('./lib/cloudisus.allociner');


http.createServer(function(req, res) {
	var furl = url.parse(req.url).pathname;
	
	// Cloud Is Us API URI space - routing of paths to function calls
	console.log("CLOUDISUS handling " + req.url);
	
	if(furl.indexOf("style") >= 0) { // serve files from library directory
		allociner.serve(furl, "text/css", req, res);
	}
	else{
		if(furl.indexOf("lib") >= 0) { // serve files from the contributor's library directory
			allociner.serve(furl, "application/json", req, res);
		}
		else {
			switch (furl) { // static and/or API calls
				case "/":
					allociner.serve("./static/index.html", "text/html", req, res);
					break;
				case "/contribute":
					allociner.serve("./static/contributor.html", "text/html", req, res);
					break;
				case "/ingest":
					allociner.ingest(SERVER_HOSTNAME, req, res, req.url);
					break;
				case "/query":
					allociner.query(SERVER_HOSTNAME, req, res, req.url);
					break;
				default:
					allociner.dunno(res);
			}
		}
	}
}).listen(SERVER_PORT);

console.log("CLOUDISUS - running on server " + SERVER_HOSTNAME + ", listening on port " + SERVER_PORT);