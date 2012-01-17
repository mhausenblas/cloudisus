//////////////////////////////////////////////////////////
//
// A cloudisus.allociner instance.
//
// Michael Hausenblas, 2012

var sys = require("sys");
var http = require("http"); 
var url = require("url");
var querystring = require("querystring");
var path = require("path");
var fs = require("fs");
var hash = require("./hash");

// config
var DEBUG = true; // debug messages flag

var SERVER_200 = "200";
var SERVER_404 = "404";
var SERVER_500 = "500";

// working variables
this.contributors = [];
this.contributorCounter = 0;
this.processingQueue = [];

//
// Public cloudisus.allociner API
//


// Ingests a processing job into the queue.
this.ingest = function(ahost, req, res, aURI) {
	var processJobID = hash.sha1(req.headers["user-agent"] + "_" + new Date());
	
	this.processingQueue[processJobID] = aURI;

	if(DEBUG) sys.debug("Got ingest URI " + this.processingQueue[processJobID] + " which is filed under process job ID it under " + processJobID);
	
	// make job persistent
	
	// curl -H 'Accept: application/json' -X POST -d "update=INSERT%20DATA%20%7B%20%20%3Chttp%3A%2F%2Fexample%2Fbook1%3E%20dc%3Atitle%20%22A%20new%20book%22%20%7D" http://zk94OA7JHA4ONCjv1vAx@dydra.com/mhausenblas/sandbox/sparql
	
	serveFromPOST(DATASTORE_ENDPOINT + "?" + querystring.stringify({'update' : 'INSERT%20DATA%20%7B%20%20%3Chttp%3A%2F%2Fexample%2Fbook1%3E%20dc%3Atitle%20%22A%20new%20book%22%20%7D'}),
	 'application/json', DATASTORE_USERNAME, DATASTORE_PASSWORD, function(data, status, msg){ // the on-data-ready anonymous function
		if(data){ // we have the query result data in-mem
			// tell client about the status:
			writeData(res, 
					"Thank you for submitting your <a href='" + aURI + "'>dataset</a> for processing to Cloud Is Us. We will try to find enough contributors (currently there are " + this.contributorCounter + " contributors available) and let you know. Please <a href='" +  "../job/" + processJobID + "'>check back here</a>.\n",
					"text/html");
		}
		else { // error reading the data into memory, examine status
			if(status === SERVER_404) {
				a404(res, "<div style='border: 1px solid red; background: #fafafa; font-family: monospace; font-size: 90%; padding: 3px;'>" + msg + "</div>");
			}
			if(status === SERVER_500) {
				a500(res, "<div style='border: 1px solid red; background: #fafafa; font-family: monospace; font-size: 90%; padding: 3px;'>" + msg + "</div>");
			}
		}
	});
}

// Lists all processing jobs that are in the queue.
// TODO: seems processingQueue is transient - need to check why ...
this.jobs = function(ahost, req, res) {
	var allJobs = "";
	
	if(DEBUG) sys.debug("All jobs " + this.processingQueue);
		
	this.processingQueue.forEach(function( jobID ) {
		allJobs += " JOB: " + this.processingQueue[jobID] + " - " ;
		if(DEBUG) sys.debug("Found job " + this.processingQueue[jobID]);
	});
	
	writeData(res, 
			"Jobs: " + allJobs + " .\n",
			"text/html");
			
}


// Registers and confirms a contributor.
this.contribute = function(ahost, req, res, aURI) {
	var cookies = readCookies(req);
	
	if(DEBUG) sys.debug("Got contributor request from " + req.headers["user-agent"]);	

	if(cookies && cookies["cloudisus-contributor-id"]){ // the contributor is already registered
		if(DEBUG) sys.debug("Got contributor ID " + cookies["cloudisus-contributor-id"]);
		writeData(res, 
			"Thank you for contributing - your contributor ID is [" +  cookies["cloudisus-contributor-id"] + "]",
			"text/plain");
	}
	else { // assign contributor ID
		if(DEBUG) sys.debug("Assigned contributor ID " + 'cloudisus' + this.contributorCounter);
		writeDataWithCookie(res, 
			"Thank you for contributing - if've registerd you under the contributor ID [" +  'cloudisus' + this.contributorCounter + "]",
			 "text/plain",
			"cloudisus-contributor-id",
			"cloudisus" + this.contributorCounter);
			this.contributorCounter = this.contributorCounter + 1; // yey, we've got one more contributor
	}
	
	if(DEBUG) sys.debug("I have " + this.contributorCounter + " contributors so far.");
}

