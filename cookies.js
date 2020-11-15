#!/usr/bin/env node
//
// cookies.js - a javascript to convert curl/wget/netscape cookies file to JSON
//
// usage: node cookies.js <curl-coookie-file>
//
// (c) 2020 gnadelwartz kay@rrr.de
// released to the public domain where applicable. Otherwise, it is released under the terms of the WTFPLv2
//
const fs = require('fs')

const file=process.argv[2];
if (file) {
	var text = fs.readFileSync(file, 'utf-8');
	console.log(JSON.stringify(curl2cookies(text),0,2));
} else {
	console.error("Missing filename ...")
}


// converts a sting containing netscape cookies to an Array
// retrun false if curl or wget signature is not detected
function curl2cookies(text) {
	
	// split text into lines
	var cookies = [];
	var lines = text.split("\n");

	if (! lines[0].toLowerCase().includes("http cookie file")) { return false; }
 
	// iterate over lines
	lines.forEach(function(line, index){
		// split lines imto values
		var tokens = line.split("\t");
 
		// we only care for valid cookie def lines
		if (tokens.length == 7) {
			// trim the tokens
			tokens = tokens.map(function(e){return e.trim();});
			var cookie = {};
			cookie.httpOnly = 'false'; 
			// Extract the data
			cookie.domain = tokens[0];
			if (tokens[0].startsWith("#HttpOnly_")) {
				cookie.domain = tokens[0].replace("#HttpOnly_", '')
				cookie.httpOnly = 'true'; 
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
