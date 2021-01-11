## curl.js - a simple wrapper for puppeteer, supporting many  curl options

### Getting Started

 Save the file `curl.js` to a directory and install puppeteer: 

	wget https://raw.githubusercontent.com/gnadelwartz/puppet-curl/master/curl.js
	npm install puppeteer

 Making `curl.js` executeable on Linux/Unix/BSD system allow run it without typing node everytime.

 (c) 2020 gnadelwartz kay@rrr.de

 Released to the public domain where applicable.
 Otherwise, it is released under the terms of the WTFPLv2

### Usage

 	[node] curl.js [--wait s] [--max-time s] [--proxy|--socks[45] host[:port]] [curl_opt] URL

	curl.js is a simple drop in replacement for curl, using pupeteer (chromium) to download html
	code of web pages composed with javascript.

		--wait <s> - wait seconds to finally render page between load and output (curl.js only)

		-m|--max-time seconds - timeout, default 30s
		-X|--proxy <host[:port]> - http proxy
		--socks4|--socks4a <host[:port]> - socks version 4 proxy
		--socks5|--socks5-hostname  <host[:port]> - socks version 5 proxy
		-A|--user-agent <agent-string>
		-e|--referer <URL>
		-k|--insecure - allow insecure SSL connections
		-o|--output <file> - write html to file
		--create-dirs - create path to file named by -o
		-b|--cookie <file> - raed cookies from file
		-c|--cookie--jar <file> - write cookies to file
		-s|--silent - no error messages etc.
		--noproxy <no-proxy-list> - comma seperated domain/ip list
		-w|--write-out %{url_effective}|%{http_code} - final URL and or response code'
		-L - follow redirects, always on
		--compressed - decompress zipped data transfers, always on
		-i|--include - include headers in output
		-D|--dump-header - dump headers to file

		--chromearg - add chromium command line arg (curl.js only), see
				https://peter.sh/experiments/chromium-command-line-switches/

		--klick xpath - klick on elment of Xpath description, waits wait+1 seconds
		--screenshot file - takes a screenshot and save to file, format jpep or png
		--timeout|--conect-timeout seconds - alias for --max-time

		-h|--help - show all options


 Other curl otions are not implemented and ignored. Thus you can make GET requests in an URL, but PUSH requests and data/form
 upload is currently not supported. FTP may never supported.

 Note: `curl.js` always follows redirects, like curl with `-L|--location`. If you want to see/trace all http redirects you must use curl.

 Note2: Cookie files written by `curl.js -c|--cookie-jar` uses JSON format and are not compatible with Curl/Wget/Netscape cookie file format.
 `curl.js -b|--cookie` is able to read both file formats.
 


### default values

```javascript
  var pupargs = {
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

  var pageargs = {
	 waitUntil: 'load'
	 };

  var timeout = 30000;
  var wait = 0;
```

### Update puppeteer

Update puppeteer once a while to get the latest security fixes and improvements.
To update puppeteer go to the directory where you saved `curl.js` and execute the following command:

```bash
  npm update puppeteer
```

Instead installing a local copy you can also use a global (system wide) installed puppeteer.
In this case you have to rely on the administrators to update puppeteer.

To check if a global installation is availible execute the folloing command:

```bash
  npm list -g puppeteer || echo "no global installation"
```

### Convert Cookies

`cookies.js` converts Netscape/Curl/Wget cookies file from Netscape to JSON format and output to STDOUT.

	usage: node cookies.js <curl-wget-cookie-file> 
