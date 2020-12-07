#!/usr/bin/env node
/*jshint  esversion:8*/
//
// cookies.js - convert Netscape/Curl/Wget coookies to JSON
//
const fs = require('fs');
const file=process.argv[2];

if (file) {
	var text = fs.readFileSync(file, 'utf-8');
	var cookies=curl2cookies(text);
	if (cookies) {
		console.log(JSON.stringify(cookies,0,2));
	} else {
		console.error("Not a curl/wget/netscpae cookie file: %s", file);
		process.exit(1);
	}
} else {
	console.error("Missing filename, usage: [node] cookies.js <curl-wget-cookie-file>");
	process.exit(2);
}


// converts a sting containing netscape cookies to an Array
// retrun false if curl or wget signature is not detected
function curl2cookies(text) {
	// split text into lines
	var cookies = [];
	var lines = text.split("\n");

	// not a curl/wget cookie file
	if (! lines[0].toLowerCase().includes("http cookie file")) { return false; }
 
	// iterate over lines
	lines.forEach(function(line, index){
		// split lines into tokens
		var tokens = line.split("\t").map(function(e){return e.trim();});
		var cookie = {};
 
		// a valid cookie line must have 7 tokens
		if (tokens.length == 7) {
			if (tokens[0].startsWith("#HttpOnly_")) {
				cookie.domain = tokens[0].replace("#HttpOnly_", '');
				cookie.httpOnly = true; 
			} else {
				cookie.domain = tokens[0];
				cookie.httpOnly = false; 
			}
			cookie.flag = tokens[1] === 'TRUE';
			cookie.path = tokens[2];
			cookie.secure = tokens[3] === 'TRUE';
 
			// Convert date to a readable format
			var timestamp = tokens[4];
			if (timestamp.length == 17){
				timestamp = Math.floor(timestamp / 1000000 - 11644473600);
			}
			cookie.expiration = timestamp;
			cookie.name = tokens[5];
			cookie.value = tokens[6];
			// Record the cookie.
			cookies.push(cookie);
		}	
	});
	
	return cookies;
}
