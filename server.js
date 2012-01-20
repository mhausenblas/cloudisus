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
var dateFormat = require('./lib/dateformat');
var allociner = require('./lib/cloudisus.allociner');


http.createServer(function(req, res) {
	var furl = url.parse(req.url).pathname;
	var now = new Date();
	
	//now = now.getFullYear() + "-" + now.getMonth() + 1 + "-" + now.getDate() + "T" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " UTC " + now.getTimezoneOffset()/60;
	
	
	// Cloud Is Us API URI space - routing of paths to function calls
	console.log( dateFormat(now, "isoUtcDateTime") + " - handling " + req.url);
	
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
				case "/static/eyecatcher.gif":
					allociner.serve("./static/eyecatcher.gif", "image/gif", req, res);
					break;
				// contributor nouns:
				case "/contribute-init":
					allociner.contribute(req, res);
					break;
				case "/contributor":
					allociner.contributors(req, res);
					break;
				// job management nouns:
				case "/ingest":
					allociner.ingest(req, res, "http://dbpedia.org/data/Galway.ntriples");//req.url);
					break;
				case "/job":
					allociner.jobs(req, res);
					break;
				// processing nouns:
				case "/query":
					allociner.query(req, res, req.url);
					break;
				default:
					allociner.dunno(res);
			}
		}
	}
}).listen(SERVER_PORT);

console.log("CLOUDISUS - running on server " + SERVER_HOSTNAME + ", listening on port " + SERVER_PORT + " with Node.js version " + process.version);