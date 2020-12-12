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


// convert curl/wget cokkies to puppeter format
// $1 = string, containing newline seperated data in netscape cookie file format
// returns an array for use with puppeteer
// return false if curl or wget signature is not detected
function curl2cookies(source) {
	// split source into lines
	var cookies = [];
	var lines = source.split("\n");

	// source is not a curl/wget/netscape cookie file
	if (! lines[0].toLowerCase().includes("http cookie file")) { return false; }
 
	// iterate over lines in array
	lines.forEach(function(line, index){
		// split line into tab separated tokens
		var tokens = line.split("\t").map(function(e){return e.trim();});
		var cookie = {};
 
		// a valid cookie line must contian 7 tokens
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
 
			// Convert timestamp to a readable format
			var timestamp = tokens[4];
			if (timestamp.length == 17){
				timestamp = Math.floor(timestamp / 1000000 - 11644473600);
			}
			cookie.expiration = timestamp;
			cookie.name = tokens[5];
			cookie.value = tokens[6];
			// add cokkie to puppeter array
			cookies.push(cookie);
		}	
	});
	
	return cookies;
}
