#!/usr/bin/env node
//
// curl.js - a simple wrapper for puppeteer supporting some curl options
//
// npm install puppeteer
// usage: node curl.js URL
//
// (c) 2020 gnadelwartz kay@rrr.de
// released to the public domain where applicable. Otherwise, it is released under the terms of the WTFPLv2
//
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer');

// default values ----------------------------
const usage="usage: "+process.argv[1].replace(/.*\//,'')+" [--wait s] [--max-time s] [--proxy|--socks[45] host[:port]] [curl_opt] URL";

const help=['', process.argv[1].replace(/.*\//,'')+
	' is a simple drop in replacement for curl, using pupeteer (chromium) to download html code of web pages composed with javascript.', '',
	usage, '',
	'	--wait <s> - wait seconds to finally render page between load and output',
	'	-m|--max-time seconds - timeout, default 30s (curl.js only)',
	'	--proxy|--socks4|--socks5 <host[:port]>',
	'	-A|--user-agent <agent-string>',
	'	-e|--referer <URL>',
	'	-k|--insecure - allow insecure SSL connections',
	'	-o|--output <file> - write html to file',
	'	--create-dirs - create path to file named by -o',
	'	-b|--cookie <file> - raed cookies from file',
	'	-c|--cookie--jar <file> - write cookies to file',
	'	-s|--silent - no error messages etc',
	'	--noproxy <no-proxy-list> - comma seperated domain/ip list',
	'	-w|--write-out %{url_effective} - write out final URL',
	'',
	'	--chromearg - add chromium command line arg (curl.js only), see,',
	'			https://peter.sh/experiments/chromium-command-line-switches/',
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
var file='-';
var url, mkdir, html, useragent, mytimeout,  cookiefrom, cookieto, writeout;


// parse arguments -------------
for (i=2; i<process.argv.length; i++) {
    // split multiple single args -abc -> [-a, -b, -c ]
    var opt=[process.argv[i]];
    if (/^-[^-]./i.test(opt)) {
	opt=opt[0].substring(1).split("").map(function(el) { return '-'+el});
    }
    // iterate over final args
    for (arg of opt) {
	switch(true) {
		case ['-h','--help'].indexOf(arg) >=0:
			console.log(help);
			return;

		case '-L' ==arg: // follow redirect always active
			continue;

		case '--url'==arg:
			url=process.argv[++i];
			continue;

		case '--wait'==arg: // timeout in seconds
			wait=process.argv[++i]
			if ( ! /^[\di\.]+$/.test(wait) ) { // not integer
				console.error("wait is not a number: %s", wait); return 3;
			}
			continue;

		case ['-m','--max-time','--connect-timeout'].indexOf(arg) >=0: // timeout in seconds
			timeout=process.argv[++i]
			if ( ! /^[\d\.]+$/.test(timeout) ) { // not integer
				console.error("timeout is not a number: %s", timeout); return 3;
			}
			continue;

		case arg.startsWith("--socks4"): // socks4 proxy
			pupargs.args.push('--proxy-server=socks4://'+process.argv[++i]);
			continue;
		case arg.startsWith("--socks5"): // socks5 proxy
			pupargs.args.push('--proxy-server=socks5://'+process.argv[++i]);
			continue;
		case ['-X','--proxy','--proxy1.0'].indexOf[arg]: // http proxy
			pupargs.args.push('--proxy-server=http://'+process.argv[++i]);
			continue;

		case ['-A','--user-agent'].indexOf(arg) >=0: // UA
			useragent=process.argv[++i];
			continue;

		case ['-e','--referer'].indexOf(arg) >=0: // referer
			var referer=process.argv[++i]; // must start with http
			if ( ! /^https*:\/\//.test(url) ) { referer="http://"+referer; }
			pageargs['referer']=referer;
			continue;

		case ['-k','--insecure'].indexOf(arg) >=0: // ignore cert not valid, e.g. self signed
			pupargs.args.push('--ignore-certificate-errros');
			continue;

		case ['-o','--output'].indexOf(arg) >=0: // output to file
			file=process.argv[++i];
			continue;

		case '--create-dirs'==arg:
			mkdir=true;
			continue;
	
		case  ['-b','--cookie'].indexOf(arg) >=0:
			cookiefrom=process.argv[++i];
			continue;

		case  ['-c','--cookie-jar'].indexOf(arg) >=0:
			cookieto=process.argv[++i];
			continue;

		case  ['-s','--silent'].indexOf(arg) >=0:
			console.error = function(){};
			continue;

		case '--noproxy' ==arg: // conver xxx.com to xxx.com,*.xxx.com
			pupargs.args.push('--proxy-bypass-list='+process.argv[++i].replace(/,/g, ';')+';*.'+process.argv[i].replace(/,/g, ';*.'));
			continue;

		case  ['-w','--write-out'].indexOf(arg) >=0:
			writeout=process.argv[++i];
			if (!writeout.includes("%{url_effective}")) { console.error("Option --writeout supports %{url_effeticve} only: %s", writeout); }
			continue;

		case '--chromearg' ==arg:
			pupargs.args.push(process.argv[++i]);
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
		case  ['--hostpubmd5','--interface','--stderr--header','-H', '-d',
			'--chipers','--connect-timeout','--continue-at,','-C', '--crlfile','-D','--dump-header','--engine',
			'-E','-F','-K','--config','--libcurl','--limit-rate','--local-port','--max-filesize', 
			'--pass','--pub-key','-T','--upload-file', '-u','--user','-U','--proxy-user',
			'-w','--write-out','-X','--request', '-y','-Y','-z','--time-cond','--max-redirs'].indexOf(arg) >=0: 
			i++;
		// ignore unknpwn options
		case arg.startsWith("-"):
			console.error("ignore option: %s, result may differ from curl", arg);
			continue;
		}

		// not an option = url
		url=arg;
     }
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
	// start browser
	const browser = await puppeteer.launch(pupargs);
	// timeout secs if given
	if (timeout && timeout>0) {
		mytimeout = setTimeout( function() {
				console.error("Timeout of %ss reached", timeout);
				browser.close(); return 2;
  			}, timeout*1000
		);}
	
	// goto page
	const page = await browser.newPage();
	// set UA
	if (!useragent) {
		// remove headless from default UA
		useragent=(await browser.userAgent()).replace(/headless/gi,'');
	}
	page.setUserAgent(useragent);
	//set cookies
	if (cookiefrom) {
		try { // ignore errors on cookie load
			var text = fs.readFileSync(cookiefrom, 'utf-8');
			// convert from curl/wget to JSON
			var cookies=curl2cookies(text);
			if (!cookies) {
				cookies = JSON.parse(text); // seems to be JSON already
			}
			// set browser cookies
			if (cookies) {
				await page.setCookie(...cookies)
			}
		} catch (ignore) {  }
	}
	// wait for page loaded
	await page.goto(url, pageargs);

	// additional wait for final page composing
	if (wait && wait>0 && file != "/dev/null") { await sleep(wait*1000); }
	// clear timeout
	if (mytimeout) { clearTimeout(mytimeout); }

	// get page HMTL
	if (file != "/dev/null") { html = await page.content(); }
	// save cookies
	if (cookieto) {
		var cookies = await page.cookies();
		try { // ignore errors on save
			fs.writeFileSync(cookieto, JSON.stringify(cookies, 0 ,2)); 
		} catch (ignore) {  }
	}
	// close browser
	browser.close();

	// create out dir if requested
	if (mkdir && file.includes('/')) {
		var dir=path.dirname(file);
		try {
			if (! fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}	 
		} catch (err) {
			// exit if out dir can't created
			console.error("cannot cannot create path %s: %s", dir, err);
			return 3;
		}
	}

	// output html, - = stdout
	if (html) {
	    if (file != '-') {
		try { // to file
			fs.writeFileSync(file, html);
		} catch (err) {
			console.error("cannot write to file %s: %s", file, err);
			return 3;
		} 
	    } else { // to STDOUT
		console.log(html);
	    }
	}
	// write final URL with -w
	if (writeout) {
		console.log(writeout.replace("%{url_effective}", await page.url()));
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
				cookie.domain = tokens[0].replace("#HttpOnly_", '')
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
