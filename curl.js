#!/usr/bin/env node
//
// curl.js - a simple wrapper for puppeteer supporting some curl options
//
// npm install https://github.com/GoogleChrome/puppeteer/
// usage: node curl.js URL
//
// (c) 2020 gnadelwartz kay@rrr.de
// released to the public domain where applicable. Otherwise, it is released under the terms of the WTFPLv2
//
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer');

// default values ----------------------------
const usage="usage: "+process.argv[1].replace(/.*\//,'')+" [--wait s] [--maxtime s] [--proxy|--socks[45] host[:port]] [curl_opt] URL";

const help=['', process.argv[1].replace(/.*\//,'')+
	' is a simple drop in replacement for curl, using pupeteer (chromium) to download html code of dynamic web pages composed with javascript.', '',
	usage, '',
	'	--wait <s> - wait seconds to finally render page between load and output',
	'	-m|--max-time seconds - timeout, default 30s',
	'	--proxy|--socks4|--socks5 <host[:port]>',
	'	-A|--user-agent <agent-string>',
	'	-e|--referer <URL>',
	'	-k|--insecure - allow insecure SSL connections',
	'	-o|--output <file> - write html to file',
	'	--create-dirs - create path to file named by -o',
	''
	].join("\n");

var pupargs={
	args:[
		'--bswi', // disable as many as possible for a small foot print
		'--single-process',
		'--no-first-run',
		'--disable.gpu',
		'--no-zygote',
		'--no-sandbox',  
		'--incognito', // use inkonito mode
		//'--proxy-server=socks5://localhost:1080', // in case you want a default proxy
		//'--windows-size=1200,100000' // big window to load as may as posible content
	],
	headless: true
};

var pageargs={ waitUntil: 'load' };

var timeout=30000;
var wait=0;
var url, file, mkdir;


// parse arguments in curl style -------------
for (i=2; i<process.argv.length; i++) {
	arg=process.argv[i];
	switch(true) {
		case !['-h','--help'].indexOf(arg):
			console.log(help);
			return;

		case '--url'==arg:
			url=process.argv[++i];
			continue;

		case '--wait'==arg: // timeout in seconds
			wait=process.argv[++i]
			if ( ! /^\d+$/.test(wait) ) { // not integer
				console.error("wait is not a integer: %s", wait); return 3;
			}
			continue;

		case !['-m','--max-time','--connect-timeout'].indexOf(arg): // timeout in seconds
			timeout=process.argv[++i]
			if ( ! /^\d+$/.test(timeout) ) { // not integer
				console.error("timeout is not a integer: %s", timeout); return 3;
			}
			continue;

		case arg.startsWith("--socks4"): // socks4 proxy
			pupargs.args.push('--proxy-server=socks4://'+process.argv[++i]);
			continue;
		case arg.startsWith("--socks5"): // socks5 proxy
			pupargs.args.push('--proxy-server=socks5://'+process.argv[++i]);
			continue;
		case arg.startsWith('--proxy'): // http proxy
		case '-X'==arg:
			pupargs.args.push('--proxy-server=http://'+process.argv[++i]);
			continue;

		case !['-A','--user-agent'].indexOf(arg): // UA
			pupargs.args.push('--user-agent='+process.argv[++i]);
			continue;

		case !['-e','--referer'].indexOf(arg): // referer
			var referer=process.argv[++i]; // must start with http
			if ( ! /^https*:\/\//.test(url) ) { referer="http://"+referer; }
			pageargs['referer']=referer;
			continue;

		case !['-k','--insecure'].indexOf(arg): // ignore cert not valid, e.g. self signed
			pupargs.args.push('--ignore-certificate-errros');
			continue;

		case !['-o','--output'].indexOf(arg): // output to file
			file=process.argv[++i];
			continue;

		case '--create-dirs'==arg:
			mkdir=true;
			continue;

		// curl options with second arg
		case arg.startsWith('--data'):
		case arg.startsWith('--retry'): 
		case arg.startsWith('--cert'): 
		case arg.startsWith('--ca'):
		case arg.startsWith('--form'):
		case arg.startsWith('--keepalive'):
		case arg.startsWith('--key'): 
		case arg.startsWith('--trace'): 
		case arg.startsWith('--speed'):
		case  !['--hostpubmd5','--interface','--stderr--header','-H', '-b','--cookie','-c','--cookie-jar','-d',
			'--chipers','--connect-timeout','--continue-at,','-C', '--crlfile','-D','--dump_header','--engine',
			'-E','-F','-K','--config','--libcurl','--limit-rate','--local-port','--max-filesize', 
			'--noproxy--pass','--pub-key','-T','--upload-file', '-u','--user','-U','--proxy-user',
			'-w','--write-out','-X','--request', '-y','-Y','-z','--time-cond','--max-redirs'].indexOf(arg): 
			i++;
		// ignore unknpwn options
		case arg.startsWith("-"):
			console.error("ignore option: %s, result may differ from curl", arg);
			continue;
		}

		// not an option = url
		url=arg;
} 

// check url -----------------
if (!url) { // empty
	console.error("you must at least specify an URL\n"+usage); return 1;
}
if ( ! /^https*:\/\//.test(url) ) { //add missing http
	url="http://"+url;
}
if ( ! isURL(url) ) { // not url
	console.error("not a valid URL : %s", url); return 1;
}


// run puppeter ---------------
(async () => {
    try {
	const browser = await puppeteer.launch(pupargs);
	// timeout secs if given
	if (timeout && timeout>0) {
		myTimeout = setTimeout( function() {
				console.error("Timeout of %ss reached", timeout);
				browser.close(); return 2;
  			}, timeout*1000
		);}
	
	// goto page, wait until loaded
	const page = await browser.newPage();
	await page.goto(url, pageargs);

	// wait secs if given
	if (wait && wait>0) { await sleep(wait*1000); }

	// get html 
	const html = await page.content();
	clearTimeout(myTimeout);
	browser.close();

	// create dir if requested
	if (mkdir && file && file.includes('/')) {
		var dir=path.dirname(file);
		try {
			if (! fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}	 
		} catch (err) {
			console.error("cannot cannot create path %s: %s", dir, err);
			return 3;
		}
	}

	// output to file
	if (file) {
		try { 
			fs.writeFileSync(file, html);
		} catch (err) {
			console.error("cannot write to file %s: %s", file, err);
			return 3;
		} 
	} else {
		console.log(html);
	}

    // catch errors, e.g. promises, unresoĺved/not existig host etc.
    } catch (err) {
	console.error(err.message);
    }
})();

// checks is URL is a valid url
function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

// emulates sleep with promise
// use await sleep(ms);
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