// Executes a query against a number of contributors
this.query = function(ahost, req, res, aURI) {
	var successful = false;
	var params = url.parse(aURI, true);
	var querstString = params.query.q;
	var dsQueryURI = DATASTORE_ENDPOINT + "?" + querystring.stringify({'query' : querstString});
	
	if(DEBUG) sys.debug("Got query string: " + querstString);
	
	parseRemoteFile(dsQueryURI, 'application/json', DATASTORE_USERNAME, DATASTORE_PASSWORD, function(data, status, msg){ // the on-data-ready anonymous function
		if(data){ // we have the query result data in-mem
			writeData(res, data, "text/plain"); 
		}
		else { // error reading the data into memory, examine status
			if(status === SERVER_404) {
				a404(res, "<div style='border: 1px solid red; background: #fafafa; font-family: monospace; font-size: 90%; padding: 3px;'>" + msg + "</div>");
			}
			if(status === SERVER_500) {
				a500(res, "<div style='border: 1px solid red; background: #fafafa; font-family: monospace; font-size: 90%; padding: 3px;'>" + msg + "</div>");
			}
		}
	});
}


// Handles unknown API calls
this.dunno = function(res) {
	a404(res, "<div style='border: 1px solid red; background: #fafafa; font-family: monospace; font-size: 90%; padding: 3px;'>The URI you have requested is not part of the URI space of the Cloud Is Us API. Please try another one or maybe RTFM?</div>");
}

// Serves a static, local file
this.serve = function(filename, mediatype, req, res) {
	if(DEBUG) sys.debug("serving static file: " + filename);
	
	parseLocalFile(filename, function(data, status, msg){
		if(status === SERVER_200){
			writeData(res, data, mediatype);
		}
		if(status === SERVER_404) {
			a404(res, msg);
		}
		if(status === SERVER_500) {
			a500(res, msg);
		}
	});
}


//
// Internal, low-level API
//

// Determines if we have to deal with a local or a remote file
// and parses the CSV data respectively
function resolveFile(ahost, auri, datareadyproc){
	var protocol = url.parse(auri).protocol;
	var host = url.parse(auri).hostname;
	
	//sys.debug("resolving file from host=" + host);
	if(host === ahost) { // local file
		if(DEBUG) sys.debug("trying to parse local file"); 
		return parseLocalFile(auri, datareadyproc);
	}
	else{ // remote file, perform HTTP GET to read content
		if(DEBUG) sys.debug("trying to parse remote file via GET"); 
		return parseRemoteFile(auri, null, null, null, datareadyproc);
	}
}

// Serves file content from local directory
function parseLocalFile(fileuri, datareadyproc) {
	var filename = getFileNameFromURI(fileuri);
	var start = 0, end = 0;

	filename =  path.join(__dirname, '..', filename); // this script runs in the /lib subdirectory, hence need to set path correctly
		
	if(DEBUG) {
		start = new Date().getTime();
		sys.debug("Looking for " + filename);
	} 
	path.exists(filename, function(exists) {
		if(!exists) {
			datareadyproc(null, SERVER_404, getFileNameFromURI(fileuri) + " doesn't exist ...");
			return;
		}
		fs.readFile(filename, function(err, filecontent) {
			if(err) {
				datareadyproc(null, SERVER_500, "Error reading " + getFileNameFromURI(fileuri) + " ...");
				return;
			} 
			end = new Date().getTime();
			if(DEBUG) sys.debug("Successfully served " + filename + " in " + (end-start) + "ms");
			datareadyproc(filecontent, SERVER_200, fileuri);
		});
	});
}

// Perform HTTP GET on external URL and serve content
// TODO: rename to serveFromGET
function parseRemoteFile(fileuri, conneg, username, password, datareadyproc) {
	var host = url.parse(fileuri).hostname;
	var port = url.parse(fileuri).port;
	var pathname = url.parse(fileuri).pathname;
	var reqclient =  http.createClient(port ? port : '80', host);
	var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
	var header = {'Host': host , 'Accept' : (conneg != null) ? conneg : 'text/plain'};
	
	if(username != null) {
		header.Authorization = auth;
		if(DEBUG)  sys.debug("Using basic auth GET " + username + ":" + password);
	}
	if(DEBUG) (conneg != null) ? sys.debug("Accepting " + conneg) : sys.debug("Accepting tex/plain");
	
	if(DEBUG)  sys.debug("GET " + fileuri);
	var request = reqclient.request('GET', fileuri, header);
	request.end();	
	request.on('response', function (response) {
		if(DEBUG) sys.debug("response status:" + response.statusCode);
		if(DEBUG) sys.debug("response header:" + JSON.stringify(response.headers));
		//response.setEncoding('utf8');
		response.on('data', function (filecontent) {
			datareadyproc(filecontent, SERVER_200, fileuri);
		});
	});	
}

