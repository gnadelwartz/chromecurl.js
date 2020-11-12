## curl.js - a simple wrapper for puppeteer, supporting some curl options

###  About

 Save the file `curl.js` to a directory and install puppeteer: 

	npm install https://github.com/GoogleChrome/puppeteer/

 Makeing `curl.js` executeable on Linux/Unix/BSD system allow run it without typing node everytime.

 (c) 2020 gnadelwartz kay@rrr.de

 released to the public domain where applicable.
 Otherwise, it is released under the terms of the WTFPLv2

### Usage

 	[node] curl.js [--wait s] [--maxtime s] [--proxy|--socks[45] host[:port]] [curl_opt] URL

	curl.js is a simple drop in replacement for curl, using pupeteer (chromium) to download html code of web pages composed with javascript.

		--wait <s> - wait seconds to finally render page between load and output
		-m|--max-time seconds - timeout, default 30s
		--proxy|--socks4|--socks5 <host[:port]>
		-A|--user-agent <agent-string>
		-e|--referer <URL>
		-k|--insecure - allow insecure SSL connections
		-o|--output <file> - write html to file
		--create-dirs - create path to file named by -o

 other curl otions are not implemented and simply ignored. Thus you can only use GET requestst, PUSH and data/form
 is currently not supported. FTP will never supported.

### default values

```javascript
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

  var pageargs={
	 waitUntil: 'load'
	 };

  var timeout=30000;
  var wait=0;
```