// Perform HTTP POST and serve content
function serveFromPOST(fileuri, conneg, username, password, post_data, datareadyproc) {
	var host = url.parse(fileuri).hostname;
	var port = url.parse(fileuri).port;
	var pathname = url.parse(fileuri).pathname;
	var reqclient =  http.createClient(port ? port : '80', host);
	var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
	var header = {'Host': host , 'Content-Type': 'application/x-www-form-urlencoded', 'Accept' : (conneg != null) ? conneg : 'text/plain'};
	
	if(username != null) {
		header.Authorization = auth;
		if(DEBUG)  sys.debug("Using basic auth GET " + username + ":" + password);
	}
	if(DEBUG) (conneg != null) ? sys.debug("Accepting " + conneg) : sys.debug("Accepting tex/plain");
	
	if(DEBUG)  sys.debug("POST " + fileuri);

	// var request = reqclient.request('POST', fileuri, header);
	// request.end();	
	// request.on('response', function (response) {
	// 	if(DEBUG) sys.debug("response status:" + response.statusCode);
	// 	if(DEBUG) sys.debug("response header:" + JSON.stringify(response.headers));
	// 	//response.setEncoding('utf8');
	// 	response.on('data', function (filecontent) {
	// 		datareadyproc(filecontent, SERVER_200, fileuri);
	// 	});
	// });	
					
	var post_options = {
		host: host,
		port: port,
		path: pathname,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': post_data.length,
			'Accept' : (conneg != null) ? conneg : 'text/plain'
		}
	};
	
	  var post_req = http.request(post_options, function(res) {
	      res.setEncoding('utf8');
	      res.on('data', function (chunk) {
	          console.log('Response: ' + chunk);
	      });
	  });
	
	  // post the data
	  post_req.write(post_data);
	  post_req.end();
	
	
}

// function PostCode(codestring) {
//   // Build the post string from an object
//   var post_data = querystring.stringify({
//       'compilation_level' : 'ADVANCED_OPTIMIZATIONS',
//       'output_format': 'json',
//       'output_info': 'compiled_code',
//         'warning_level' : 'QUIET',
//         'js_code' : codestring
//   });
// 
//   // An object of options to indicate where to post to
//   var post_options = {
//       host: 'closure-compiler.appspot.com',
//       port: '80',
//       path: '/compile',
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//           'Content-Length': post_data.length
//       }
//   };
// 
//   // Set up the request
//   var post_req = http.request(post_options, function(res) {
//       res.setEncoding('utf8');
//       res.on('data', function (chunk) {
//           console.log('Response: ' + chunk);
//       });
//   });
// 
//   // post the data
//   post_req.write(post_data);
//   post_req.end();
// 
// }









// Serves data with certain media type
function writeData(res, data, mediatype) {
	res.writeHead(200, {"Content-Type": mediatype});
	res.write(data);
	res.end();
}

// Serves data with certain media type and sets cookie
function writeDataWithCookie(res, data, mediatype, cname, cvalue) {
	res.writeHead(200, {"Content-Type": mediatype, 'Set-Cookie': cname + '=' + cvalue});
	res.write(data);
	res.end();
}

// Extracts the path component of a HTTP URI
function getFileNameFromURI(fileuri){
	var filename = url.parse(fileuri).pathname;
	if(filename.substring(0, 1) === '/') filename = filename.substring(1, filename.length);
	return filename;
}

// Extracts the path component and fragment identifier component of a HTTP URI
function getPathAndFragFromURI(fileuri){
	var filename = url.parse(fileuri).pathname;
	var hash = (url.parse(fileuri).hash || "");
	if(filename.substring(0, 1) === '/') filename = filename.substring(1, filename.length);
	return filename + hash;
}

// Removes the fragment identifier part of a HTTP URI
function stripHashFromURI(fileuri){
	var protocol = url.parse(fileuri).protocol;
	var host = url.parse(fileuri).host;
	var pathname = url.parse(fileuri).pathname;
	return protocol + "//" + host + pathname;
}

// Renders a 404 in HTML
function a404(res, msg){
	res.writeHead(404, {"Content-Type": "text/html"});
	res.write("<h1 style='border-bottom: 1px solid #e0e0e0'>404</h1>\n");
	res.write("<p>Sorry, seems I've got a 404 here for you.</p>\n");
	if(msg) {
		res.write(msg + "\n");
	}
	return res.end();
}

// Renders a 500 in HTML
function a500(res, err){
	res.writeHead(500, {"Content-Type": "text/html"});
	res.write("<h1 style='border-bottom: 1px solid #e0e0e0'>500</h1>\n");
	res.write("<p>Hmm, something went wrong here, my bad, nothing you can do about it (yeah, it's a 500 ;)</p>\n");
	res.write("<p>" + err + "</p>\n");
	res.end();
}

// http://stackoverflow.com/questions/3393854/get-and-set-a-single-cookie-with-node-js-http-server
function readCookies(req){
	var cookies = {};
	if(DEBUG) sys.debug("Reading cookies: " + req.headers.cookie);
	if(req.headers.cookie){
		req.headers.cookie.split(';').forEach(function( cookie ) {
			var parts = cookie.split('=');
			cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
		});
		return cookies;
	}
	else return null;
}
